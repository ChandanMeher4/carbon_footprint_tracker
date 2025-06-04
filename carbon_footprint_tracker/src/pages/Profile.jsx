import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase";
import "../styles/Profile.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [badges, setBadges] = useState([]);
  const [progress, setProgress] = useState(0);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [averagePerActivity, setAveragePerActivity] = useState({});
  const [goal, setGoal] = useState(500); // Total emissions goal
  const [goalInput, setGoalInput] = useState(500);
  const [topActivities, setTopActivities] = useState([]);
  const [estimatedDate, setEstimatedDate] = useState("");
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  // New state variables for user profile details
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Badge definitions with icons
  const allBadges = {
    "Eco Warrior": { desc: "Achieve 100+ kg CO₂ emission total.", icon: "🌳" },
    "Carbon Reducer": { desc: "Log 5 or more distinct activities.", icon: "📝" },
    "Consistency Champ": { desc: "Log activity for 3 consecutive days.", icon: "⚡" },
    "Green Pioneer": { desc: "First log recorded!", icon: "🚀" },
    "Low Carbon Hero": { desc: "Maintain weekly emissions below 20kg for a month.", icon: "🏅" },
  };

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchUserDataAndLogs = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userRef);
        let userData;

        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          // Set profile details from Firestore
          setProfileName(userData.name || "");
          setProfileAge(userData.age || "");
          setProfileGender(userData.gender || "");

          const savedGoal = userData.carbonGoal || 500;
          setGoal(savedGoal);
          setGoalInput(savedGoal);
        } else {
          // If user document doesn't exist, create it with basic info and default goal
          userData = {
            carbonGoal: 500,
            name: "", // Initialize with empty strings
            age: "",
            gender: "",
            email: currentUser.email // Set email from auth
          };
          await setDoc(userRef, userData);
          setGoal(500);
          setGoalInput(500);
          setProfileName("");
          setProfileAge("");
          setProfileGender("");
        }

        const logsCollectionRef = collection(db, "users", currentUser.uid, "carbonLogs");
        const logsQuery = query(logsCollectionRef, orderBy("date", "asc"));
        const logsSnapshot = await getDocs(logsQuery);

        const logs = logsSnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            date: data.date?.toDate() // Convert Timestamp to JS Date
          };
        }).filter(log => log.date instanceof Date && !isNaN(log.date.getTime())); // Filter out any invalid dates

        // --- PERFORM CALCULATIONS WITH FETCHED LOGS ---

        const total = logs.reduce((acc, log) => acc + (log.emission || 0), 0);
        setTotalEmissions(total);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyTotals = Array(7).fill(0); // [day-6, ..., today]
        const dateSet = new Set();

        logs.forEach(log => {
          const logDate = log.date;
          if (!logDate || isNaN(logDate.getTime())) return;

          logDate.setHours(0, 0, 0, 0); // Normalize log date
          const dateStr = logDate.toISOString().slice(0, 10);
          dateSet.add(dateStr);

          const diff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff < 7) {
            dailyTotals[6 - diff] += log.emission;
          }
        });
        setWeeklyTrend(dailyTotals);

        // Streak logic
        let tempStreak = 0;
        for (let i = 0; i <= 6; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dStr = d.toISOString().slice(0, 10);
          if (dateSet.has(dStr)) {
            tempStreak++;
          } else {
            if (i > 0) break; // Break if a gap is found before today
            else if (i === 0 && !dateSet.has(dStr)) { // If today has no log, streak is 0
              tempStreak = 0;
              break;
            }
          }
        }
        setStreak(tempStreak);

        // Activity averages & top contributors
        const activityData = {};
        logs.forEach(log => {
          if (!activityData[log.activity]) {
            activityData[log.activity] = { total: 0, count: 0 };
          }
          activityData[log.activity].total += (log.emission || 0);
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
        if (logs.length >= 5) earnedBadges.push("Carbon Reducer"); // Example: 5 distinct activities
        if (tempStreak >= 3) earnedBadges.push("Consistency Champ");
        if (logs.length > 0 && userData.firstLog === undefined) {
          earnedBadges.push("Green Pioneer");
          // To prevent re-earning, you'd update the user doc:
          // await updateDoc(userRef, { firstLog: true });
        }
        // Additional badge for consistent low emissions (more complex to track fully here)
        // if (checkLowCarbonHero(logs)) earnedBadges.push("Low Carbon Hero");

        setBadges(earnedBadges);

        // Progress
        const progressPercent = Math.min((total / goal) * 100, 100);
        setProgress(progressPercent);

        // Goal Estimation
        const avgDaily = dailyTotals.reduce((a, b) => a + b, 0) / 7;
        if (avgDaily > 0) {
          const remaining = goal - total;
          const daysLeft = Math.ceil(remaining / avgDaily);
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + daysLeft);
          setEstimatedDate(futureDate.toDateString());
        } else {
          setEstimatedDate("Insufficient data or no recent activity to estimate.");
        }

      } catch (error) {
        console.error("Profile.js: Error fetching user data or logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndLogs();
  }, [currentUser, goal]); // Re-run when currentUser or goal changes

  const handleGoalChange = async (e) => {
    const newGoal = parseFloat(e.target.value);
    if (!isNaN(newGoal) && newGoal > 0 && currentUser) {
      setGoal(newGoal);
      setGoalInput(newGoal);
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          carbonGoal: newGoal,
        });
        setToast("Goal updated successfully!");
      } catch (error) {
        console.error("Error updating goal:", error);
        setToast("Failed to update goal.");
      }
    }
  };

  const handleProfileUpdate = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: profileName,
        age: profileAge,
        gender: profileGender,
      });
      setToast("Profile updated successfully!");
      setIsEditingProfile(false); // Exit edit mode
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };


  const getProgressColor = () => {
    if (progress < 33) return "#22c55e"; // Green
    if (progress < 66) return "#facc15"; // Yellow
    if (progress < 90) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  // Toast message management
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  if (loading) {
    return (
      <div className="profile-container">
        <h1 className="profile-title">Your Profile</h1>
        <p>Loading your profile and achievements...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">Your Carbon Profile</h1>

      {currentUser ? (
        <>
          {/* Personal Details Section */}
          <div className="profile-section">
            <h4>Personal Details
              <button
                className="edit-profile-button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
              >
                {isEditingProfile ? "Cancel" : "Edit"}
              </button>
            </h4>
            <div className="personal-details-grid">
              <div>
                <strong>Name:</strong>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="profile-input"
                  />
                ) : (
                  <span> {profileName || "N/A"}</span>
                )}
              </div>
              <div>
                <strong>Email:</strong>
                <span> {currentUser.email}</span>
              </div>
              <div>
                <strong>Age:</strong>
                {isEditingProfile ? (
                  <input
                    type="number"
                    value={profileAge}
                    onChange={(e) => setProfileAge(e.target.value)}
                    className="profile-input"
                    min="1"
                  />
                ) : (
                  <span> {profileAge || "N/A"}</span>
                )}
              </div>
              <div>
                <strong>Gender:</strong>
                {isEditingProfile ? (
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                    className="profile-input"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <span> {profileGender || "N/A"}</span>
                )}
              </div>
              {isEditingProfile && (
                <div className="save-button-container">
                  <button onClick={handleProfileUpdate} className="save-profile-button">
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-summary-cards">
            <div className="summary-card">
              <h3>Total Footprint</h3>
              <p className="card-value">{totalEmissions.toFixed(2)} kg CO₂</p>
            </div>
            <div className="summary-card">
              <h3>Progress to Goal</h3>
              <div className="progress-bar-small">
                <div
                  className="progress-fill-small"
                  style={{ width: `${progress}%`, backgroundColor: getProgressColor() }}
                ></div>
              </div>
              <p className="card-value">{progress.toFixed(0)}% of {goal} kg</p>
            </div>
            <div className="summary-card">
              <h3>Current Streak</h3>
              <p className="card-value">{streak} Day(s) 🔥</p>
            </div>
          </div>

          <div className="profile-section">
            <h4>Your Achievements</h4>
            {badges.length > 0 ? (
              <div className="badge-grid">
                {badges.map((badgeName, i) => (
                  <div key={i} className="badge-item">
                    <span className="badge-icon">{allBadges[badgeName]?.icon || '✨'}</span>
                    <p className="badge-name">{badgeName}</p>
                    <p className="badge-description">{allBadges[badgeName]?.desc || ''}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-message">No badges earned yet. Keep logging activities!</p>
            )}
          </div>

          <div className="profile-section">
            <h4>Set Your Total Carbon Footprint Goal</h4>
            <div className="goal-setting-area">
                <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(parseFloat(e.target.value) || 0)} // Update input state immediately
                    onBlur={handleGoalChange} // Save on blur
                    onKeyPress={(e) => { // Save on Enter key
                        if (e.key === 'Enter') {
                            handleGoalChange(e);
                            e.target.blur(); // Remove focus after enter
                        }
                    }}
                    min="1"
                    className="goal-input-large"
                    aria-label="Set your total carbon footprint goal in kilograms of CO2"
                /> kg CO₂
                <p className="estimated-date-info">Estimated to reach goal by: <strong>{estimatedDate}</strong></p>
            </div>
          </div>

          <div className="profile-section">
            <h4>Weekly Emission Trend</h4>
            {weeklyTrend.length > 0 && weeklyTrend.some(val => val > 0) ? (
              <ul className="trend-list">
                {weeklyTrend.map((val, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const dayName = d.toLocaleDateString('default', { weekday: 'short' });
                    return <li key={i}>{dayName}: {val.toFixed(2)} kg</li>;
                })}
              </ul>
            ) : (
                <p className="no-data-message">No emission data for the last 7 days.</p>
            )}
          </div>

          <div className="profile-section">
            <h4>Average Emissions per Activity</h4>
            {Object.keys(averagePerActivity).length > 0 ? (
              <ul>
                {Object.entries(averagePerActivity).map(([activity, avg], i) => (
                  <li key={i}><strong>{activity}</strong>: {avg} kg</li>
                ))}
              </ul>
            ) : (
                <p className="no-data-message">No activity data available.</p>
            )}
          </div>

          <div className="profile-section">
            <h4>Top Contributing Activities (All Time)</h4>
            {topActivities.length > 0 ? (
              <ul>
                {topActivities.map((item, i) => (
                  <li key={i}><strong>{item.activity}</strong>: {item.total.toFixed(2)} kg</li>
                ))}
              </ul>
            ) : (
                <p className="no-data-message">No activity data available to determine top contributors.</p>
            )}
          </div>

          <div className="profile-section">
            <h4>Personalized Suggestions</h4>
            <ul className="suggestions-list">
              {topActivities.length > 0 ? (
                  <>
                    <li>Focus on reducing **{topActivities[0]?.activity}** emissions, as it's your biggest contributor.</li>
                    <li>Consider finding sustainable alternatives for **{topActivities[1]?.activity}**.</li>
                  </>
              ) : (
                <p>Log more activities to get personalized suggestions!</p>
              )}
              <li>🚴 Try biking instead of short car rides.</li>
              <li>🌿 Plant a tree for every 50 kg CO₂ emitted.</li>
              <li>💡 Switch to energy-efficient lighting.</li>
            </ul>
          </div>

          <div className="profile-share">
            <button onClick={() => { setToast("Progress link copied!"); /* Real copy logic here */ }} className="share-button">
              📤 Share Your Progress
            </button>
          </div>

          {toast && <div className="toast">{toast}</div>}
        </>
      ) : (
        <p className="no-data-message">Please log in to view your complete carbon footprint profile and achievements.</p>
      )}
    </div>
  );
}