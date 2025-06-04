import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from '../firebase';
import '../styles/LogActivity.css';
import confetti from 'canvas-confetti'; // npm install canvas-confetti

export default function LogActivity() {
  const [selectedTab, setSelectedTab] = useState('household');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [emission, setEmission] = useState('');
  const [logs, setLogs] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [inputError, setInputError] = useState('');

  const activitiesByTab = {
    household: [
      { name: 'Electricity', emissionPerUnit: 0.233, unit: 'kWh', description: 'Average grid electricity' },
      { name: 'Natural Gas', emissionPerUnit: 0.185, unit: 'kWh', description: 'Heating and cooking' },
      { name: 'Heating Oil', emissionPerUnit: 2.54, unit: 'liters', description: 'Home heating' },
      { name: 'LPG/Propane', emissionPerUnit: 1.51, unit: 'liters', description: 'Cooking and heating' },
      { name: 'Wood', emissionPerUnit: 0.07, unit: 'kg', description: 'Firewood burning' },
      { name: 'Water', emissionPerUnit: 0.344, unit: 'cubic meters', description: 'Water usage' },
    ],
    transport: [
      { name: 'Car (Petrol)', emissionPerUnit: 0.17, unit: 'km', description: 'Average petrol car' },
      { name: 'Car (Diesel)', emissionPerUnit: 0.15, unit: 'km', description: 'Average diesel car' },
      { name: 'Car (Electric)', emissionPerUnit: 0.05, unit: 'km', description: 'Electric vehicle' },
      { name: 'Bus', emissionPerUnit: 0.07, unit: 'km', description: 'Public bus' },
      { name: 'Train', emissionPerUnit: 0.04, unit: 'km', description: 'Passenger train' },
      { name: 'Flight (Economy)', emissionPerUnit: 0.15, unit: 'km', description: 'Economy class flight' },
      { name: 'Motorcycle', emissionPerUnit: 0.11, unit: 'km', description: 'Average motorcycle' },
      { name: 'Bicycle', emissionPerUnit: 0, unit: 'km', description: 'Zero emissions' },
      { name: 'Walking', emissionPerUnit: 0, unit: 'km', description: 'Zero emissions' },
    ],
    food: [
      { name: 'Beef', emissionPerUnit: 27, unit: 'kg', description: 'Beef consumption' },
      { name: 'Lamb', emissionPerUnit: 39.2, unit: 'kg', description: 'Lamb consumption' },
      { name: 'Pork', emissionPerUnit: 12.1, unit: 'kg', description: 'Pork consumption' },
      { name: 'Chicken', emissionPerUnit: 6.9, unit: 'kg', description: 'Chicken consumption' },
      { name: 'Fish', emissionPerUnit: 6.1, unit: 'kg', description: 'Fish consumption' },
      { name: 'Eggs', emissionPerUnit: 4.8, unit: 'kg', description: 'Egg consumption' },
      { name: 'Milk', emissionPerUnit: 1.9, unit: 'liters', description: 'Dairy milk' },
      { name: 'Cheese', emissionPerUnit: 13.5, unit: 'kg', description: 'Cheese consumption' },
      { name: 'Rice', emissionPerUnit: 4, unit: 'kg', description: 'Rice consumption' },
      { name: 'Tofu', emissionPerUnit: 2, unit: 'kg', description: 'Tofu consumption' },
    ],
    miscellaneous: [
      { name: 'Using a Computer', emissionPerUnit: 0.05, unit: 'hour', description: 'Desktop computer usage' },
      { name: 'Washing Clothes', emissionPerUnit: 0.3, unit: 'load', description: 'Average washing machine' },
      { name: 'Clothing', emissionPerUnit: 15, unit: 'item', description: 'Average clothing item' },
      { name: 'Electronics', emissionPerUnit: 45, unit: 'item', description: 'Small electronics' },
      { name: 'Furniture', emissionPerUnit: 90, unit: 'item', description: 'Furniture piece' },
    ],
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadLogs(currentUser.uid);
      } else {
        setLogs([]); // clear logs if logged out
        setLoadingLogs(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadLogs = async (uid) => {
    setLoadingLogs(true);
    try {
      const logsCol = collection(db, "users", uid, "carbonLogs");
      const logsQuery = query(logsCol, orderBy("date", "desc"));
      const snapshot = await getDocs(logsQuery);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert date Timestamp to JS Date, then to string for display
        date: doc.data().date?.toDate()?.toLocaleDateString() || 'N/A'
      }));
      setLogs(logsData);
    } catch (error) {
      console.error("Error loading logs:", error);
      setToastMessage('Failed to load logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Toast message management
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setSelectedActivity('');
    setDuration('');
    setEmission('');
    setInputError(''); // Clear error on tab change
  };

  const handleActivityChange = (e) => {
    const activity = e.target.value;
    setSelectedActivity(activity);
    const selected = activitiesByTab[selectedTab].find(a => a.name === activity);
    if (selected && duration) {
      setEmission(calculateEmission(selected, duration));
    } else {
      setEmission('');
    }
    setInputError(''); // Clear error on activity change
  };

  const handleDurationChange = (e) => {
    const value = e.target.value;
    setDuration(value);
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setInputError('Duration/Quantity must be a positive number.');
      setEmission('');
      return;
    } else {
      setInputError('');
    }

    if (selectedActivity) {
      const selected = activitiesByTab[selectedTab].find(a => a.name === selectedActivity);
      setEmission(calculateEmission(selected, value));
    } else {
      setEmission('');
    }
  };

  const calculateEmission = (activity, duration) => {
    const durationInUnit = parseFloat(duration);
    if (!isNaN(durationInUnit) && durationInUnit > 0) {
      return (activity.emissionPerUnit * durationInUnit).toFixed(2);
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setToastMessage("Please log in to save your log.");
      return;
    }
    if (!selectedActivity || !duration || !emission || parseFloat(duration) <= 0) {
      setInputError("Please select an activity and enter a valid positive quantity.");
      return;
    }

    try {
      const logsCol = collection(db, "users", user.uid, "carbonLogs");
      const newLog = {
        activity: selectedActivity,
        emission: parseFloat(emission),
        date: new Date(), // Storing as Firestore Timestamp
        userId: user.uid, // Add user ID for potential future filtering/leaderboards
      };

      const docRef = await addDoc(logsCol, newLog);

      // Convert date to string for display in the local state
      const newLogWithId = {
        id: docRef.id,
        ...newLog,
        date: newLog.date.toLocaleDateString(),
      };
      setLogs([newLogWithId, ...logs]); // Add new log to top of the list

      // Clear form fields
      setSelectedActivity('');
      setDuration('');
      setEmission('');
      setInputError('');

      setToastMessage('Activity logged successfully! 🎉');

      // Confetti for first log of the day (simple logic)
      const today = new Date().toLocaleDateString();
      const hasLoggedToday = logs.some(log => new Date(log.date).toLocaleDateString() === today);
      if (!hasLoggedToday) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

    } catch (error) {
      console.error("Error adding log:", error);
      setToastMessage("Failed to add log. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "carbonLogs", id));
      setLogs(logs.filter(log => log.id !== id));
      setToastMessage('Log deleted successfully.');
    } catch (error) {
      console.error("Error deleting log:", error);
      setToastMessage('Failed to delete log.');
    }
  };

  const handleClearAll = async () => {
    if (!user) {
      setToastMessage("Please log in to clear logs.");
      return;
    }
    if (window.confirm('Are you sure you want to delete all your logs? This action cannot be undone.')) {
      try {
        const logsCol = collection(db, "users", user.uid, "carbonLogs");
        const snapshot = await getDocs(logsCol);
        const batchDeletes = snapshot.docs.map(docSnap =>
          deleteDoc(doc(db, "users", user.uid, "carbonLogs", docSnap.id))
        );
        await Promise.all(batchDeletes);
        setLogs([]);
        setToastMessage('All logs cleared successfully.');
      } catch (error) {
        console.error("Error clearing logs:", error);
        setToastMessage('Failed to clear all logs.');
      }
    }
  };

  const filteredLogs = activityFilter === 'all'
    ? logs
    : logs.filter(log => log.activity === activityFilter);

  const totalEmission = filteredLogs.reduce((sum, log) => sum + (log.emission || 0), 0).toFixed(2);

  const getSelectedActivityUnit = () => {
    if (!selectedActivity) return '';
    const selected = activitiesByTab[selectedTab].find(a => a.name === selectedActivity);
    return selected ? selected.unit : '';
  };

  return (
    <div className="log-container">
      <h2 className="log-title">Log New Activity</h2>

      <div className="tabs">
        {Object.keys(activitiesByTab).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={selectedTab === tab ? 'active' : ''}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="log-form">
        <label htmlFor="activity-select">Activity:</label>
        <select id="activity-select" value={selectedActivity} onChange={handleActivityChange} required>
          <option value="">Select activity</option>
          {activitiesByTab[selectedTab].map((activity) => (
            <option key={activity.name} value={activity.name}>
              {activity.name} — {activity.description}
            </option>
          ))}
        </select>

        <label htmlFor="duration-input">Duration / Quantity ({getSelectedActivityUnit() || 'e.g., kWh, km, kg'}):</label>
        <input
          type="number"
          id="duration-input"
          value={duration}
          min="0"
          step="any"
          onChange={handleDurationChange}
          placeholder={`Enter quantity in ${getSelectedActivityUnit() || 'units'}`}
          required
          className={inputError ? 'input-error' : ''}
        />
        {inputError && <p className="error-message">{inputError}</p>}


        <label htmlFor="emission-output">Estimated Emission (kg CO₂e):</label>
        <input
          type="text"
          id="emission-output"
          value={emission}
          readOnly
          placeholder="Emission will be calculated"
          className="emission-output-field"
        />

        <button type="submit" disabled={!selectedActivity || !duration || !emission || !!inputError}>Add Log</button>
      </form>

      {toastMessage && <div className="toast-notification">{toastMessage}</div>}

      <div className="filter-section">
        <label htmlFor="filter-select">Filter by Activity:</label>
        <select id="filter-select" value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
          <option value="all">All</option>
          {[...new Set(logs.map(log => log.activity))].map(activity => (
            <option key={activity} value={activity}>{activity}</option>
          ))}
        </select>
      </div>

      <h3>Your Recent Logs ({filteredLogs.length} items)</h3>
      {loadingLogs ? (
        <p>Loading your past activities...</p>
      ) : logs.length === 0 ? (
        <p className="no-logs-message">No activities logged yet for this user. Start tracking!</p>
      ) : (
        <>
          <table className="log-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Emission (kg CO₂e)</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.activity}</td>
                  <td>{log.emission.toFixed(2)}</td>
                  <td>{log.date}</td>
                  <td><button className="delete-btn" onClick={() => handleDelete(log.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary">
            <p>Total Emission (Filtered): <strong>{totalEmission} kg CO₂e</strong></p>
            <button onClick={handleClearAll} disabled={logs.length === 0} className="clear-all-btn">Clear All Logs</button>
          </div>
        </>
      )}
    </div>
  );
}