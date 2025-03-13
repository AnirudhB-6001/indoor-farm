from fastapi import FastAPI
import paho.mqtt.client as mqtt
import json
from influxdb_client import InfluxDBClient, Point
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware  # Import CORS Middleware

# ✅ Initialize FastAPI
app = FastAPI()

# ✅ Apply CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TEMPORARY: Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ InfluxDB Configuration
INFLUXDB_URL = "http://localhost:8086"
INFLUXDB_TOKEN = "aSVl-LtvCEK99Id2gEVxHqEE72aKN7NurDqezd0BJWh37FA2Js6GFMveqh3uoP4ahVoFS9UNJ6cIupxpXk9obQ=="  # Replace with your actual token
INFLUXDB_ORG = "indoor-farm"
INFLUXDB_BUCKET = "sensor_data"

client_influx = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
query_api = client_influx.query_api()

# ✅ MQTT Broker Configuration
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sensor/data"

# ✅ Store alerts in a list (latest 10 alerts)
alerts_list = []

# ✅ Define acceptable sensor ranges
THRESHOLDS = {
    "temperature": (18, 26),  
    "humidity": (50, 70),  
    "co2": (400, 1000),  
    "light": (200, 800),  
    "pH": (5.5, 6.5),  
    "EC": (1.5, 2.5),  
    "water_level": (10, 90),  
    "water_temp": (18, 25),  
}

# ✅ Callback when MQTT receives data
def on_message(client, userdata, msg):
    global alerts_list
    payload = json.loads(msg.payload.decode())
    print(f"Received Data: {payload}")

    # Store sensor values in InfluxDB
    point = Point("sensor_reading").tag("location", "indoor_farm_1")

    # Generate alerts based on thresholds
    alert_messages = []
    for key, value in payload.items():
        point.field(key, value)

        # Check if value is out of range
        if key in THRESHOLDS:
            min_val, max_val = THRESHOLDS[key]
            if value < min_val or value > max_val:
                alert_messages.append(f"⚠️ {key.capitalize()} out of range: {value}")

    # Store alert messages in `alerts_list`
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if alert_messages:
        alerts_list.insert(0, {"timestamp": timestamp, "alerts": alert_messages})
    else:
        alerts_list.insert(0, {"timestamp": timestamp, "alerts": ["✅ System running optimally."]})

    # Keep only the last 10 alerts
    alerts_list = alerts_list[:10]

    # Write to InfluxDB
    write_api = client_influx.write_api()
    write_api.write(bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG, record=point)

# ✅ MQTT Client Setup
mqtt_client = mqtt.Client()
mqtt_client.on_message = on_message
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
mqtt_client.subscribe(MQTT_TOPIC)
mqtt_client.loop_start()

# ✅ API to check if FastAPI is running
@app.get("/")
def read_root():
    return {"message": "Indoor Farm System API is running"}

# ✅ API to fetch latest alerts
@app.get("/alerts")
def get_alerts():
    return {"alerts": alerts_list}

# ✅ API to get the **latest** sensor data
@app.get("/latest")
def get_latest_sensor_data():
    query = f"""
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: -5m)  
      |> filter(fn: (r) => r["_measurement"] == "sensor_reading")
      |> last()
    """
    try:
        result = query_api.query(org=INFLUXDB_ORG, query=query)
    except Exception as e:
        return {"error": f"Failed to fetch latest data: {str(e)}"}
    
    data = []
    for table in result:
        for record in table.records:
            data.append({
                "time": record.get_time().isoformat(),
                "field": record.get_field(),
                "value": record.get_value()
            })

    if not data:
        return {"message": "No sensor data found."}

    return {"latest_readings": data}

# ✅ Start FastAPI (only when running this script directly)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
