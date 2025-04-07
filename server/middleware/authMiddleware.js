  // server/middleware/authMiddleware.js
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  const asyncHandler = require('./asyncHandler'); // We'll create this helper next

  // Protect routes
  const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from the token (select excludes password)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
           res.status(401);
           throw new Error('Not authorized, user not found');
        }

        next(); // Proceed to the next middleware/controller
      } catch (error) {
        console.error(error);
        res.status(401);
        throw new Error('Not authorized, token failed');
      }
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }
  });

  module.exports = { protect };