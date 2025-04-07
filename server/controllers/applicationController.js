// server/controllers/applicationController.js
const Application = require('../models/Application');
const asyncHandler = require('../middleware/asyncHandler'); // Error handling wrapper
const cloudinary = require('../config/cloudinary'); // Cloudinary configured instance

// Note: 'path' and 'fs' are not needed if only using Cloudinary and not local disk fallback
// const path = require('path');
// const fs = require('fs');

// =========================================================================
// Middleware Function to Check Application Ownership
// DEFINED HERE - BEFORE it is used in the route handlers below
// Ensures only the user who created the application can access/modify it.
// Assumes the 'protect' middleware (which adds req.user) has run before this.
// =========================================================================
const checkOwnership = asyncHandler(async (req, res, next) => {
    // Find application by ID from route parameters
    const application = await Application.findById(req.params.id);

    // If application doesn't exist
    if (!application) {
        res.status(404); // Not Found
        throw new Error('Application not found');
    }

    // Check if req.user exists (from 'protect' middleware) and if user IDs match
    if (!req.user || application.user.toString() !== req.user.id) {
        res.status(401); // Unauthorized
        throw new Error('User not authorized to perform this action on this application');
    }

    // If checks pass, attach the found application to the request object (optional, can be useful)
    req.application = application;
    next(); // Proceed to the next middleware or route handler
});

// =========================================================================
// Controller Functions (Exported at the bottom)
// =========================================================================

// @desc    Create a new application
// @route   POST /api/applications
// @access  Private (requires login via 'protect' middleware in routes file)
const createApplication = asyncHandler(async (req, res) => {
    // Add the user ID from the authenticated user (req.user is added by 'protect' middleware)
    req.body.user = req.user.id;

    // Create application in the database using data from request body
    // Mongoose validation (from model) will run automatically
    const application = await Application.create(req.body);

    // Respond with 201 Created status and the newly created application data
    res.status(201).json(application);
});

// @desc    Get all applications for the currently logged-in user
// @route   GET /api/applications
// @access  Private (requires login)
const getApplications = asyncHandler(async (req, res) => {
    // Find all applications where the 'user' field matches the logged-in user's ID
    // Sort by creation date descending (newest first)
    const applications = await Application.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Respond with 200 OK status and the array of applications
    res.status(200).json(applications);
});

// @desc    Get a single application by its ID
// @route   GET /api/applications/:id
// @access  Private (Requires login AND ownership checked by 'checkOwnership' middleware)
const getApplicationById = [ // Array includes middleware to run first
    checkOwnership, // 1. Verify ownership
    asyncHandler(async (req, res) => { // 2. Main handler logic
        // req.application might be available if needed, or fetch again
        const application = await Application.findById(req.params.id);
        if (!application) { // Should be caught by checkOwnership, but good failsafe
            res.status(404);
            throw new Error('Application not found');
        }
        // Respond with 200 OK and the specific application data
        res.status(200).json(application);
    })
];

// @desc    Update an existing application by its ID
// @route   PUT /api/applications/:id
// @access  Private (Requires login AND ownership)
const updateApplication = [ // Array includes middleware
    checkOwnership, // 1. Verify ownership
    asyncHandler(async (req, res) => { // 2. Main handler logic
        // Find the application by ID and update it with data from request body
        // { new: true } returns the updated document
        // { runValidators: true } ensures model validation rules are applied on update
        const updatedApplication = await Application.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        // Respond with 200 OK and the updated application data
        res.status(200).json(updatedApplication);
    })
];

