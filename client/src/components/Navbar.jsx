// client/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react'; // Import useState, useEffect, useRef
import { Link, NavLink } from 'react-router-dom';
import {
    FaSignOutAlt, FaUserPlus, FaSignInAlt, FaTachometerAlt,
    FaPlusCircle, FaBriefcase, FaBars, FaTimes // Import FaBars (burger) and FaTimes (close icon)
} from 'react-icons/fa';

function Navbar({ user, onLogout }) {
  // State for mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navLinksRef = useRef(null); // Ref to the nav-links container
  const burgerButtonRef = useRef(null); // Ref to the burger button

  // Function to toggle the mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close menu (used by links and potentially outside clicks)
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the nav-links container AND outside the burger button
      if (
        navLinksRef.current &&
        !navLinksRef.current.contains(event.target) &&
        burgerButtonRef.current &&
        !burgerButtonRef.current.contains(event.target)
      ) {
        closeMobileMenu();
      }
    };

    // Add listener if menu is open
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // Remove listener if menu is closed
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup listener on component unmount or when menu closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]); // Re-run effect when isMobileMenuOpen changes

  // Optional: Define active style object or rely purely on CSS .active class
  const activeStyle = {
    // Example: fontWeight: 'bold',
    // color: '#61dafb'
  };

  return (
    <nav> {/* Base styles from index.css */}
      <div className="container"> {/* Centers content, handles padding */}

        {/* Brand/Logo Link */}
        <Link to={user ? "/dashboard" : "/"} className="brand" onClick={closeMobileMenu}>
          <img
            src="/logo.png" // UPDATE path if needed (e.g., /logo.png) - relative to /public
            alt=""
          />
          {/* Optional App Name Text */}
          {/* <span style={{ fontWeight: 'bold', fontSize: '1.1em', marginLeft: '8px' }}>JobTracker AI</span> */}
        </Link>

        {/* --- Mobile Burger Button --- */}
        {/* Hidden on larger screens via CSS */}
        <button
            ref={burgerButtonRef} // Add ref
            className="burger-button"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
            aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <FaTimes size="1.2em" /> : <FaBars size="1.2em" />} {/* Toggle icon, slightly larger */}
        </button>

        {/* --- Navigation Links Section --- */}
        {/* Add ref and mobile-menu-open class conditionally */}
        <div ref={navLinksRef} className={`nav-links ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          {user ? (
            // --- Logged In Links ---
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''} style={activeStyle} onClick={closeMobileMenu}>
                <FaTachometerAlt /> Dashboard
              </NavLink>
              <NavLink to="/add-application" className={({ isActive }) => isActive ? 'active' : ''} style={activeStyle} onClick={closeMobileMenu}>
                <FaPlusCircle /> Add App
              </NavLink>
              <span className="user-greeting"> Hi, {user.name}! </span>
              <button onClick={() => { onLogout(); closeMobileMenu(); }} title="Logout" className="button danger">
                 <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            // --- Logged Out Links ---
            <>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''} style={activeStyle} onClick={closeMobileMenu}>
                <FaSignInAlt /> Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''} style={activeStyle} onClick={closeMobileMenu}>
                <FaUserPlus /> Register
              </NavLink>
            </>
          )}
        </div> {/* End nav-links */}

      </div> {/* End Container */}
    </nav>
  );
}

export default Navbar;