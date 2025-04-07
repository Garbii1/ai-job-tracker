 // client/src/pages/LoginPage.jsx
 import React, { useState } from 'react';
 import { useNavigate, Link, useLocation } from 'react-router-dom';
 import { login } from '../services/apiService';
 import { FaSignInAlt } from 'react-icons/fa';

 function LoginPage({ onLoginSuccess }) {
   const [formData, setFormData] = useState({ email: '', password: '' });
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const navigate = useNavigate();
   const location = useLocation(); // To get potential redirect state

   const { email, password } = formData;

   const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

   const onSubmit = async (e) => {
     e.preventDefault();
     setError(''); // Clear previous errors
     setLoading(true);
     try {
       const response = await login({ email, password });
       localStorage.setItem('token', response.data.token); // Store token
       await onLoginSuccess(); // Notify App.jsx to update user state

       // Redirect to intended page or dashboard
       const from = location.state?.from?.pathname || '/dashboard';
       navigate(from, { replace: true });

     } catch (err) {
       const errorMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
       setError(errorMsg);
       console.error("Login error:", err.response || err);
       setLoading(false);
     }
     // No need to setLoading(false) on success due to navigation
   };

   return (
     <form onSubmit={onSubmit}>
       <h2><FaSignInAlt /> Login</h2>
       {error && <p className="alert alert-danger">{error}</p>}
        {location.search.includes('sessionExpired=true') && (
           <p className="alert alert-warning">Your session expired. Please log in again.</p>
       )}
       <div>
         <label htmlFor="email">Email Address</label>
         <input
           type="email"
           id="email"
           name="email"
           value={email}
           onChange={onChange}
           required
           autoComplete="email"
         />
       </div>
       <div>
         <label htmlFor="password">Password</label>
         <input
           type="password"
           id="password"
           name="password"
           value={password}
           onChange={onChange}
           required
           autoComplete="current-password"
         />
       </div>
       <button type="submit" disabled={loading}>
         {loading ? 'Logging in...' : 'Login'}
       </button>
       <p style={{ marginTop: '1rem' }}>
         Don't have an account? <Link to="/register">Register Here</Link>
       </p>
     </form>
   );
 }

 export default LoginPage;