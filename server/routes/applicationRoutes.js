 // server/routes/applicationRoutes.js
 const express = require('express');
 const {
     createApplication,
     getApplications,
     getApplicationById,
     updateApplication,
     deleteApplication,
     uploadDocuments // Add controller for uploads
 } = require('../controllers/applicationController');
 const { protect } = require('../middleware/authMiddleware');
 const { validateApplication } = require('../middleware/validationMiddleware');
 const upload = require('../middleware/uploadMiddleware'); // Import multer setup

 const router = express.Router();

 // Apply protect middleware to all routes in this file
 router.use(protect);

 // @route   POST /api/applications
 // @desc    Create a new application
 // @access  Private
 router.post('/', validateApplication, createApplication);

 // @route   GET /api/applications
 // @desc    Get all applications for the logged-in user
 // @access  Private
 router.get('/', getApplications);

 // @route   GET /api/applications/:id
 // @desc    Get a single application by ID
 // @access  Private
 router.get('/:id', getApplicationById);

 // @route   PUT /api/applications/:id
 // @desc    Update an application
 // @access  Private
 router.put('/:id', validateApplication, updateApplication);

 // @route   DELETE /api/applications/:id
 // @desc    Delete an application
 // @access  Private
 router.delete('/:id', deleteApplication);

 // @route   POST /api/applications/:id/upload
 // @desc    Upload resume/cover letter for an application
 // @access  Private
 // Using upload.fields for multiple file types (e.g., 'resume', 'coverLetter')
 router.post('/:id/upload', upload.fields([
     { name: 'resume', maxCount: 1 },
     { name: 'coverLetter', maxCount: 1 }
 ]), uploadDocuments);


 module.exports = router;