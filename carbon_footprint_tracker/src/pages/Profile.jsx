import { useEffect, useState } from "react";
import "../styles/Profile.css";

export default function Profile() {
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [badges, setBadges] = useState([]);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState("");
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [averagePerActivity, setAveragePerActivity] = useState({});
  const [goal, setGoal] = useState(500); // Default goal is 500 kg CO₂
  const [goalInput, setGoalInput] = useState(goal);

  useEffect(() => {
    // Load the goal from localStorage if available
    const savedGoal = localStorage.getItem("carbonGoal");
    if (savedGoal) {
      setGoal(parseFloat(savedGoal));
      setGoalInput(parseFloat(savedGoal));
    }

    const logs = JSON.parse(localStorage.getItem("carbonLogs")) || [];
    const total = logs.reduce((acc, log) => acc + log.emission, 0);
    setTotalEmissions(total);

    // Weekly trend (last 7 days)
    const today = new Date();
    const dailyTotals = Array(7).fill(0);
    logs.forEach(log => {
      const date = new Date(log.date);
      const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) {
        dailyTotals[6 - diff] += log.emission;
      }
    });
    setWeeklyTrend(dailyTotals);

    // Average emissions per activity type
    const activityData = {};
    logs.forEach(log => {
      if (!activityData[log.activity]) {
        activityData[log.activity] = { total: 0, count: 0 };
      }
      activityData[log.activity].total += log.emission;
      activityData[log.activity].count++;
    });
    const avgData = {};
    Object.entries(activityData).forEach(([activity, data]) => {
      avgData[activity] = (data.total / data.count).toFixed(2);
    });
    setAveragePerActivity(avgData);

    // Simple badge logic
    const earnedBadges = [];
    if (total >= 100) earnedBadges.push("Eco Warrior");
    if (logs.length >= 5) earnedBadges.push("Carbon Reducer");
    setBadges(earnedBadges);

    // Toast notification
    earnedBadges.forEach((badge) => {
      setToast(`You earned the "${badge}" badge!`);
      setTimeout(() => setToast(""), 3000);
    });

    // Progress bar based on custom goal
    const progressPercent = Math.min((total / goal) * 100, 100);
    setProgress(progressPercent);
  }, [goal]);

  const handleGoalChange = (e) => {
    const newGoal = parseFloat(e.target.value);
    if (!isNaN(newGoal) && newGoal > 0) {
      setGoal(newGoal);
      setGoalInput(newGoal);

      // Save the new goal in localStorage
      localStorage.setItem("carbonGoal", newGoal);
    }
  };

  const getProgressColor = () => {
    if (progress < 33) return "#22c55e"; // green
    if (progress < 66) return "#facc15"; // yellow
    if (progress < 90) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">Your Profile</h1>
      <div className="profile-info">
        <p><strong>Total Carbon Footprint:</strong> {totalEmissions.toFixed(2)} kg CO₂</p>
        <p><strong>Badges:</strong> {badges.length > 0 ? badges.join(", ") : "No badges yet"}</p>
        <p><strong>Progress:</strong> {progress.toFixed(0)}% towards {goal} kg CO₂ goal</p>
      </div>

      <div className="profile-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%`, backgroundColor: getProgressColor() }}
          ></div>
        </div>
      </div>

      <div className="profile-goal">
        <h4>Set Your Carbon Footprint Goal</h4>
        <input
          type="number"
          value={goalInput}
          onChange={handleGoalChange}
          min="1"
          className="goal-input"
        />
      </div>

      <div className="profile-trends">
        <h4>Weekly Emission Trend</h4>
        <ul className="trend-list">
          {weeklyTrend.map((val, i) => (
            <li key={i}>Day {i + 1}: {val.toFixed(2)} kg</li>
          ))}
        </ul>
      </div>

      <div className="profile-averages">
        <h4>Average Emissions per Activity</h4>
        <ul>
          {Object.entries(averagePerActivity).map(([activity, avg], i) => (
            <li key={i}>{activity}: {avg} kg</li>
          ))}
        </ul>
      </div>

      <div className="profile-badges">
        <h4>Badges Earned:</h4>
        <div className="badges">
          {badges.length > 0 ? (
            badges.map((badge, i) => (
              <span key={i} className="badge">{badge}</span>
            ))
          ) : (
            <p>No badges yet</p>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
