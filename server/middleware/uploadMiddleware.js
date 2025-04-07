// server/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary'); // Import configured Cloudinary instance
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Import CloudinaryStorage

// --- Configure Cloudinary Storage ---
const storage = new CloudinaryStorage({
    cloudinary: cloudinary, // Your configured cloudinary instance
    params: async (req, file) => {
        // Determine folder based on user and application (optional but good practice)
        const userId = req.user ? req.user.id : 'unauthenticated';
        const applicationId = req.params.id || 'new_application'; // Get app ID from route params
        let folder = `job_tracker/${userId}/${applicationId}`;

        // Determine public_id (filename in Cloudinary). *Optional*: Letting Cloudinary auto-generate is often safer.
        // let filename = path.parse(file.originalname).name; // Get filename without extension
        // filename = filename.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize filename
        // const public_id = `${filename}_${Date.now()}`;

        return {
            folder: folder,
            // public_id: public_id, // Uncomment if you want custom filenames

            // --- Specify resource_type for non-image files ---
            resource_type: "raw", // ADDED: Treat PDFs, DOCX etc. as raw files for correct handling & access

            // Specify allowed formats for Cloudinary validation (optional but good)
            allowed_formats: ['pdf', 'doc', 'docx', 'txt'],

            // --- Optional: Explicitly set access mode if 'raw' alone doesn't grant public access ---
            // access_mode: "public", // Try uncommenting this if you still get 401 errors after adding 'raw'

            // transformation: [{ width: 500, height: 500, crop: 'limit' }] // Example transformation (not needed for docs)
        };
    },
});

// File filter function (can still be used with CloudinaryStorage for client-side feedback)
function checkFileType(file, cb) {
    // Define allowed extensions and mime types
    const filetypes = /pdf|doc|docx|txt/;
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    // Check the extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check the mime type
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (mimetype && extname) {
        // Accept the file
        return cb(null, true);
    } else {
        // Reject the file
        // Create an error message that can be caught later
        const err = new Error('Invalid file type. Only PDF, DOC, DOCX, TXT files are allowed!');
        err.status = 400; // Set a status code for bad request
        return cb(err, false);
    }
}

// Initialize upload middleware with Cloudinary storage and file filter
const upload = multer({
    storage: storage, // Use Cloudinary storage engine
    limits: {
        fileSize: 1024 * 1024 * 10 // 10MB file size limit (adjust as needed)
    },
    fileFilter: function (req, file, cb) {
        // Apply the file filter function
        checkFileType(file, cb);
    }
    // Note: Error handling for multer (like file size limit, file type errors)
    // should ideally be handled in the route or a dedicated error handling middleware.
});

// Export the configured multer instance
module.exports = upload;