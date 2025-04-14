// client/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationFormPage from './pages/ApplicationFormPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage'; // <-- Import HomePage

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Spinner from './components/Spinner';

// API & Auth
import { getMe } from './services/apiService'; // Assuming this exists
import { jwtDecode } from 'jwt-decode';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
      // ... (Your existing checkAuth logic) ...
      // Ensure it sets user state correctly and setLoading(false)
      const token = localStorage.getItem('token');
      if (token) { /* ...verify token, fetch user... */ }
      else { setUser(null); }
      setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
      // ... (Your existing handleLogout logic) ...
      localStorage.removeItem('token');
      setUser(null);
  };

  const handleLoginSuccess = async () => {
      setLoading(true);
      await checkAuth();
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Router>
      {/* Navbar rendered on all pages */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Use a wrapper for main content, but HomePage might bypass standard container */}
      <main>
        <Routes>
          {/* --- Route for HomePage --- */}
          {/* Render HomePage directly without the .container wrapper */}
          <Route path="/" element={<HomePage />} />

          {/* Public Routes (Login/Register) */}
          {/* Wrap these pages in the standard container */}
          <Route path="/login" element={
            <PublicRoute isAuth={!!user}>
              <div className="container"> <LoginPage onLoginSuccess={handleLoginSuccess} /> </div>
            </PublicRoute>
          }/>
          <Route path="/register" element={
            <PublicRoute isAuth={!!user}>
               <div className="container"> <RegisterPage /> </div>
            </PublicRoute>
           }/>

          {/* Protected Routes */}
          {/* Wrap protected pages in the standard container */}
          <Route path="/dashboard" element={
            <ProtectedRoute isAuth={!!user}>
              <div className="container"><DashboardPage user={user}/></div>
            </ProtectedRoute>
          }/>
          <Route path="/add-application" element={
            <ProtectedRoute isAuth={!!user}>
               <div className="container"><ApplicationFormPage /></div>
            </ProtectedRoute>
          }/>
          <Route path="/edit-application/:id" element={
            <ProtectedRoute isAuth={!!user}>
               <div className="container"><ApplicationFormPage /></div>
            </ProtectedRoute>
          }/>
          <Route path="/application/:id" element={
            <ProtectedRoute isAuth={!!user}>
              <div className="container"><ApplicationDetailPage /></div>
            </ProtectedRoute>
          }/>

          {/* Not Found Route */}
          <Route path="*" element={<div className="container"><NotFoundPage /></div>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;