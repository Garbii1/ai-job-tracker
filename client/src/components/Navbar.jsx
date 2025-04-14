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

function Navbar({ user, onLogout }) {

  // Style for active NavLink (optional, can also be done purely with CSS class)
  const activeStyle = {
    fontWeight: 'bold',
    color: '#61dafb' // Example active color - adjust as needed
  };

  return (
    <nav> {/* Uses styles from index.css */}
      <div className="container"> {/* Centers content */}

        {/* Brand/Logo Link */}
        <Link to={user ? "/dashboard" : "/"} className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          {/* Logo Image */}
          <img
            src="/logo.png" // UPDATE PATH if your logo is different (e.g., /logo.png) - relative to public/
            alt="JobTracker AI" // Descriptive alt text
            style={{ height: '35px', width: 'auto', verticalAlign: 'middle' }} // Adjust size
          />
          {/* Optional: Keep or remove text based on your logo design */}
          {/* <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>JobTracker AI</span> */}
        </Link>

        {/* Navigation Links Section - Add className="nav-links" */}
        <div className="nav-links">

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

              {/* Display user's name - Add className="user-greeting" */}
              <span className="user-greeting">
                Hi, {user.name}!
              </span>

              {/* Logout Button */}
              <button onClick={onLogout} title="Logout" className="button danger"> {/* Use button classes from index.css */}
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