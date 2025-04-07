 // server/routes/aiRoutes.js
 const express = require('express');
 const {
     generateCoverLetter,
     analyzeApplicationFit,
     suggestFollowUp,
     getSuccessInsights // Placeholder for now
 } = require('../controllers/aiController');
 const { protect } = require('../middleware/authMiddleware'); // Protect AI routes

 const router = express.Router();

 // Apply protect middleware to all AI routes
 router.use(protect);

 // Route for generating cover letter draft
 router.post('/generate-cover-letter', generateCoverLetter);

 // Route for analyzing job description vs application data
 router.post('/analyze-application', analyzeApplicationFit);

 // Route for suggesting follow-up actions
 router.post('/suggest-follow-up', suggestFollowUp);

 // Route for getting aggregated insights (more complex, TBD)
 router.get('/success-insights', getSuccessInsights);

 module.exports = router;