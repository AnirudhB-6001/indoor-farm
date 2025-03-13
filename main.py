from fastapi import FastAPI
import paho.mqtt.client as mqtt
import json
from influxdb_client import InfluxDBClient, Point
from fastapi.middleware.cors import CORSMiddleware

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

# ✅ Callback when MQTT receives data
def on_message(client, userdata, msg):
    payload = json.loads(msg.payload.decode())
    print(f"Received Data: {payload}")

    # Store data in InfluxDB
    point = Point("sensor_reading") \
        .tag("location", "indoor_farm_1") \
        .field("temperature", payload["temperature"]) \
        .field("humidity", payload["humidity"]) \
        .field("co2", payload["co2"]) \
        .field("light", payload["light"]) \
        .field("pH", payload["pH"]) \
        .field("EC", payload["EC"]) \
        .field("water_level", payload["water_level"]) \
        .field("water_temp", payload["water_temp"])
    
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

# ✅ API to get the **latest** sensor data
@app.get("/latest")
def get_latest_sensor_data():
    query = f"""
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: -5m)  // Get last 5 minutes
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

    return {"latest_readings": data}

# ✅ API to fetch data for graphs (last 30 minutes)
@app.get("/graph-data")
def get_graph_data():
    query = f"""
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: -30m)
      |> filter(fn: (r) => r["_measurement"] == "sensor_reading")
    """
    
    try:
        result = query_api.query(org=INFLUXDB_ORG, query=query)
    except Exception as e:
        return {"error": f"Failed to fetch graph data: {str(e)}"}
    
    data = []
    for table in result:
        for record in table.records:
            data.append({
                "time": record.get_time().isoformat(),
                "field": record.get_field(),
                "value": record.get_value()
            })

    return {"graph_data": data}

# ✅ Start FastAPI (only when running this script directly)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)