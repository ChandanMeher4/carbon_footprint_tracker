import { useState, useEffect } from 'react';
import '../styles/LogActivity.css';

export default function LogActivity() {
  const [selectedTab, setSelectedTab] = useState('household');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [emission, setEmission] = useState('');
  const [logs, setLogs] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all');

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

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem('carbonLogs')) || [];
    setLogs(storedLogs);
  }, []);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setSelectedActivity('');
    setDuration('');
    setEmission('');
  };

  const handleActivityChange = (e) => {
    const activity = e.target.value;
    setSelectedActivity(activity);
    const selected = activitiesByTab[selectedTab].find(a => a.name === activity);
    if (selected && duration) {
      setEmission(calculateEmission(selected, duration));
    }
  };

  const handleDurationChange = (e) => {
    const value = e.target.value;
    setDuration(value);
    if (selectedActivity) {
      const selected = activitiesByTab[selectedTab].find(a => a.name === selectedActivity);
      setEmission(calculateEmission(selected, value));
    }
  };

  const calculateEmission = (activity, duration) => {
    const durationInUnit = parseFloat(duration);
    if (!isNaN(durationInUnit) && durationInUnit > 0) {
      return (activity.emissionPerUnit * durationInUnit).toFixed(2);
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLog = {
      id: Date.now(),
      activity: selectedActivity,
      emission: parseFloat(emission),
      date: new Date().toLocaleDateString(),
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('carbonLogs', JSON.stringify(updatedLogs));
    setSelectedActivity('');
    setDuration('');
    setEmission('');
  };

  const handleDelete = (id) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    setLogs(updatedLogs);
    localStorage.setItem('carbonLogs', JSON.stringify(updatedLogs));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all logs?')) {
      setLogs([]);
      localStorage.removeItem('carbonLogs');
    }
  };

  const filteredLogs = activityFilter === 'all'
    ? logs
    : logs.filter(log => log.activity === activityFilter);

  const totalEmission = filteredLogs.reduce((sum, log) => sum + log.emission, 0).toFixed(2);

  return (
    <div className="log-container">
      <h2 className="log-title">Log New Activity</h2>

      <div className="tabs">
        <button onClick={() => handleTabChange('household')} className={selectedTab === 'household' ? 'active' : ''}>Household</button>
        <button onClick={() => handleTabChange('transport')} className={selectedTab === 'transport' ? 'active' : ''}>Transport</button>
        <button onClick={() => handleTabChange('food')} className={selectedTab === 'food' ? 'active' : ''}>Food</button>
        <button onClick={() => handleTabChange('miscellaneous')} className={selectedTab === 'miscellaneous' ? 'active' : ''}>Miscellaneous</button>
      </div>

      <form onSubmit={handleSubmit} className="log-form">
        <select value={selectedActivity} onChange={handleActivityChange} required>
          <option value="">Select Activity</option>
          {activitiesByTab[selectedTab].map((activity, index) => (
            <option key={index} value={activity.name}>
              {activity.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder={`Duration in ${activitiesByTab[selectedTab].find(a => a.name === selectedActivity)?.unit || 'unit'}`}
          value={duration}
          onChange={handleDurationChange}
          required
          min="1"
        />

        <input
          type="number"
          placeholder="Estimated Emission (kg CO₂)"
          value={emission}
          readOnly
        />
        <button type="submit" disabled={!emission}>Save Log</button>
      </form>

      {logs.length > 0 && (
        <div className="log-list">
          <h3 className="log-list-title">Saved Logs</h3>

          {/* Activity Filter */}
          <div className="filter-section">
            <label>Filter by Activity: </label>
            <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
              <option value="all">All</option>
              {[...new Set(logs.map(log => log.activity))].map((activity, index) => (
                <option key={index} value={activity}>{activity}</option>
              ))}
            </select>
          </div>

          <ul>
            {filteredLogs.map((log) => (
              <li key={log.id} className="log-item">
                <span className="log-activity">{log.activity}</span>
                <span className="log-emission">{log.emission} kg CO₂</span>
                <span className="log-date">{log.date}</span>
                <button onClick={() => handleDelete(log.id)} className="delete-btn">Delete</button>
              </li>
            ))}
          </ul>

          {/* Total Emissions */}
          <div className="total-emission">
            <strong>Total Emissions:</strong> {totalEmission} kg CO₂
          </div>

          {/* Clear All Logs */}
          <button className="clear-btn" onClick={handleClearAll}>
            Clear All Logs
          </button>
        </div>
      )}
    </div>
  );
}
