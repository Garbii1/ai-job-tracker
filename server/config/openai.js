 // server/config/openai.js
 const { OpenAI } = require('openai'); // Correct import style
 require('dotenv').config();

 let openai = null;

 if (!process.env.OPENAI_API_KEY) {
   console.warn('WARNING: OpenAI API Key not found in environment variables. AI features will be disabled.');
 } else {
   try {
     openai = new OpenAI({
       apiKey: process.env.OPENAI_API_KEY,
     });
     console.log('OpenAI client initialized successfully.');
   } catch (error) {
      console.error('Error initializing OpenAI client:', error.message);
   }
 }

 module.exports = openai; // Export the initialized client (or null)