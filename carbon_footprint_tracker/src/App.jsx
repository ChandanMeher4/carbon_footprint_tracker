import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LogActivity from './pages/LogActivity';
import Insights from './pages/EmissionTrends';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import { AuthProvider } from './hooks/useAuth'; // Import your AuthProvider
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

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
        <AuthProvider>
          <Router>
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
              <Route path="/log" element={<PrivateRoute><LogActivity /></PrivateRoute>} />
              <Route path="/insights" element={<PrivateRoute><Insights /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            </Routes>
          </Router>
        </AuthProvider>
      </div>
    </div>
  );
}

export default App;