// @desc    Upload resume and/or cover letter to Cloudinary for a specific application
// @route   POST /api/applications/:id/upload
// @access  Private (Requires login AND ownership)
const uploadDocuments = [ // Array includes middleware
    checkOwnership, // 1. Verify ownership
    asyncHandler(async (req, res) => { // 2. Main handler logic (runs AFTER multer has processed files)
        // req.files is populated by multer using CloudinaryStorage
        // It contains info like path (Cloudinary URL) and filename (Cloudinary Public ID)
        console.log('Cloudinary Upload Files Data received in controller:', req.files);

        const application = req.application; // Get application from checkOwnership middleware
        const updateData = {}; // Object to hold fields to update in MongoDB
        let filesProcessed = false;

        // Process Resume file if uploaded
        if (req.files.resume && req.files.resume[0]) {
            filesProcessed = true;
            // Delete old file from Cloudinary if it exists
            if (application.resumePublicId) {
                try {
                    await cloudinary.uploader.destroy(application.resumePublicId);
                    console.log(`Deleted old resume from Cloudinary: ${application.resumePublicId}`);
                } catch (cloudinaryError) {
                    console.error(`Cloudinary delete error for old resume (${application.resumePublicId}):`, cloudinaryError.message);
                    // Decide if failure to delete old file should block update (usually not)
                }
            }
            // Store new Cloudinary URL and Public ID
            updateData.resumeUrl = req.files.resume[0].path;
            updateData.resumePublicId = req.files.resume[0].filename;
            console.log(`Resume - URL: ${updateData.resumeUrl}, PublicID: ${updateData.resumePublicId}`);
        }

        // Process Cover Letter file if uploaded
        if (req.files.coverLetter && req.files.coverLetter[0]) {
            filesProcessed = true;
            // Delete old file from Cloudinary if it exists
            if (application.coverLetterPublicId) {
                try {
                    await cloudinary.uploader.destroy(application.coverLetterPublicId);
                    console.log(`Deleted old cover letter from Cloudinary: ${application.coverLetterPublicId}`);
                } catch (cloudinaryError) {
                    console.error(`Cloudinary delete error for old cover letter (${application.coverLetterPublicId}):`, cloudinaryError.message);
                }
            }
            // Store new Cloudinary URL and Public ID
            updateData.coverLetterUrl = req.files.coverLetter[0].path;
            updateData.coverLetterPublicId = req.files.coverLetter[0].filename;
             console.log(`CoverLetter - URL: ${updateData.coverLetterUrl}, PublicID: ${updateData.coverLetterPublicId}`);
        }

        // Check if any files were actually processed by multer
        if (!filesProcessed) {
            res.status(400); // Bad Request
            throw new Error('No valid files found in upload request. Ensure field names are "resume" or "coverLetter" and files meet requirements.');
        }

        // Update the application document in MongoDB with the new Cloudinary details
        const updatedApplication = await Application.findByIdAndUpdate(
            req.params.id,
            { $set: updateData }, // Use $set to update only the specified fields
            { new: true, runValidators: true } // Return updated doc, run validators
        );

        // Respond with 200 OK and the updated application data
        res.status(200).json({
            message: 'Files uploaded successfully to Cloudinary!',
            application: updatedApplication,
        });
    })
];


// @desc    Delete an application by its ID (including associated Cloudinary files)
// @route   DELETE /api/applications/:id
// @access  Private (Requires login AND ownership)
const deleteApplication = [ // Array includes middleware
    checkOwnership, // 1. Verify ownership
    asyncHandler(async (req, res) => { // 2. Main handler logic
        // req.application was attached by checkOwnership
        const application = req.application;

        // Attempt to delete associated files from Cloudinary first
        const deletionPromises = [];
        if (application.resumePublicId) {
            deletionPromises.push(cloudinary.uploader.destroy(application.resumePublicId));
            console.log(`Attempting to delete resume from Cloudinary: ${application.resumePublicId}`);
        }
        if (application.coverLetterPublicId) {
            deletionPromises.push(cloudinary.uploader.destroy(application.coverLetterPublicId));
            console.log(`Attempting to delete cover letter from Cloudinary: ${application.coverLetterPublicId}`);
        }

        // Wait for all Cloudinary deletions to attempt
        try {
             await Promise.all(deletionPromises);
             console.log(`Cloudinary deletion process completed for application ${application._id}`);
        } catch (cloudinaryError) {
             // Log the error but proceed with deleting the database record
             console.error(`Cloudinary file deletion error during application delete (${application._id}):`, cloudinaryError.message);
        }

        // Delete the application record from MongoDB
        await Application.deleteOne({ _id: req.params.id });

        // Respond with 200 OK and success message
        res.status(200).json({ message: 'Application and associated files removed successfully', id: req.params.id });
    })
];

// =========================================================================
// Export all controller functions to be used in the routes file
// =========================================================================
module.exports = {
    createApplication,
    getApplications,
    getApplicationById,
    updateApplication,
    deleteApplication,
    uploadDocuments // Ensure this is correctly exported
};