import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, getDoc, updateDoc } from 'firebase/firestore'; // Import doc, getDoc, updateDoc
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/Home.css'; // Assume you'll update this CSS for new elements

export default function Home() {
  const [emissionTotal, setEmissionTotal] = useState(0);
  const [recentLogs, setRecentLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeklyGoal, setWeeklyGoal] = useState(50); // Default, will load from user profile
  const [averageUserEmission, setAverageUserEmission] = useState(40); // Mock average for comparison
  const [didYouKnowFact, setDidYouKnowFact] = useState('');

  const carbonFacts = [
    "A single tree can absorb about 21 kg of CO₂ per year.",
    "Meat production contributes significantly to greenhouse gas emissions.",
    "Switching to LED lighting can reduce household energy consumption by 75%.",
    "Public transport can reduce your carbon footprint by up to 50% compared to driving alone.",
    "Recycling one aluminum can saves enough energy to power a TV for 3 hours.",
  ];

  // Random fact generator
  useEffect(() => {
    setDidYouKnowFact(carbonFacts[Math.floor(Math.random() * carbonFacts.length)]);
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch logs and user-specific goal
  useEffect(() => {
    const fetchLogsAndGoal = async () => {
      if (!user) {
        setEmissionTotal(0);
        setRecentLogs([]);
        setWeeklyGoal(50); // Reset to default if no user
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch user-specific weekly goal
        const userRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const savedGoal = userData.weeklyCarbonGoal || 50; // New field for weekly goal
          setWeeklyGoal(savedGoal);
        } else {
          // If user doc doesn't exist, create it with default weekly goal
          await setDoc(userRef, { weeklyCarbonGoal: 50 }, { merge: true });
          setWeeklyGoal(50);
        }

        // Fetch user-specific carbon logs
        const userLogsCollectionRef = collection(db, "users", user.uid, "carbonLogs");
        const logsQuery = query(userLogsCollectionRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(logsQuery);
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          date: doc.data().date?.toDate(), // Convert Timestamp to JS Date
          emission: doc.data().emission || 0,
          activity: doc.data().activity,
        })).filter(log => log.date instanceof Date && !isNaN(log.date)); // Ensure valid Date objects

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize 'now' to start of day

        // Calculate start of current week (Monday)
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); // Adjust for Sunday (0) or other days
        startOfThisWeek.setHours(0, 0, 0, 0);

        const thisWeekLogs = logs.filter((log) => {
          const logDate = log.date;
          // Ensure logDate is also normalized to start of day for comparison
          const normalizedLogDate = new Date(logDate);
          normalizedLogDate.setHours(0,0,0,0);
          return normalizedLogDate >= startOfThisWeek;
        });

        const total = thisWeekLogs.reduce((sum, log) => sum + log.emission, 0);
        setEmissionTotal(total);

        // Slice for recent logs after all processing
        setRecentLogs(logs.slice(0, 3));

      } catch (error) {
        console.error('Home.js: Error fetching logs or user goal:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLogsAndGoal();
    } else {
        setEmissionTotal(0);
        setRecentLogs([]);
        setWeeklyGoal(50);
    }
  }, [user]);

  const getEmissionLevel = () => {
    if (emissionTotal <= weeklyGoal * 0.4) return 'Excellent! 🌟'; // Green
    if (emissionTotal <= weeklyGoal * 0.8) return 'Good! 👍'; // Yellow
    if (emissionTotal <= weeklyGoal) return 'Close to goal! 💪'; // Orange
    return 'Over goal! ⚠️'; // Red
  };

  const getLevelColor = () => {
    if (emissionTotal <= weeklyGoal * 0.4) return 'home-badge-excellent';
    if (emissionTotal <= weeklyGoal * 0.8) return 'home-badge-good';
    if (emissionTotal <= weeklyGoal) return 'home-badge-close';
    return 'home-badge-over';
  };

  // Function to save weekly goal to Firestore
  const handleWeeklyGoalChange = async (e) => {
    const newGoal = parseFloat(e.target.value);
    if (!isNaN(newGoal) && newGoal > 0 && user) {
      setWeeklyGoal(newGoal);
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { weeklyCarbonGoal: newGoal });
        // Optionally show a toast notification
      } catch (error) {
        console.error("Home.js: Error updating weekly goal:", error);
      }
    }
  };

  if (loading) {
      return (
        <div className="home-container">
          <div className="home-card">
            <p>Loading your personalized dashboard...</p>
          </div>
        </div>
      );
  }

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Your Green Dashboard</h1>
        <p className="home-description">
          A snapshot of your weekly carbon footprint journey.
        </p>

        {user ? (
          <>
            {/* Emission Summary */}
            <div className="emission-summary">
              <strong>This Week’s Emissions:</strong> {emissionTotal.toFixed(2)} kg CO₂
              <span className={`badge ${getLevelColor()}`}>{getEmissionLevel()}</span>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min((emissionTotal / weeklyGoal) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="goal-info">Goal: {weeklyGoal.toFixed(2)} kg CO₂ per week</p>

              <div className="weekly-goal-setter">
                <label htmlFor="weekly-goal-input">Set Weekly Goal (kg CO₂): </label>
                <input
                  type="number"
                  id="weekly-goal-input"
                  value={weeklyGoal}
                  onChange={handleWeeklyGoalChange}
                  min="1"
                  step="any"
                />
              </div>

              {emissionTotal > weeklyGoal ? (
                <p className="action-tip over-goal">You're over your weekly goal! Consider logging less or finding alternatives. Check "Sustainable Tips" for ideas!</p>
              ) : (
                <p className="action-tip under-goal">You're on track! Keep logging activities to reach your goal. Only {(weeklyGoal - emissionTotal).toFixed(2)} kg left!</p>
              )}

              <p className="comparison-text">
                Your weekly emission is {emissionTotal.toFixed(2)} kg, compared to an average user's {averageUserEmission.toFixed(2)} kg.
              </p>
            </div>

            {/* Recent Activity */}
            <div className="recent-logs">
              <h3>Recent Activities</h3>
              {recentLogs.length > 0 ? (
                <ul>
                  {recentLogs.map((log) => {
                    const date = log.date?.toLocaleDateString() || 'N/A';
                    return (
                      <li key={log.id}>
                        <span>{log.activity}</span> – <span>{log.emission.toFixed(2)} kg</span> on{' '}
                        <span>{date}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No recent activities logged yet. Let's start tracking!</p>
              )}
              <Link to="/log" className="quick-link-small">
                Go to Log Activity
              </Link>
            </div>

          </>
        ) : (
          <p className="no-user-message">Please log in to see your personalized dashboard and track your carbon footprint!</p>
        )}


        {/* "Did You Know?" Fact */}
        <div className="did-you-know">
          <h3>Did You Know?</h3>
          <p>💡 {didYouKnowFact}</p>
        </div>

        {/* Navigation Shortcuts */}
        <div className="quick-links">
          <Link to="/log" className="quick-link">
            📝 Log Activity
          </Link>
          <Link to="/insights" className="quick-link">
            📊 View Insights
          </Link>
          <Link to="/profile" className="quick-link">
            👤 Your Profile
          </Link>
          <Link to="/tips" className="quick-link">
            💡 Sustainable Tips
          </Link>
        </div>

        <div className="home-footer">Built with 💚 for a cleaner planet</div>
      </div>
    </div>
  );
}