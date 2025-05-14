import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import '../styles/Navbar.css'; // Adjust the path if needed

export default function Navbar({ darkMode, setDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getLinkClass = (path) => {
    return location.pathname === path ? 'navbar-link active' : 'navbar-link';
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark-mode' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-link logo">CarbonTracker</Link>
        </div>

        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          {currentUser && (
            <>
              <Link to="/" className={getLinkClass('/')}>Home</Link>
              <Link to="/log" className={getLinkClass('/log')}>Log</Link>
              <Link to="/insights" className={getLinkClass('/insights')}>Insights</Link>
              <Link to="/profile" className={getLinkClass('/profile')}>Profile</Link>
            </>
          )}
        </div>

        <div className="navbar-toggle" onClick={toggleMenu}>
          <span className={`navbar-icon ${isMenuOpen ? 'open' : ''}`}></span>
        </div>

        <div className="navbar-actions">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`navbar-button ${darkMode ? 'dark-mode' : ''}`}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {currentUser ? (
            <button
              onClick={handleLogout}
              className="navbar-button logout-button"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="navbar-button login-button"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
