// client/src/components/Navbar.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // Use NavLink for active styling
import {
    FaSignOutAlt, FaUserPlus, FaSignInAlt, FaTachometerAlt, FaPlusCircle, FaBriefcase
} from 'react-icons/fa';

function Navbar({ user, onLogout }) {

  // Optional: Define active style object or rely purely on CSS .active class
  const activeStyle = {
    // fontWeight: 'bold', // Handled by CSS potentially
    // color: '#61dafb'
  };

  return (
    <nav> {/* Uses styles from index.css */}
      <div className="container"> {/* Centers content */}

        {/* Brand/Logo Link */}
        <Link to={user ? "/dashboard" : "/"} className="brand">
          {/* Logo Image */}
          <img
            src="/logo.png" // UPDATE if using a different filename/extension in /public
            alt=""
            // Style adjusted slightly via CSS base styles now
          />
          {/* App Name Text */}
          <span style={{ fontWeight: 'bold', fontSize: '1.1em', marginLeft: '8px' }}>JobTracker AI</span>
        </Link>

        {/* Navigation Links Section - Added className="nav-links" */}
        <div className="nav-links">

          {/* Conditional Rendering based on user prop */}
          {user ? (
            // --- Logged In Links ---
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => isActive ? 'active' : ''} // Use className for active state
                style={activeStyle} // Optional inline style override
              >
                <FaTachometerAlt style={{ marginRight: '5px' }} /> Dashboard
              </NavLink>

              <NavLink
                to="/add-application"
                className={({ isActive }) => isActive ? 'active' : ''}
                style={activeStyle}
              >
                <FaPlusCircle style={{ marginRight: '5px' }} /> Add App
              </NavLink>

              {/* Display user's name - Added className="user-greeting" */}
              <span className="user-greeting">
                Hi, {user.name}!
              </span>

              {/* Logout Button */}
              <button onClick={onLogout} title="Logout" className="button danger"> {/* Use button classes */}
                 <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            // --- Logged Out Links ---
            <>
              <NavLink
                to="/login"
                 className={({ isActive }) => isActive ? 'active' : ''}
                 style={activeStyle}
              >
                <FaSignInAlt style={{ marginRight: '5px' }} /> Login
              </NavLink>
              <NavLink
                to="/register"
                 className={({ isActive }) => isActive ? 'active' : ''}
                 style={activeStyle}
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

export default Navbar;