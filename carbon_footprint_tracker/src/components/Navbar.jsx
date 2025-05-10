import { Link } from 'react-router-dom';
import '../styles/Navbar.css'; // Adjust the path as necessary

export default function Navbar({ darkMode, setDarkMode }) {
  return (
    <nav className={`navbar ${darkMode ? 'dark-mode' : ''}`}>
      <div className="navbar-links">
        <Link to="/" className="navbar-link">Home</Link>
        <Link to="/log" className="navbar-link">Log</Link>
        <Link to="/insights" className="navbar-link">Insights</Link>
        <Link to="/profile" className="navbar-link">Profile</Link>
      </div>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`navbar-button ${darkMode ? 'dark-mode' : ''}`}
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </nav>
  );
}
