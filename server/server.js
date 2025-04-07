 // server/server.js
 const express = require('express');
 const dotenv = require('dotenv');
 const cors = require('cors');
 const path = require('path'); // Core Node.js module
 const connectDB = require('./config/db');
 const errorHandler = require('./middleware/errorMiddleware'); // We'll create this

 // Load env vars
 dotenv.config();

 // Connect to database
 connectDB();

 // Initialize express app
 const app = express();

 // Middleware
 // Enable CORS - Configure for production later
 app.use(cors({
   origin: process.env.CLIENT_URL || 'http://localhost:5173', // Allow requests from frontend origin
   credentials: true // If needed for cookies/sessions later
 }));
 // Body Parser Middleware (for parsing JSON request bodies)
 app.use(express.json());
 // Middleware to parse URL-encoded data (form submissions)
 app.use(express.urlencoded({ extended: false }));

 // --- API Routes ---
 app.get('/api', (req, res) => { // Simple API status check
     res.json({ message: 'Welcome to the Job Tracker API' });
 });
 app.use('/api/auth', require('./routes/authRoutes'));
 app.use('/api/applications', require('./routes/applicationRoutes'));
 app.use('/api/ai', require('./routes/aiRoutes'));

 // --- Static File Serving (for uploaded files in development) ---
 // IMPORTANT: This serves files from local disk. For Render/production,
 // you MUST use a cloud storage service (like Cloudinary) for persistence.
 // The '/uploads' path here assumes an 'uploads' folder in the 'server' directory.
 app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 console.log('Serving static files from:', path.join(__dirname, 'uploads')); // Debug log

 // --- Custom Error Handler Middleware (should be last) ---
 app.use(errorHandler);

 // Define Port
 const PORT = process.env.PORT || 5001; // Use environment variable or default

 // Start Server
 app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));