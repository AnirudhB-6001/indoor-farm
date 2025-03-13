import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../App.css"; // ✅ Import styles

const SystemFeed = () => {
  const [alerts, setAlerts] = useState([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/alerts");
        setAlerts((prev) => [...response.data.alerts, ...prev].slice(0, 100));
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [alerts]);

  return (
    <div className="feed-container">
      <h2>System Feed</h2>
      <div className="feed-box" ref={feedRef}>
        {alerts.length > 0 ? (
          (showAllAlerts ? alerts : alerts.slice(0, 5)).map((alert, index) => (
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
  );
};

export default SystemFeed;