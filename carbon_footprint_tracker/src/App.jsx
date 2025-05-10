import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LogActivity from './pages/LogActivity';
import Insights from './pages/EmissionTrends';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import './App.css'; // Make sure to add the global styles here

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Apply dark mode to body when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <Router>
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/log" element={<LogActivity />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;
