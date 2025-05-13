import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import '../styles/Navbar.css'; // Adjust the path as necessary

export default function Navbar({ darkMode, setDarkMode }) {
  const location = useLocation(); // Get the current location (pathname)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getLinkClass = (path) => {
    return location.pathname === path ? 'navbar-link active' : 'navbar-link';
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark-mode' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-link logo">CarbonTracker</Link>
        </div>

        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" className={getLinkClass('/')}>Home</Link>
          <Link to="/log" className={getLinkClass('/log')}>Log</Link>
          <Link to="/insights" className={getLinkClass('/insights')}>Insights</Link>
          <Link to="/profile" className={getLinkClass('/profile')}>Profile</Link>
        </div>

        <div className="navbar-toggle" onClick={toggleMenu}>
          <span className={`navbar-icon ${isMenuOpen ? 'open' : ''}`}></span>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`navbar-button ${darkMode ? 'dark-mode' : ''}`}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </nav>
  );
}
