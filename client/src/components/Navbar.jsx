// client/src/components/Navbar.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // Use NavLink for active styling
import {
    FaSignOutAlt,   // Logout icon
    FaUserPlus,     // Register icon
    FaSignInAlt,    // Login icon
    FaTachometerAlt,// Dashboard icon
    FaPlusCircle,   // Add Application icon
    FaBriefcase     // Brand icon (optional)
} from 'react-icons/fa'; // Import all icons used

// Navbar component definition
// It receives 'user' (object or null) and 'onLogout' (function) as props from App.jsx
function Navbar({ user, onLogout }) {

  // Style for active NavLink (optional, can also be done purely with CSS)
  const activeStyle = {
    fontWeight: 'bold',
    // textDecoration: 'underline', // Example styling
    color: '#5bc0de' // Example active color
  };

  return (
    <nav> {/* Uses styles from index.css */}
      <div className="container"> {/* Centers content */}

        {/* Brand/Logo Link */}
        <Link to={user ? "/dashboard" : "/"} className="brand"> {/* Link to dashboard if logged in, else home/login */}
          <FaBriefcase style={{ marginRight: '8px' }} /> JobTracker AI
        </Link>

        {/* Navigation Links Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

          {/* Conditional Rendering based on user prop */}
          {user ? (
            // --- Logged In Links ---
            <>
              <NavLink
                to="/dashboard"
                style={({ isActive }) => isActive ? activeStyle : undefined}
              >
                <FaTachometerAlt style={{ marginRight: '5px' }} /> Dashboard
              </NavLink>

              <NavLink
                to="/add-application"
                style={({ isActive }) => isActive ? activeStyle : undefined}
              >
                <FaPlusCircle style={{ marginRight: '5px' }} /> Add App
              </NavLink>

              {/* Display user's name */}
              <span style={{ fontStyle: 'italic', opacity: 0.9 }}>
                Hi, {user.name}!
              </span>

              {/* Logout Button */}
              <button onClick={onLogout} title="Logout" className="button danger small"> {/* Added 'small' class if you want specific button size */}
                 <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            // --- Logged Out Links ---
            <>
              <NavLink
                to="/login"
                style={({ isActive }) => isActive ? activeStyle : undefined}
              >
                <FaSignInAlt style={{ marginRight: '5px' }} /> Login
              </NavLink>
              <NavLink
                to="/register"
                style={({ isActive }) => isActive ? activeStyle : undefined}
              >
                <FaUserPlus style={{ marginRight: '5px' }} /> Register
              </NavLink>
            </>
          )}
        </div> {/* End Navigation Links Section */}

      </div> {/* End Container */}
    </nav>
  );
}

// Default export is crucial for the import in App.jsx
export default Navbar;