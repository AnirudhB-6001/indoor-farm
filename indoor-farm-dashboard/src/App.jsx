import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Plot from "react-plotly.js";

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [alertFeed, setAlertFeed] = useState([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/latest");

        // ✅ Keep only the last 50 points for a moving window effect
        setSensorData((prev) => {
          const updatedData = [...prev, ...response.data.latest_readings].slice(-50);
          return updatedData;
        });
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    const fetchAlerts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/alerts");
        setAlertFeed((prev) => {
          const newFeed = [...response.data.alerts, ...prev].slice(0, 100);
          return newFeed;
        });
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchSensorData();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchSensorData();
      fetchAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [alertFeed]);

  // ✅ Define colors for each sensor
  const sensorColors = {
    temperature: "red",
    humidity: "blue",
    co2: "green",
    light: "orange",
    pH: "purple",
    EC: "brown",
    water_level: "cyan",
    water_temp: "pink",
  };

  return (
    <div className="dashboard">
      <h1>Indoor Farm Dashboard</h1>

      {/* ✅ Graph Display */}
      <div className="graph-container">
        <h2>Real-Time Sensor Data</h2>
        <Plot
          data={Object.keys(sensorColors).map((sensor) => ({
            x: sensorData
              .filter((d) => d.field === sensor)
              .map((d) => d.time),
            y: sensorData
              .filter((d) => d.field === sensor)
              .map((d) => d.value),
            type: "scatter",
            mode: "lines", // ✅ Connects the points into a line
            line: { color: sensorColors[sensor] },
            name: sensor.charAt(0).toUpperCase() + sensor.slice(1),
          }))}
          layout={{
            title: "Sensor Readings Over Time",
            xaxis: { title: "Time", type: "date" },
            yaxis: { title: "Value", autorange: true },
            legend: { x: 1, y: 1 },
          }}
        />
      </div>

      {/* ✅ System Feed */}
      <div className="feed-container">
        <h2>System Feed</h2>
        <div className="feed-box" ref={feedRef}>
          {alertFeed.length > 0 ? (
            (showAllAlerts ? alertFeed : alertFeed.slice(0, 5)).map((alert, index) => (
              <p key={index} className="feed-entry">
                <strong>[{alert.timestamp}]</strong> {alert.alerts.join(" | ")}
              </p>
            ))
          ) : (
            <p>No alerts yet.</p>
          )}
        </div>
        <button className="toggle-button" onClick={() => setShowAllAlerts(!showAllAlerts)}>
          {showAllAlerts ? "Show Less" : "Show More"}
        </button>
      </div>
    </div>
  );
}

export default App;
