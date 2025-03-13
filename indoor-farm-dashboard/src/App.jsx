import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import axios from "axios";

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [graphData, setGraphData] = useState([]);

  // ✅ Fetch latest sensor readings
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/latest");
        setSensorData(response.data.latest_readings);
      } catch (error) {
        console.error("Error fetching latest sensor data:", error);
      }
    };

    fetchLatestData();
    const interval = setInterval(fetchLatestData, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Fetch graph data every 20 seconds
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/graph-data");
        setGraphData(response.data.graph_data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    };

    fetchGraphData();
    const interval = setInterval(fetchGraphData, 20000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Prepare data for Plotly
  const plotData = graphData.reduce((acc, entry) => {
    const { field, time, value } = entry;
    if (!acc[field]) acc[field] = { x: [], y: [], name: field, type: "scatter", mode: "lines" };
    acc[field].x.push(time);
    acc[field].y.push(value);
    return acc;
  }, {});

  return (
    <div className="App">
      <h1>Indoor Farm Dashboard</h1>

      {/* ✅ Display Real-Time Sensor Data */}
      <div>
        {sensorData.length > 0 ? (
          <ul>
            {sensorData.map((reading, index) => (
              <li key={index}>
                {reading.field}: {reading.value}
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading sensor data...</p>
        )}
      </div>

      {/* ✅ Display Graph */}
      <Plot
        data={Object.values(plotData)}
        layout={{
          title: "Sensor Data Trends",
          xaxis: { title: "Time" },
          yaxis: { title: "Sensor Values" },
          autosize: true,
        }}
      />
    </div>
  );
}

export default App;