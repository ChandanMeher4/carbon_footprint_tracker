import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../styles/Home.css';

export default function Home() {
  const [emissionTotal, setEmissionTotal] = useState(0);
  const [recentLogs, setRecentLogs] = useState([]);
  const weeklyGoal = 50; // default goal (in kg CO₂)

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem('carbonLogs')) || [];
    const now = new Date();
    const thisWeekLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    const total = thisWeekLogs.reduce((sum, log) => sum + (log.emission || 0), 0);
    setEmissionTotal(total);
    setRecentLogs(logs.slice(0, 3)); // last 3 logs
  }, []);

  const getEmissionLevel = () => {
    if (emissionTotal <= 20) return 'Low 🟢';
    if (emissionTotal <= 50) return 'Average 🟡';
    return 'High 🔴';
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Carbon Footprint Tracker</h1>
        <p className="home-description">
          Track emissions, reach sustainability goals, and get insights on how to live greener.
        </p>

        {/* Emission Summary */}
        <div className="emission-summary">
          <strong>This Week’s Emissions:</strong> {emissionTotal.toFixed(2)} kg CO₂
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${Math.min((emissionTotal / weeklyGoal) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="badge">Your Emission Level: {getEmissionLevel()}</div>
        </div>

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div className="recent-logs">
            <h3>Recent Activities</h3>
            <ul>
              {recentLogs.map((log) => (
                <li key={log.id}>
                  <span>{log.activity}</span> – <span>{log.emission} kg</span> on <span>{log.date}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation Shortcuts */}
        <div className="quick-links">
          <Link to="/log" className="quick-link">📝 Log Activity</Link>
          <Link to="/insights" className="quick-link">📊 View Insights</Link>
          <Link to="/tips" className="quick-link">💡 Sustainable Tips</Link>
        </div>

        <div className="home-footer">
          Built with 💚 for a cleaner planet
        </div>
      </div>
    </div>
  );
}
