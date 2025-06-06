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

  // REVISED: More logical activities and units for carbon tracking
  const activitiesByTab = {
    household: [
      { name: 'Electricity', emissionPerUnit: 0.233, unit: 'kWh', description: 'Grid electricity consumption (average)' },
      { name: 'Natural Gas', emissionPerUnit: 0.185, unit: 'kWh', description: 'Heating and cooking gas' },
      { name: 'Heating Oil', emissionPerUnit: 2.54, unit: 'liters', description: 'Home heating oil' },
      { name: 'LPG/Propane', emissionPerUnit: 1.51, unit: 'liters', description: 'Cooking and heating gas (liquefied)' },
      { name: 'Wood Pellets', emissionPerUnit: 0.04, unit: 'kg', description: 'Wood pellet stove heating' },
      { name: 'Water Usage', emissionPerUnit: 0.344, unit: 'cubic meters', description: 'Water consumption (incl. treatment)' },
      { name: 'Waste Disposal', emissionPerUnit: 0.2, unit: 'kg', description: 'Landfilled waste (approx.)' },
      { name: 'Recycling', emissionPerUnit: -0.1, unit: 'kg', description: 'Recycled materials (CO2 savings, approximate)' },
    ],
    transport: [
      { name: 'Car (Petrol)', emissionPerUnit: 0.17, unit: 'km', description: 'Average petrol car (per km driven)' },
      { name: 'Car (Diesel)', emissionPerUnit: 0.15, unit: 'km', description: 'Average diesel car (per km driven)' },
      { name: 'Car (Electric)', emissionPerUnit: 0.05, unit: 'km', description: 'Electric vehicle (per km, considering grid average)' },
      { name: 'Bus', emissionPerUnit: 0.07, unit: 'km', description: 'Public bus travel (per km)' },
      { name: 'Train', emissionPerUnit: 0.04, unit: 'km', description: 'Passenger train travel (per km)' },
      { name: 'Flight (Short-Haul)', emissionPerUnit: 0.18, unit: 'km', description: 'Short-haul flight (per km, economy)' },
      { name: 'Flight (Long-Haul)', emissionPerUnit: 0.12, unit: 'km', description: 'Long-haul flight (per km, economy)' },
      { name: 'Motorcycle', emissionPerUnit: 0.11, unit: 'km', description: 'Average motorcycle travel (per km)' },
      { name: 'Bicycle', emissionPerUnit: 0, unit: 'km', description: 'Cycling (zero direct emissions)' },
      { name: 'Walking', emissionPerUnit: 0, unit: 'km', description: 'Walking (zero direct emissions)' },
      { name: 'Public Transport (General)', emissionPerUnit: 0.06, unit: 'km', description: 'General public transport (e.g., tram/metro)' },
    ],
    food: [
      { name: 'Beef', emissionPerUnit: 27, unit: 'kg', description: 'Beef consumption (per kg of product)' },
      { name: 'Lamb', emissionPerUnit: 39.2, unit: 'kg', description: 'Lamb consumption (per kg of product)' },
      { name: 'Pork', emissionPerUnit: 12.1, unit: 'kg', description: 'Pork consumption (per kg of product)' },
      { name: 'Chicken', emissionPerUnit: 6.9, unit: 'kg', description: 'Chicken consumption (per kg of product)' },
      { name: 'Fish (Wild-caught)', emissionPerUnit: 4, unit: 'kg', description: 'Wild-caught fish (per kg of product)' },
      { name: 'Fish (Farmed)', emissionPerUnit: 6.1, unit: 'kg', description: 'Farmed fish (per kg of product)' },
      { name: 'Eggs', emissionPerUnit: 4.8, unit: 'kg', description: 'Egg consumption (per kg of product)' },
      { name: 'Dairy Milk', emissionPerUnit: 1.9, unit: 'liters', description: 'Dairy milk consumption (per liter)' },
      { name: 'Plant-based Milk', emissionPerUnit: 0.5, unit: 'liters', description: 'Oat, almond, soy milk (per liter)' },
      { name: 'Cheese', emissionPerUnit: 13.5, unit: 'kg', description: 'Cheese consumption (per kg of product)' },
      { name: 'Rice', emissionPerUnit: 4, unit: 'kg', description: 'Rice consumption (per kg of uncooked rice)' },
      { name: 'Tofu', emissionPerUnit: 2, unit: 'kg', description: 'Tofu consumption (per kg of product)' },
      { name: 'Vegetables', emissionPerUnit: 0.5, unit: 'kg', description: 'Average vegetables (per kg)' },
      { name: 'Fruits', emissionPerUnit: 0.8, unit: 'kg', description: 'Average fruits (per kg)' },
    ],
    purchases: [ // Renamed from miscellaneous for better grouping
      { name: 'New Clothing', emissionPerUnit: 15, unit: 'item', description: 'Average new clothing item production' },
      { name: 'Electronics (Small)', emissionPerUnit: 45, unit: 'item', description: 'Production of small electronics (e.g., phone, tablet)' },
      { name: 'Furniture (Small)', emissionPerUnit: 50, unit: 'item', description: 'Production of a small furniture piece' },
      { name: 'Home Appliances (Medium)', emissionPerUnit: 150, unit: 'item', description: 'Production of a medium appliance (e.g., fridge, washing machine)' },
      { name: 'Online Streaming', emissionPerUnit: 0.05, unit: 'hour', description: 'Data center energy for streaming (approx.)' },
      { name: 'Paper Products', emissionPerUnit: 1.5, unit: 'kg', description: 'Paper and cardboard production (per kg)' },
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
    if (isNaN(numValue) || numValue < 0) { // Allow 0 for specific activities like walking/biking
      setInputError('Duration/Quantity must be a number, and cannot be negative.');
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
    if (!isNaN(durationInUnit) && durationInUnit >= 0) { // Allow 0 for specific cases
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
    if (!selectedActivity || !duration || emission === '' || parseFloat(duration) < 0 || isNaN(parseFloat(emission))) {
        // Ensure emission is calculated and not empty/invalid
        setInputError("Please select an activity and enter a valid non-negative quantity.");
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

      // Confetti logic: trigger if total emissions are being reduced (e.g., if negative emission is logged for recycling)
      // or simply for any successful log. For now, let's keep it for any log.
      confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
      });

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
          min="0" // Allow 0 for activities like walking/biking
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

        <button type="submit" disabled={!selectedActivity || duration === '' || emission === '' || parseFloat(duration) < 0 || !!inputError}>Add Log</button>
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