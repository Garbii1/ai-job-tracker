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

        // Determine public_id (filename in Cloudinary).
        // Keep original name + add timestamp for uniqueness.
        let filename = path.parse(file.originalname).name; // Get filename without extension
        filename = filename.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize filename
        const public_id = `${filename}_${Date.now()}`;

        return {
            folder: folder,
            // public_id: public_id, // Let Cloudinary generate unique ID by default is safer
            allowed_formats: ['pdf', 'doc', 'docx', 'txt'], // Specify allowed formats
            // transformation: [{ width: 500, height: 500, crop: 'limit' }] // Example transformation (not needed for docs)
        };
    },
});

// File filter (can still be used with CloudinaryStorage)
function checkFileType(file, cb) {
    const filetypes = /pdf|doc|docx|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'text/plain';

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only PDF, DOC, DOCX, TXT files are allowed!'), false);
    }
}

// Initialize upload middleware with Cloudinary storage
const upload = multer({
    storage: storage, // Use Cloudinary storage engine
    limits: {
        fileSize: 1024 * 1024 * 10 // 10MB file size limit (adjust as needed)
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;