  // server/config/db.js
  const mongoose = require('mongoose');
  require('dotenv').config(); // Make sure env variables are loaded

  const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
      process.exit(1); // Exit process with failure
    }
  };

  module.exports = connectDB;