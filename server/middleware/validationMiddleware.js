 // server/middleware/validationMiddleware.js
 const { body, validationResult } = require('express-validator');

 // Helper to format validation errors
 const handleValidationErrors = (req, res, next) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
         // Return only the message for simplicity, or format as needed
         const errorMessages = errors.array().map(err => err.msg);
         return res.status(400).json({ errors: errorMessages });
     }
     next();
 };

 // Validation rules for registration
 const validateRegistration = [
     body('name', 'Name is required').not().isEmpty().trim().escape(),
     body('email', 'Please include a valid email').isEmail().normalizeEmail(),
     body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
     handleValidationErrors // Apply the error handler
 ];

 // Validation rules for login
 const validateLogin = [
     body('email', 'Please include a valid email').isEmail().normalizeEmail(),
     body('password', 'Password is required').exists(),
     handleValidationErrors // Apply the error handler
 ];

 // Validation rules for creating/updating application (example)
 const validateApplication = [
     body('companyName', 'Company name is required').not().isEmpty().trim().escape(),
     body('position', 'Position is required').not().isEmpty().trim().escape(),
     body('status', 'Status is required').isIn([
         'Wishlist', 'Applied', 'Interviewing', 'Offer Received', 'Rejected', 'Withdrawn'
     ]),
     // Add more validations as needed (e.g., isDate for dates if required)
     body('notes').optional().trim(),
     body('jobDescription').optional().trim(), // Don't escape job desc for AI
     body('applicationLink').optional().isURL().withMessage('Please provide a valid URL'),
     body('applicationMethod').optional().trim().escape(),
     body('requiredExperience').optional().trim().escape(),
     body('keywords').optional().isArray(),
     body('keywords.*').optional().trim().escape(), // Sanitize individual keywords
     handleValidationErrors
 ];


 module.exports = {
     validateRegistration,
     validateLogin,
     validateApplication
 };