// server/config/cloudinary.js
const cloudinary = require('cloudinary').v2; // Use v2 API
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Configure Cloudinary SDK
// Checks if keys exist, otherwise Cloudinary SDK might throw errors later
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true // Use https
    });
    console.log('Cloudinary configured successfully.');
} else {
    console.warn('WARNING: Cloudinary environment variables not fully set. File uploads will likely fail.');
}

module.exports = cloudinary; // Export the configured cloudinary object