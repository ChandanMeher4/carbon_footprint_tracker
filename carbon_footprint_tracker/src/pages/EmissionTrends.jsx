import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../styles/EmissionTrends.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function EmissionTrends() {
  const [logs, setLogs] = useState([]);
  const [view, setView] = useState("weekly");

  useEffect(() => {
    const savedLogs = JSON.parse(localStorage.getItem("carbonLogs")) || [];
    setLogs(savedLogs);
  }, []);

  // ✅ Function to get YYYY-MM-DD in LOCAL time
  const localISODate = (date) =>
    date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');

  const groupEmissions = (interval) => {
    const map = new Map();

    logs.forEach(log => {
      const date = new Date(log.date);
      let key;

      if (interval === 'weekly') {
        key = `Week ${Math.ceil(date.getDate() / 7)}`;
      } else if (interval === 'monthly') {
        key = date.toLocaleString('default', { month: 'short' });
      } else if (interval === 'daily') {
        key = localISODate(date); // ✅ Uses local date string
      }

      map.set(key, (map.get(key) || 0) + log.emission);
    });

    let labels = [...map.keys()];
    let data = [...map.values()];

    // Sort daily labels chronologically
    if (interval === 'daily') {
      const sorted = labels
        .map((label, i) => ({ label, value: data[i] }))
        .sort((a, b) => new Date(a.label) - new Date(b.label));

      labels = sorted.map(item => item.label);
      data = sorted.map(item => item.value);
    }

    // Format daily labels like "10 May"
    const formattedLabels = (interval === 'daily')
      ? labels.map(dateStr => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('default', { day: 'numeric', month: 'short' });
        })
      : labels;

    return { labels: formattedLabels, data };
  };

  const { labels, data } = groupEmissions(view);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Carbon Footprint (kg CO₂)',
        data,
        borderColor: '#3b82f6',
        backgroundColor: '#93c5fd',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const tips = [
    "Use public transport or carpool whenever possible.",
    "Switch to LED bulbs and turn off unused appliances.",
    "Try a meat-free day once a week.",
    "Wash clothes in cold water to save energy."
  ];

  const leaderboard = () => {
    const userCount = {};
    logs.forEach(log => {
      userCount[log.user || 'You'] = (userCount[log.user || 'You'] || 0) + log.emission;
    });

    return Object.entries(userCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  return (
    <div className="emission-container">
      <div className="header">
        <h1 className="emission-title">Insights & Trends</h1>
        <div className="view-toggle">
          <button className={view === "daily" ? "active" : ""} onClick={() => setView("daily")}>Daily</button>
          <button className={view === "weekly" ? "active" : ""} onClick={() => setView("weekly")}>Weekly</button>
          <button className={view === "monthly" ? "active" : ""} onClick={() => setView("monthly")}>Monthly</button>
        </div>
      </div>

      <Line data={chartData} />

      <div className="section">
        <h3>Eco Tips</h3>
        <ul className="tips-list">
          {tips.map((tip, i) => (
            <li key={i}>🌱 {tip}</li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3>Top Emitters</h3>
        <ol className="leaderboard">
          {leaderboard().map(([user, emission], i) => (
            <li key={i}>
              <strong>{user}</strong>: {emission.toFixed(2)} kg CO₂
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
