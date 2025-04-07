 // server/models/Application.js
 const mongoose = require('mongoose');

 const ApplicationSchema = new mongoose.Schema({
   user: { // Reference to the user who owns this application
     type: mongoose.Schema.Types.ObjectId,
     required: true,
     ref: 'User', // Refers to the 'User' model
   },
   companyName: {
     type: String,
     required: [true, 'Please add a company name'],
     trim: true,
   },
   position: {
     type: String,
     required: [true, 'Please add a position title'],
     trim: true,
   },
   applicationDate: {
     type: Date,
     default: Date.now,
   },
   status: {
     type: String,
     required: true,
     enum: [ // Define possible statuses
       'Wishlist',
       'Applied',
       'Interviewing',
       'Offer Received',
       'Rejected',
       'Withdrawn',
     ],
     default: 'Applied',
   },
   notes: { // Important details
     type: String,
     trim: true,
   },
   jobDescription: { // Store the job description for AI analysis
     type: String,
     trim: true,
   },
   // Store basic info about uploaded files, not the files themselves in mongo (for free tier)
   // Actual file storage needs a separate solution (like Cloudinary or S3) for production
   // Or link to files stored locally if only for dev/local use
   resumeUrl: { type: String, trim: true }, // URL from Cloudinary
   resumePublicId: { type: String, trim: true }, // Public ID for deletion from Cloudinary
   coverLetterUrl: { type: String, trim: true }, // URL from Cloudinary
   coverLetterPublicId: { type: String, trim: true }, // Public ID for deletion from Cloudinary
   // Reminder functionality
   followUpDate: {
     type: Date,
   },
   interviewDate: {
     type: Date,
   },
   applicationLink: { // Link to the job posting or application portal
      type: String,
      trim: true
   },
   applicationMethod: { // How the application was submitted (e.g., LinkedIn Easy Apply, Company Website, Referral)
       type: String,
       trim: true
   },
   // Fields relevant for AI analysis
   requiredExperience: { // e.g., "2+ years", "Entry-level", "Senior"
     type: String,
     trim: true
   },
   keywords: [String] // Keywords extracted from job description or manually added
 }, {
   timestamps: true, // Adds createdAt and updatedAt automatically
 });

 module.exports = mongoose.model('Application', ApplicationSchema);