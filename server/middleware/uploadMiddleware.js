 // server/middleware/uploadMiddleware.js
 const multer = require('multer');
 const path = require('path');
 const fs = require('fs'); // Import file system module

 // --- IMPORTANT ---
 // This uses local disk storage, suitable ONLY for local development.
 // For deployment (Render, Heroku, etc.), you MUST use cloud storage
 // like Cloudinary (good free tier), AWS S3, or Google Cloud Storage.
 // Update the 'storage' configuration accordingly for production.
 // --- IMPORTANT ---

 const uploadDir = path.join(__dirname, '../uploads');

 // Ensure upload directory exists
 if (!fs.existsSync(uploadDir)) {
     fs.mkdirSync(uploadDir, { recursive: true });
 }


 // Configure storage
 const storage = multer.diskStorage({
     destination: function (req, file, cb) {
         cb(null, uploadDir); // Save files to the 'uploads' directory
     },
     filename: function (req, file, cb) {
         // Create a unique filename: fieldname-timestamp-originalfilename
         cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
     }
 });

 // File filter (optional: accept only certain file types)
 function checkFileType(file, cb) {
     // Allowed ext
     const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
     // Check ext
     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
     // Check mime
     const mimetype = filetypes.test(file.mimetype);

     if (mimetype && extname) {
         return cb(null, true);
     } else {
         cb('Error: Images, PDFs, and Docs Only!'); // Send an error message back
     }
 }

 // Initialize upload variable
 const upload = multer({
     storage: storage,
     limits: { fileSize: 5000000 }, // Limit file size (e.g., 5MB)
     // fileFilter: function (req, file, cb) { // Optional file filter
     //     checkFileType(file, cb);
     // }
 });

 module.exports = upload;