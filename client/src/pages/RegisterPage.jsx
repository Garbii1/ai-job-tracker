 // client/src/pages/RegisterPage.jsx
 import React, { useState } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { register } from '../services/apiService';
 import { FaUserPlus } from 'react-icons/fa';

 function RegisterPage() {
   const [formData, setFormData] = useState({
     name: '',
     email: '',
     password: '',
     confirmPassword: '',
   });
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [loading, setLoading] = useState(false);
   const navigate = useNavigate();

   const { name, email, password, confirmPassword } = formData;

   const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

   const onSubmit = async (e) => {
     e.preventDefault();
     setError('');
     setSuccess('');

     if (password !== confirmPassword) {
       setError('Passwords do not match.');
       return;
     }
      if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          return;
      }

     setLoading(true);
     try {
       await register({ name, email, password });
       setSuccess('Registration successful! Redirecting to login...');
       setTimeout(() => {
           navigate('/login'); // Redirect to login after short delay
       }, 2000);
     } catch (err) {
       const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
       setError(errorMsg);
       console.error("Registration error:", err.response || err);
       setLoading(false); // Stop loading only on error
     }
   };

   return (
     <form onSubmit={onSubmit}>
       <h2><FaUserPlus /> Register</h2>
       {error && <p className="alert alert-danger">{error}</p>}
       {success && <p className="alert alert-success">{success}</p>}
       <div>
         <label htmlFor="name">Name</label>
         <input type="text" id="name" name="name" value={name} onChange={onChange} required autoComplete="name" />
       </div>
       <div>
         <label htmlFor="email">Email Address</label>
         <input type="email" id="email" name="email" value={email} onChange={onChange} required autoComplete="email" />
       </div>
       <div>
         <label htmlFor="password">Password (min. 6 characters)</label>
         <input type="password" id="password" name="password" value={password} onChange={onChange} required autoComplete="new-password"/>
       </div>
       <div>
         <label htmlFor="confirmPassword">Confirm Password</label>
         <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={onChange} required autoComplete="new-password" />
       </div>
       <button type="submit" disabled={loading || success}>
         {loading ? 'Registering...' : 'Register'}
       </button>
        <p style={{ marginTop: '1rem' }}>
           Already have an account? <Link to="/login">Login Here</Link>
        </p>
     </form>
   );
 }

 export default RegisterPage;