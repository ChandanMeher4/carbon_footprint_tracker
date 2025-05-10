import { Link } from 'react-router-dom';
import '../styles/Home.css';

export default function Home() {
  return (
    
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Carbon Footprint Tracker</h1>
        <p className="home-description">
          Track your daily emissions, visualize your carbon impact, and take
          steps toward a more sustainable future. Small choices. Big change.
        </p>
        <Link to="/log" className="home-button">
          Start Logging Activities
        </Link>
        <div className="home-footer">
          Built with 💚 for sustainability
        </div>
      </div>
    </div>
  );
}
