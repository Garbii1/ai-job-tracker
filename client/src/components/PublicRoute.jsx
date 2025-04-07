// client/src/components/PublicRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// Protects routes like Login/Register, redirecting logged-in users away
function PublicRoute({ children, isAuth }) {
  if (isAuth) {
    // Redirect logged-in users away from public-only pages (e.g., login)
    return <Navigate to="/dashboard" replace />;
  }
  return children; // Render the public component (e.g., Login)
}

export default PublicRoute;