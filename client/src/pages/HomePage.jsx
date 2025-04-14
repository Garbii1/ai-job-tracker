// client/src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // We will create this CSS file next

function HomePage() {
  return (
    // Hero section container
    <div className="hero-section">
      {/* Optional overlay for better text readability */}
      <div className="hero-overlay"></div>
      {/* Content centered within the hero section */}
      <div className="hero-content">
        <h1>Track Your Job Applications Smarter</h1>
        <p>Organize your search, store documents, and gain AI-powered insights to land your dream job.</p>
        {/* Call-to-action buttons */}
        <div className="hero-buttons">
          <Link to="/register" className="button primary-action">Get Started</Link>
          <Link to="/login" className="button secondary-action">Login</Link>
        </div>
      </div>
    </div>
  );
}

// Export the component for use in App.jsx
export default HomePage;