import { useState, useEffect } from 'react';
import '../styles/LogActivity.css';

export default function LogActivity() {
  const [selectedTab, setSelectedTab] = useState('household'); 
  const [selectedActivity, setSelectedActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [emission, setEmission] = useState('');
  const [logs, setLogs] = useState([]);
  
  const activitiesByTab = {
    household: [
      { name: 'Electricity', emissionPerUnit: 1.1405, unit: 'kWh' },
      { name: 'Natural Gas', emissionPerUnit: 0.185, unit: 'kWh' },
      { name: 'Heating Oil', emissionPerUnit: 2.54, unit: 'litres' },
      { name: 'Coal', emissionPerUnit: 8200, unit: 'metric tons' },
    ],
    transport: [
      { name: 'Car', emissionPerUnit: 0.2, unit: 'minutes' },
      { name: 'Bus', emissionPerUnit: 0.15, unit: 'minutes' },
      { name: 'Flight', emissionPerUnit: 0.6, unit: 'minutes' },
    ],
    miscellaneous: [
      { name: 'Using a Computer', emissionPerUnit: 0.05, unit: 'hour' },
      { name: 'Washing Clothes', emissionPerUnit: 0.3, unit: 'hour' },
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

  return (
    <div className="log-container">
      <h2 className="log-title">Log New Activity</h2>
      
      {/* Tabs for different categories */}
      <div className="tabs">
        <button onClick={() => handleTabChange('household')} className={selectedTab === 'household' ? 'active' : ''}>Household</button>
        <button onClick={() => handleTabChange('transport')} className={selectedTab === 'transport' ? 'active' : ''}>Transport</button>
        <button onClick={() => handleTabChange('miscellaneous')} className={selectedTab === 'miscellaneous' ? 'active' : ''}>Miscellaneous</button>
      </div>

      {/* Activity Log Form */}
      <form onSubmit={handleSubmit} className="log-form">
        <select
          value={selectedActivity}
          onChange={handleActivityChange}
          required
          aria-label="Select Activity"
        >
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
          aria-label="Enter Duration"
        />

        <input
          type="number"
          placeholder="Estimated Emission (kg CO₂)"
          value={emission}
          readOnly
          aria-label="Calculated Emission"
        />
        <button type="submit" disabled={!emission}>Save Log</button>
      </form>

      {/* Display Saved Logs */}
      {logs.length > 0 && (
        <div className="log-list">
          <h3 className="log-list-title">Saved Logs</h3>
          <ul>
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <span className="log-activity">{log.activity}</span>
                <span className="log-emission">{log.emission} kg CO₂</span>
                <span className="log-date">{log.date}</span>
                <button 
                  onClick={() => handleDelete(log.id)} 
                  className="delete-btn"
                  aria-label="Delete Log"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
