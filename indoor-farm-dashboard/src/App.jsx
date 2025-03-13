import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import SystemFeed from "./components/SystemFeed";
import "./App.css";

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [showCategory, setShowCategory] = useState({
    environmental: true,
    airQuality: true,
    water: true,
  });

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/latest");

        setSensorData((prev) => {
          const updatedData = [...prev, ...response.data.latest_readings].slice(-50);
          return updatedData;
        });
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Define categories and colors
  const categories = {
    environmental: {
      title: "Environmental Conditions",
      sensors: {
        temperature: "red",
        humidity: "blue",
        light: "yellow",
      },
    },
    airQuality: {
      title: "Air Quality & Gas Levels",
      sensors: {
        co2: "green",
      },
    },
    water: {
      title: "Water Parameters",
      sensors: {
        water_temp: "pink",
        water_level: "cyan",
        ph: "purple",
        ec: "brown",
      },
    },
  };

  return (
    <div className="dashboard">
      <div className="graphs-container">
        {Object.keys(categories).map((categoryKey) => {
          const category = categories[categoryKey];
  
          return (
            <div key={categoryKey} className="graph-container">
              <h2 onClick={() => setShowCategory({ ...showCategory, [categoryKey]: !showCategory[categoryKey] })}>
                {category.title} {showCategory[categoryKey] ? "▼" : "►"}
              </h2>
  
              {showCategory[categoryKey] && (
                <Plot
                  data={Object.keys(category.sensors).map((sensor) => ({
                    x: sensorData
                      .filter((d) => d.field === sensor)
                      .map((d) => d.time),
                    y: sensorData
                      .filter((d) => d.field === sensor)
                      .map((d) => d.value),
                    type: "scatter",
                    mode: "lines",
                    line: { color: category.sensors[sensor] },
                    name: sensor.charAt(0).toUpperCase() + sensor.slice(1),
                  }))}
                  layout={{
                    title: category.title,
                    xaxis: { title: "Time", type: "date" },
                    yaxis: { title: "Value", autorange: true },
                    legend: { x: 1, y: 1 },
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
  
      {/* ✅ System Feed (Now on the right side) */}
      <div className="system-feed-container">
        <h2>System Feed</h2>
        <SystemFeed />
      </div>
    </div>
  );  
}

export default App;