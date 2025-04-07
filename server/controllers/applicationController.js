 // server/controllers/applicationController.js
 const Application = require('../models/Application');
 const User = require('../models/User'); // If needed for checks, though protect middleware handles user ID
 const asyncHandler = require('../middleware/asyncHandler');

 // @desc    Create a new application
 // @route   POST /api/applications
 // @access  Private
 const createApplication = asyncHandler(async (req, res) => {
   // Get data from request body
   const { companyName, position, status, notes, jobDescription, followUpDate, interviewDate, applicationLink, applicationMethod, requiredExperience, keywords } = req.body;

   // Create application associated with the logged-in user (req.user comes from 'protect' middleware)
   const application = await Application.create({
     user: req.user.id, // Associate with logged-in user
     companyName,
     position,
     status,
     notes,
     jobDescription,
     followUpDate,
     interviewDate,
     applicationLink,
     applicationMethod,
     requiredExperience,
     keywords
     // resumeFilename and coverLetterFilename will be updated via the upload route
   });

   res.status(201).json(application);
 });

 // @desc    Get all applications for the logged-in user
 // @route   GET /api/applications
 // @access  Private
 const getApplications = asyncHandler(async (req, res) => {
   // Find applications belonging to the logged-in user
   // Sort by creation date descending (newest first)
   const applications = await Application.find({ user: req.user.id }).sort({ createdAt: -1 });
   res.status(200).json(applications);
 });

 // @desc    Get a single application by ID
 // @route   GET /api/applications/:id
 // @access  Private
 const getApplicationById = asyncHandler(async (req, res) => {
   const application = await Application.findById(req.params.id);

   if (!application) {
     res.status(404);
     throw new Error('Application not found');
   }

   // Check if the logged-in user owns this application
   if (application.user.toString() !== req.user.id) {
     res.status(401); // Unauthorized
     throw new Error('User not authorized to access this application');
   }

   res.status(200).json(application);
 });

 // @desc    Update an application
 // @route   PUT /api/applications/:id
 // @access  Private
 const updateApplication = asyncHandler(async (req, res) => {
   let application = await Application.findById(req.params.id);

   if (!application) {
     res.status(404);
     throw new Error('Application not found');
   }

   // Check ownership
   if (application.user.toString() !== req.user.id) {
     res.status(401);
     throw new Error('User not authorized to update this application');
   }

   // Update the application fields
   // Use req.body which contains the validated & sanitized data
   application = await Application.findByIdAndUpdate(req.params.id, req.body, {
     new: true, // Return the modified document
     runValidators: true, // Ensure model validations run on update
   });

   res.status(200).json(application);
 });

 // @desc    Delete an application
 // @route   DELETE /api/applications/:id
 // @access  Private
 const deleteApplication = asyncHandler(async (req, res) => {
   const application = await Application.findById(req.params.id);

   if (!application) {
     res.status(404);
     throw new Error('Application not found');
   }

   // Check ownership
   if (application.user.toString() !== req.user.id) {
     res.status(401);
     throw new Error('User not authorized to delete this application');
   }

   // NOTE: If using local file storage, you might want to delete associated files here
   // e.g., using fs.unlinkSync(path.join(__dirname, '../uploads', application.resumeFilename));
   // This gets more complex with cloud storage.

   await application.deleteOne(); // Use deleteOne() Mongoose method

   res.status(200).json({ message: 'Application removed', id: req.params.id });
 });

 // @desc    Upload resume/cover letter for an application
 // @route   POST /api/applications/:id/upload
 // @access  Private
 const uploadDocuments = asyncHandler(async (req, res) => {
     const application = await Application.findById(req.params.id);

     if (!application) {
         res.status(404);
         throw new Error('Application not found');
     }

     // Check ownership
     if (application.user.toString() !== req.user.id) {
         res.status(401);
         throw new Error('User not authorized to upload for this application');
     }

     // req.files is an object containing the uploaded files from multer's `fields`
     // e.g., req.files['resume'][0], req.files['coverLetter'][0]
     let updated = false;
     const updateData = {};

     if (req.files.resume) {
         // Store the filename (or cloud storage URL in production)
         updateData.resumeFilename = req.files.resume[0].filename;
         // Optionally store original name, mime type etc. if needed
         updated = true;
         console.log(`Resume uploaded: ${req.files.resume[0].filename}`);
     }
      if (req.files.coverLetter) {
         updateData.coverLetterFilename = req.files.coverLetter[0].filename;
          updated = true;
          console.log(`Cover Letter uploaded: ${req.files.coverLetter[0].filename}`);
      }

     if (updated) {
         const updatedApplication = await Application.findByIdAndUpdate(
             req.params.id,
             { $set: updateData }, // Use $set to update only specific fields
             { new: true, runValidators: true }
         );
          res.status(200).json({
              message: 'Files uploaded successfully',
              application: updatedApplication
          });
     } else {
         res.status(400).json({ message: 'No files were uploaded or field names mismatch' });
     }
 });


 module.exports = {
   createApplication,
   getApplications,
   getApplicationById,
   updateApplication,
   deleteApplication,
   uploadDocuments // Export upload controller
 };