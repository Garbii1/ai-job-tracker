 // server/controllers/authController.js
 const jwt = require('jsonwebtoken');
 const User = require('../models/User');
 const asyncHandler = require('../middleware/asyncHandler');

 // Helper function to generate JWT
 const generateToken = (id) => {
   return jwt.sign({ id }, process.env.JWT_SECRET, {
     expiresIn: process.env.JWT_EXPIRES_IN || '1d',
   });
 };

 // @desc    Register a new user
 // @route   POST /api/auth/register
 // @access  Public
 const registerUser = asyncHandler(async (req, res) => {
   const { name, email, password } = req.body;

   // Check if user already exists
   const userExists = await User.findOne({ email });
   if (userExists) {
     res.status(400); // Bad Request
     throw new Error('User already exists');
   }

   // Create user
   const user = await User.create({
     name,
     email,
     password, // Password will be hashed by the pre-save hook in the model
   });

   if (user) {
     res.status(201).json({ // 201 Created
       _id: user._id,
       name: user.name,
       email: user.email,
       token: generateToken(user._id), // Send token upon successful registration
     });
   } else {
     res.status(400);
     throw new Error('Invalid user data');
   }
 });

 // @desc    Authenticate user & get token
 // @route   POST /api/auth/login
 // @access  Public
 const loginUser = asyncHandler(async (req, res) => {
   const { email, password } = req.body;

   // Find user by email
   const user = await User.findOne({ email }).select('+password'); // Explicitly select password

   // Check if user exists and password matches
   if (user && (await user.matchPassword(password))) {
     res.json({
       _id: user._id,
       name: user.name,
       email: user.email,
       token: generateToken(user._id),
     });
   } else {
     res.status(401); // Unauthorized
     throw new Error('Invalid email or password');
   }
 });

 // @desc    Get current logged-in user data
 // @route   GET /api/auth/me
 // @access  Private
 const getMe = asyncHandler(async (req, res) => {
     // req.user is set by the protect middleware
     // We retrieve the user again in case data changed, or rely on the data from middleware
     const user = await User.findById(req.user.id).select('-password'); // Exclude password

     if (!user) {
         res.status(404);
         throw new Error('User not found');
     }
     res.status(200).json(user);
 });


 module.exports = {
   registerUser,
   loginUser,
   getMe,
 };