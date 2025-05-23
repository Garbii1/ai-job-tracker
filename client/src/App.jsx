 // client/src/App.jsx
 import React, { useState, useEffect, useCallback } from 'react';
 import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
 import { jwtDecode } from 'jwt-decode'; // Use named import

 // Pages
 import HomePage from './pages/HomePage';
 import LoginPage from './pages/LoginPage';
 import RegisterPage from './pages/RegisterPage';
 import DashboardPage from './pages/DashboardPage';
 import ApplicationFormPage from './pages/ApplicationFormPage';
 import ApplicationDetailPage from './pages/ApplicationDetailPage';
 import NotFoundPage from './pages/NotFoundPage';

 // Components
 import Navbar from './components/Navbar'; // Create this component
 import ProtectedRoute from './components/ProtectedRoute'; // Create this component
 import PublicRoute from './components/PublicRoute'; // Create this component
 import Spinner from './components/Spinner'; // Create this component

 // API
 import { getMe } from './services/apiService';

 // Main App Component
 function App() {
   const [user, setUser] = useState(null); // Store user object or null
   const [loading, setLoading] = useState(true); // Loading state for initial auth check

   // Function to check token validity and fetch user data
   const checkAuth = useCallback(async () => {
       const token = localStorage.getItem('token');
       if (token) {
           try {
               const decoded = jwtDecode(token);
               // Check token expiration (jwtDecode doesn't verify signature)
               const isExpired = decoded.exp * 1000 < Date.now();
               if (isExpired) {
                   console.log('Token expired.');
                   localStorage.removeItem('token');
                   setUser(null);
               } else {
                   // Token exists and not expired (locally), fetch user data to verify on backend
                   const userData = await getMe(); // This call will fail if token is invalid on backend
                   setUser(userData.data); // Store user data
                   console.log('User authenticated:', userData.data.email);
               }
           } catch (error) {
               console.error('Auth check failed:', error.response?.data?.message || error.message);
               localStorage.removeItem('token'); // Remove invalid token
               setUser(null);
               // Error handler in apiService might redirect, but handle here too if needed
           }
       } else {
           setUser(null); // No token found
       }
       setLoading(false); // Finished auth check
   }, []); // useCallback to memoize the function

   // Run auth check on initial mount
   useEffect(() => {
     checkAuth();
   }, [checkAuth]); // Re-run if checkAuth changes (it shouldn't due to useCallback)

   // Function to handle logout
   const handleLogout = () => {
     localStorage.removeItem('token');
     setUser(null);
     // Navigate('/login'); // Navigation handled by route protection change
     console.log('User logged out.');
   };

    // Function passed to login page to update user state
   const handleLoginSuccess = async () => {
       setLoading(true); // Show loading while fetching user data after login
       await checkAuth(); // Refetch user data to update state
   };

   // Display loading spinner during initial auth check
   if (loading) {
     return <Spinner />;
   }

   // Render the application routes
   return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      {/* Use <main> tag, but don't apply .container globally here */}
      <main>
        <Routes>
          {/* === Route for HomePage (No Container Here) === */}
          <Route path="/" element={<HomePage />} />

          {/* === Other Routes (Wrapped in Container) === */}
          <Route path="/login" element={ <PublicRoute isAuth={!!user}> <div className="container"><LoginPage onLoginSuccess={handleLoginSuccess} /></div> </PublicRoute> }/>
          <Route path="/register" element={ <PublicRoute isAuth={!!user}> <div className="container"><RegisterPage /></div> </PublicRoute> }/>
          <Route path="/dashboard" element={ <ProtectedRoute isAuth={!!user}> <div className="container"><DashboardPage user={user}/></div> </ProtectedRoute> }/>
          <Route path="/add-application" element={ <ProtectedRoute isAuth={!!user}> <div className="container"><ApplicationFormPage /></div> </ProtectedRoute> }/>
          <Route path="/edit-application/:id" element={ <ProtectedRoute isAuth={!!user}> <div className="container"><ApplicationFormPage /></div> </ProtectedRoute> }/>
          <Route path="/application/:id" element={ <ProtectedRoute isAuth={!!user}> <div className="container"><ApplicationDetailPage /></div> </ProtectedRoute> }/>
          <Route path="*" element={ <div className="container"><NotFoundPage /></div> } />

        </Routes>
      </main>
    </Router>
  );
}

export default App;