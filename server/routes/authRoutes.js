 // server/routes/authRoutes.js
 const express = require('express');
 const { registerUser, loginUser, getMe } = require('../controllers/authController');
 const { protect } = require('../middleware/authMiddleware');
 const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware'); // We'll create this

 const router = express.Router();

 // @route   POST /api/auth/register
 // @desc    Register a new user
 // @access  Public
 router.post('/register', validateRegistration, registerUser); // Add validation

 // @route   POST /api/auth/login
 // @desc    Authenticate user & get token
 // @access  Public
 router.post('/login', validateLogin, loginUser); // Add validation

 // @route   GET /api/auth/me
 // @desc    Get current logged-in user data (useful for frontend)
 // @access  Private
 router.get('/me', protect, getMe);

 module.exports = router;