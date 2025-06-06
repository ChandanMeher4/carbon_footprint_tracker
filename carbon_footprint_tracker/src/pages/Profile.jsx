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

  // REVISED: Badge definitions with logical icons and descriptions
  const allBadges = {
    "Greenhorn Start": { desc: "Logged your very first activity!", icon: "🌱" },
    "Consistency Champ": { desc: "Logged activity for 3 consecutive days.", icon: "⚡" },
    "Carbon Cutter": { desc: "Reduced weekly emissions by 10% compared to your previous week.", icon: "📉" },
    "Low Carbon Hero": { desc: "Maintained weekly emissions below 20kg for a month.", icon: "🏅" },
    "Diverse Tracker": { desc: "Logged 5 or more distinct activity types.", icon: "📋" },
    "Zero Emission Day": { desc: "Logged a full day with zero net emissions.", icon: "☀️" },
    "Goal Achiever": { desc: "Successfully met your carbon reduction goal!", icon: "🎯" },
    "Community Contributor": { desc: "Shared your progress with friends.", icon: "🤝" },
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
          setProfileName(userData.name || "");
          setProfileAge(userData.age || "");
          setProfileGender(userData.gender || "");

          const savedGoal = userData.carbonGoal || 500;
          setGoal(savedGoal);
          setGoalInput(savedGoal);
        } else {
          userData = {
            carbonGoal: 500,
            name: "",
            age: "",
            gender: "",
            email: currentUser.email,
            firstLogRecorded: false,
            weeklyEmissionHistory: {},
            lowCarbonWeeksCount: 0,
            earnedBadges: [], // Initialize earnedBadges for new users
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
            date: data.date?.toDate()
          };
        }).filter(log => log.date instanceof Date && !isNaN(log.date.getTime()));

        const total = logs.reduce((acc, log) => acc + (log.emission || 0), 0);
        setTotalEmissions(total);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyEmissions = {};
        const dailyLogsCount = {};
        const distinctActivitiesLogged = new Set();

        logs.forEach(log => {
            const logDate = log.date;
            logDate.setHours(0, 0, 0, 0);
            const dateStr = logDate.toISOString().slice(0, 10);
            dailyEmissions[dateStr] = (dailyEmissions[dateStr] || 0) + log.emission;
            dailyLogsCount[dateStr] = (dailyLogsCount[dateStr] || 0) + 1;
            distinctActivitiesLogged.add(log.activity);
        });

        const last7DaysEmissions = Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dStr = d.toISOString().slice(0, 10);
          last7DaysEmissions[6 - i] = dailyEmissions[dStr] || 0;
        }
        setWeeklyTrend(last7DaysEmissions);

        let tempStreak = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dStr = d.toISOString().slice(0, 10);
          if (dailyLogsCount[dStr] > 0) {
            tempStreak++;
          } else {
            if (i === 0) tempStreak = 0;
            break;
          }
        }
        setStreak(tempStreak);

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

        const earnedBadges = new Set(userData.earnedBadges || []);
        const updatesForUserDoc = {};

        if (logs.length > 0 && !userData.firstLogRecorded) {
          earnedBadges.add("Greenhorn Start");
          updatesForUserDoc.firstLogRecorded = true;
        }

        if (tempStreak >= 3) {
          earnedBadges.add("Consistency Champ");
        }

        const currentWeekKey = `${today.getFullYear()}-${today.getMonth()}-${Math.floor(today.getDate() / 7)}`;
        const currentWeekTotalForCalc = last7DaysEmissions.reduce((a, b) => a + b, 0);

        if (userData.weeklyEmissionHistory) {
            const prevWeekDate = new Date(today);
            prevWeekDate.setDate(today.getDate() - 7);
            const prevWeekKey = `${prevWeekDate.getFullYear()}-${prevWeekDate.getMonth()}-${Math.floor(prevWeekDate.getDate() / 7)}`;

            const previousWeekTotal = userData.weeklyEmissionHistory[prevWeekKey] || 0;

            if (previousWeekTotal > 0 && currentWeekTotalForCalc < previousWeekTotal * 0.9) {
                earnedBadges.add("Carbon Cutter");
            }
        }
        updatesForUserDoc[`weeklyEmissionHistory.${currentWeekKey}`] = currentWeekTotalForCalc;

        const threshold = 20;
        let currentLowCarbonWeeksCount = userData.lowCarbonWeeksCount || 0;

        if (currentWeekTotalForCalc <= threshold) {
            currentLowCarbonWeeksCount++;
        } else {
            currentLowCarbonWeeksCount = 0;
        }
        updatesForUserDoc.lowCarbonWeeksCount = currentLowCarbonWeeksCount;

        if (currentLowCarbonWeeksCount >= 4) {
            earnedBadges.add("Low Carbon Hero");
        }

        if (distinctActivitiesLogged.size >= 5) {
          earnedBadges.add("Diverse Tracker");
        }

        const zeroEmissionDayExists = Object.keys(dailyEmissions).some(date => dailyEmissions[date] === 0 && dailyLogsCount[date] > 0);
        if (zeroEmissionDayExists) {
            earnedBadges.add("Zero Emission Day");
        }

        if (total <= goal && total > 0 && logs.length > 0) {
             earnedBadges.add("Goal Achiever");
        }

        if (Object.keys(updatesForUserDoc).length > 0) {
            await updateDoc(userRef, {
                ...updatesForUserDoc,
                earnedBadges: Array.from(earnedBadges)
            });
        }
        setBadges(Array.from(earnedBadges));

        const progressPercent = Math.min((total / goal) * 100, 100);
        setProgress(progressPercent);

        const avgDaily = last7DaysEmissions.reduce((a, b) => a + b, 0) / 7;
        if (avgDaily > 0) {
          const remaining = goal - total;
          if (remaining <= 0) {
            setEstimatedDate("Goal already met!");
          } else {
            const daysLeft = Math.ceil(remaining / avgDaily);
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + daysLeft);
            setEstimatedDate(futureDate.toDateString());
          }
        } else {
          setEstimatedDate("Log more activities to estimate goal completion.");
        }

      } catch (error) {
        console.error("Profile.js: Error fetching user data or logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndLogs();
  }, [currentUser, goal]);

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
    } else if (newGoal <= 0 || isNaN(newGoal)) {
      setToast("Goal must be a positive number.");
      setGoalInput(goal);
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
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle sharing progress using Web Share API
  const handleShareProgress = async () => {
    if (!currentUser) {
      setToast("Please log in to share your progress.");
      return;
    }

    const shareText = `Check out my carbon footprint progress on CarbonTrack! My current footprint is ${totalEmissions.toFixed(2)} kg CO₂ and I'm ${progress.toFixed(0)}% towards my goal of ${goal} kg CO₂. Join me in tracking your environmental impact!`;
    const shareUrl = window.location.origin; // Or a specific landing page URL for your app

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CarbonTrack Progress',
          text: shareText,
          url: shareUrl,
        });
        setToast("Progress shared successfully! 🎉");
        // Optional: Award "Community Contributor" badge here
        if (!badges.includes("Community Contributor")) {
          const userRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userRef);
          const userData = userDocSnap.data();
          const updatedBadges = new Set(userData.earnedBadges || []);
          updatedBadges.add("Community Contributor");
          await updateDoc(userRef, { earnedBadges: Array.from(updatedBadges) });
          setBadges(Array.from(updatedBadges)); // Update local state immediately
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          setToast("Sharing cancelled.");
        } else {
          console.error("Error sharing:", error);
          setToast("Failed to share progress. Please try again.");
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const fallbackMessage = `${shareText}\n\nVisit: ${shareUrl}`;
      try {
        await navigator.clipboard.writeText(fallbackMessage);
        setToast("Progress message copied to clipboard! You can paste it anywhere. 🎉");
      } catch (err) {
        console.error("Fallback clipboard copy failed:", err);
        setToast("Failed to copy progress message. Please try manually.");
      }
    }
  };


  const getProgressColor = () => {
    if (progress < 33) return "#22c55e"; // Green
    if (progress < 66) return "#facc15"; // Yellow
    if (progress < 90) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

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
              <p className="no-data-message">No badges earned yet. Keep logging activities to earn them!</p>
            )}
          </div>

          <div className="profile-section">
            <h4>Set Your Total Carbon Footprint Goal (Annual)</h4>
            <div className="goal-setting-area">
                <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(parseFloat(e.target.value) || 0)}
                    onBlur={handleGoalChange}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleGoalChange(e);
                            e.target.blur();
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
            <h4>Weekly Emission Trend (Last 7 Days)</h4>
            {weeklyTrend.length > 0 && weeklyTrend.some(val => val > 0) ? (
              <ul className="trend-list">
                {weeklyTrend.map((val, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const dayName = d.toLocaleDateString('default', { weekday: 'short', month: 'numeric', day: 'numeric' });
                    return <li key={i}>{dayName}: {val.toFixed(2)} kg</li>;
                })}
              </ul>
            ) : (
                <p className="no-data-message">No emission data for the last 7 days. Log some activities!</p>
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
                    {topActivities[1] && <li>Consider finding sustainable alternatives for **{topActivities[1]?.activity}**.</li>}
                  </>
              ) : (
                <li>Log more activities to get personalized suggestions!</li>
              )}
              <li>🚴 Try biking or walking instead of short car rides.</li>
              <li>💡 Switch to energy-efficient lighting and appliances.</li>
              <li>🍎 Eat more plant-based meals to reduce your food footprint.</li>
              <li>♻️ Remember to recycle and reduce waste where possible.</li>
            </ul>
          </div>

          <div className="profile-share">
            <button onClick={handleShareProgress} className="share-button">
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