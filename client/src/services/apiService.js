 // client/src/services/apiService.js
 import axios from 'axios';

 // Get API base URL from environment variables
 const API_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // Fallback to relative path

 // Create an Axios instance with default settings
 const api = axios.create({
   baseURL: API_URL,
 });

 // --- Request Interceptor ---
 // Add Authorization header with JWT token to requests if available
 api.interceptors.request.use(
   (config) => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers['Authorization'] = `Bearer ${token}`;
     }
     return config; // Continue with the request configuration
   },
   (error) => {
     // Handle request configuration errors
     console.error('Axios request interceptor error:', error);
     return Promise.reject(error);
   }
 );

 // --- Response Interceptor (Optional but useful) ---
 // Handle common errors like 401 Unauthorized (e.g., token expired)
 api.interceptors.response.use(
   (response) => response, // Pass through successful responses
   (error) => {
     if (error.response && error.response.status === 401) {
       // Token is invalid or expired
       console.warn('Unauthorized access (401). Token might be invalid or expired.');
       localStorage.removeItem('token'); // Remove invalid token
       // Redirect to login page - use window.location for simplicity outside React components
       if (!window.location.pathname.includes('/login')) { // Avoid redirect loop
           window.location.href = '/login?sessionExpired=true';
       }
     }
     // Return the error promise so components can handle specific errors
     return Promise.reject(error);
   }
 );


 // === API Service Functions ===

 // -- Auth --
 export const register = (userData) => api.post('/auth/register', userData);
 export const login = (userData) => api.post('/auth/login', userData);
 export const getMe = () => api.get('/auth/me'); // Get current user

 // -- Applications --
 export const getApplications = () => api.get('/applications');
 export const createApplication = (appData) => api.post('/applications', appData);
 export const getApplicationById = (id) => api.get(`/applications/${id}`);
 export const updateApplication = (id, appData) => api.put(`/applications/${id}`, appData);
 export const deleteApplication = (id) => api.delete(`/applications/${id}`);

 // File upload (uses FormData, requires different Content-Type header)
 export const uploadFiles = (id, formData) => {
     return api.post(`/applications/${id}/upload`, formData, {
         headers: {
             'Content-Type': 'multipart/form-data', // Crucial for file uploads!
         },
     });
 };


 // -- AI Features --
 export const generateAICoverLetter = (data) => api.post('/ai/generate-cover-letter', data);
 export const analyzeAIApplicationFit = (data) => api.post('/ai/analyze-application', data);
 export const suggestAIFollowUp = (data) => api.post('/ai/suggest-follow-up', data);
 export const getAISuccessInsights = () => api.get('/ai/success-insights');

 export default api; // Export the configured instance if needed elsewhere