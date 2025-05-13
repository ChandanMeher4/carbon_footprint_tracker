import { useEffect, useState } from "react";
import "../styles/Profile.css";

export default function Profile() {
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [badges, setBadges] = useState([]);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState("");
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [averagePerActivity, setAveragePerActivity] = useState({});
  const [goal, setGoal] = useState(500);
  const [goalInput, setGoalInput] = useState(goal);
  const [topActivities, setTopActivities] = useState([]);
  const [estimatedDate, setEstimatedDate] = useState("");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
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
    const dateSet = new Set();
    logs.forEach(log => {
      const date = new Date(log.date);
      const dateStr = date.toDateString();
      dateSet.add(dateStr);
      const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) {
        dailyTotals[6 - diff] += log.emission;
      }
    });
    setWeeklyTrend(dailyTotals);

    // Streak logic
    let tempStreak = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dateSet.has(d.toDateString())) tempStreak++;
      else break;
    }
    setStreak(tempStreak);

    // Activity averages & top contributors
    const activityData = {};
    logs.forEach(log => {
      if (!activityData[log.activity]) {
        activityData[log.activity] = { total: 0, count: 0 };
      }
      activityData[log.activity].total += log.emission;
      activityData[log.activity].count++;
    });

    const avgData = {};
    const topContributors = [];
    Object.entries(activityData).forEach(([activity, data]) => {
      avgData[activity] = (data.total / data.count).toFixed(2);
      topContributors.push({ activity, total: data.total });
    });

    setAveragePerActivity(avgData);
    setTopActivities(topContributors.sort((a, b) => b.total - a.total).slice(0, 3));

    // Badge logic
    const earnedBadges = [];
    if (total >= 100) earnedBadges.push("Eco Warrior");
    if (logs.length >= 5) earnedBadges.push("Carbon Reducer");
    if (streak >= 3) earnedBadges.push("Consistency Champ");
    setBadges(earnedBadges);

    earnedBadges.forEach((badge) => {
      setToast(`You earned the "${badge}" badge!`);
      setTimeout(() => setToast(""), 3000);
    });

    // Progress
    const progressPercent = Math.min((total / goal) * 100, 100);
    setProgress(progressPercent);

    // Goal Estimation
    const avgDaily = dailyTotals.reduce((a, b) => a + b, 0) / 7;
    if (avgDaily > 0) {
      const remaining = goal - total;
      const daysLeft = Math.ceil(remaining / avgDaily);
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysLeft);
      setEstimatedDate(futureDate.toDateString());
    } else {
      setEstimatedDate("Insufficient data");
    }

  }, [goal]);

  const handleGoalChange = (e) => {
    const newGoal = parseFloat(e.target.value);
    if (!isNaN(newGoal) && newGoal > 0) {
      setGoal(newGoal);
      setGoalInput(newGoal);
      localStorage.setItem("carbonGoal", newGoal);
    }
  };

  const getProgressColor = () => {
    if (progress < 33) return "#22c55e";
    if (progress < 66) return "#facc15";
    if (progress < 90) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">Your Profile</h1>

      <div className="profile-info">
        <p><strong>Total Carbon Footprint:</strong> {totalEmissions.toFixed(2)} kg CO₂</p>
        <p><strong>Badges:</strong> {badges.length > 0 ? badges.join(", ") : "No badges yet"}</p>
        <p><strong>Progress:</strong> {progress.toFixed(0)}% towards {goal} kg CO₂ goal</p>
        <p><strong>Estimated Completion:</strong> {estimatedDate}</p>
        <p><strong>Current Streak:</strong> {streak} day(s)</p>
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

      <div className="profile-top-activities">
        <h4>Top Contributing Activities</h4>
        <ul>
          {topActivities.map((item, i) => (
            <li key={i}>{item.activity}: {item.total.toFixed(2)} kg</li>
          ))}
        </ul>
      </div>

      <div className="profile-suggestions">
        <h4>Suggestions to Offset</h4>
        <ul>
          <li>🚴 Try biking instead of short car rides</li>
          <li>🌿 Plant a tree for every 50 kg CO₂ emitted</li>
          <li>💡 Switch to energy-efficient lighting</li>
        </ul>
      </div>

      <div className="profile-share">
        <button onClick={() => alert("Progress shared! (mock)")} className="share-button">
          📤 Share Your Progress
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
