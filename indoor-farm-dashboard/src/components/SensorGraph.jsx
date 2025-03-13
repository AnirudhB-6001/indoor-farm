import Plot from "react-plotly.js";

function SensorGraph({ title, data, timestamps }) {
  return (
    <div className="graph-container">
      <h2>{title}</h2>
      <Plot
        data={data.map((sensor) => ({
          x: timestamps || [],
          y: Array.isArray(sensor.values) ? sensor.values : [], // ✅ Ensure values is always an array
          type: "scatter",
          mode: "lines",
          name: sensor.name,
          line: { color: sensor.color },
        }))}
        layout={{
          width: 600,
          height: 300,
          title,
          xaxis: { title: "Time" },
          yaxis: { title: "Value" },
        }}
      />
    </div>
  );
}

export default SensorGraph;