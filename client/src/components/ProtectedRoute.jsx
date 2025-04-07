// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Protects routes that require authentication
function ProtectedRoute({ children, isAuth }) {
  const location = useLocation();

  if (!isAuth) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to in the state. This allows us to send them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children; // Render the protected component
}

export default ProtectedRoute;