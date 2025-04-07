 // server/middleware/errorMiddleware.js
    // Catches errors passed by 'next(err)'
    const errorHandler = (err, req, res, next) => {
        console.error('ERROR STACK:', err.stack); // Log error stack trace for debugging
  
        // Default error status code and message
        let statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Use existing status code if set, else 500
        let message = err.message || 'Internal Server Error';
  
        // Handle Mongoose Bad ObjectId (CastError)
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
          statusCode = 404; // Not Found is more appropriate than Bad Request
          message = `Resource not found with id of ${err.value}`;
        }
  
        // Handle Mongoose Duplicate Key Error (code 11000)
        if (err.code === 11000) {
          statusCode = 400; // Bad Request
          const field = Object.keys(err.keyValue)[0];
          message = `Duplicate field value entered for '${field}'. Please use another value.`;
        }
  
        // Handle Mongoose Validation Error
        if (err.name === 'ValidationError') {
          statusCode = 400; // Bad Request
          // Combine multiple validation error messages
          message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
        }
  
        // Handle custom errors (if you throw errors with specific statuses)
        // Example: if (err.status) statusCode = err.status;
  
        // Send JSON response with error details
        res.status(statusCode).json({
          message: message,
          // Include stack trace only in development mode for security
          stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
      };
  
      module.exports = errorHandler;