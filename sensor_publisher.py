import paho.mqtt.client as mqtt
import json
import random
import time

MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sensor/data"

client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)

def generate_sensor_data():
    return {
        "temperature": round(random.uniform(18, 24), 2),
        "humidity": round(random.uniform(50, 70), 2),
        "co2": round(random.uniform(400, 800), 2),
        "light": round(random.uniform(200, 800), 2),
        "pH": round(random.uniform(5.5, 6.5), 2),
        "EC": round(random.uniform(1.5, 2.5), 2),
        "water_level": round(random.uniform(10, 100), 2),
        "water_temp": round(random.uniform(20, 22), 2)
    }

while True:
    sensor_data = generate_sensor_data()
    payload = json.dumps(sensor_data)
    client.publish(MQTT_TOPIC, payload)
    print(f"Published: {payload}")
    time.sleep(20)  # Send data every 20 seconds
