// server/controllers/aiController.js
const openai = require('../config/openai'); // Import configured client
const asyncHandler = require('../middleware/asyncHandler');
const Application = require('../models/Application'); // May need to fetch related data

// Helper function to safely call OpenAI API
const callOpenAI = async (prompt, max_tokens = 500) => {
  // Check if OpenAI client is available
  if (!openai) {
    throw new Error('OpenAI service is not available. Check API Key configuration.');
  }

  try {
    console.log(`--- Sending Prompt to OpenAI (length: ${prompt.length}) ---`); // Log prompt length
    // console.log(prompt); // Optionally log the full prompt for debugging (careful with sensitive data)
    console.log(`--- End Prompt ---`);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Cost-effective and capable model
      messages: [{ role: "user", content: prompt }],
      max_tokens: max_tokens, // Limit response length
      temperature: 0.6, // Balance creativity and predictability
      n: 1, // Generate one response choice
      // stop: ["\n\n\n"], // Optional: stop generation at certain sequences
    });

    console.log(`--- OpenAI Response Received ---`);
    // console.log(JSON.stringify(completion, null, 2)); // Log full response for debugging
    console.log(`--- End OpenAI Response ---`);


    // Check for valid response structure
    if (completion.choices && completion.choices.length > 0 && completion.choices[0].message && completion.choices[0].message.content) {
      return completion.choices[0].message.content.trim();
    } else {
      console.error('Invalid OpenAI response structure:', completion);
      throw new Error('Received an invalid or empty response from OpenAI.');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response ? JSON.stringify(error.response.data) : error.message);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to communicate with OpenAI service.';
    // Throw a new error to be caught by asyncHandler
    throw new Error(`AI Service Error: ${errorMessage}`);
  }
};

// @desc    Generate a draft cover letter based on job details
// @route   POST /api/ai/generate-cover-letter
// @access  Private
const generateCoverLetter = asyncHandler(async (req, res) => {
  const { jobDescription, companyName, position /*, userSkills, userExperience */ } = req.body;
  const userName = req.user.name; // Get user's name for personalization

  if (!jobDescription || !companyName || !position) {
    res.status(400);
    throw new Error('Missing required fields: jobDescription, companyName, position');
  }

  // Construct a clear prompt for the AI
  const prompt = `
    You are an expert career advisor helping ${userName} draft a cover letter.
    Generate a professional, concise, and engaging draft cover letter for the position of "${position}" at "${companyName}".
    Use the following job description as the primary source:
    --- Job Description ---
    ${jobDescription}
    --- End Job Description ---

    Instructions:
    1.  Start with a standard professional salutation (e.g., "Dear Hiring Manager,").
    2.  Briefly introduce the applicant (${userName}) and the position they are applying for.
    3.  In the body paragraphs, highlight 2-3 key requirements from the job description and briefly explain how someone might align with them (use placeholders like "[Your relevant skill/experience]" for customization). Do NOT invent specific experiences for ${userName}.
    4.  Express enthusiasm for the role and the company.
    5.  Conclude with a call to action (requesting an interview) and a professional closing (e.g., "Sincerely," followed by ${userName}'s name).
    6.  Keep the tone professional and confident.
    7.  Output ONLY the cover letter text, without any introductory or concluding remarks like "Here is the draft...".
    8.  The letter should be approximately 250-350 words.
  `;

  const coverLetterText = await callOpenAI(prompt, 600); // Allow more tokens for a letter
  res.status(200).json({ coverLetter: coverLetterText });
});

// @desc    Analyze application fit and suggest improvements
// @route   POST /api/ai/analyze-application
// @access  Private
const analyzeApplicationFit = asyncHandler(async (req, res) => {
  const { jobDescription, requiredExperience, keywords, notes /*, resumeText, coverLetterText */ } = req.body;
  const userName = req.user.name;

  if (!jobDescription) {
    res.status(400);
    throw new Error('Job Description is required for analysis.');
  }

  const prompt = `
    You are an AI assistant helping ${userName} analyze their potential fit for a job and improve their application materials.
    Analyze the provided Job Description:
    --- Job Description ---
    ${jobDescription}
    --- End Job Description ---

    Additional Context Provided by ${userName}:
    - Stated Required Experience Level for the Role: ${requiredExperience || 'Not specified'}
    - Keywords ${userName} associated with this application: ${keywords && keywords.length > 0 ? keywords.join(', ') : 'None provided'}
    - ${userName}'s Notes about this application: ${notes || 'None provided'}
    // (Future: Could include user's general profile/skills here)

    Provide the analysis in a clear, actionable format:

    **1. Key Requirements & Skills:**
       - List the top 5-7 crucial skills, qualifications, or responsibilities mentioned in the job description.

    **2. Potential Alignment & Gaps:**
       - Based *only* on the job description and any context ${userName} provided (keywords, experience level), briefly identify areas where alignment seems likely.
       - Point out potential gaps or areas the applicant MUST address in their materials.

    **3. Resume/Cover Letter Tailoring Suggestions:**
       - Recommend 3-5 specific actions ${userName} should take to tailor their resume and cover letter for THIS job. Examples:
         * "Quantify achievements related to [JD requirement]."
         * "Use keywords like '[Keyword 1]', '[Keyword 2]' prominently."
         * "Highlight experience with [Specific tool/methodology mentioned]."
         * "Add a project example demonstrating [Skill from JD]."

    **4. Overall Strategy Tip:**
       - Provide one concise tip for ${userName} when applying for this type of role or based on this description (e.g., emphasize soft skills, research company values).

    Be constructive and focus on actionable advice. Do not invent applicant qualifications. Format the output using Markdown for readability.
  `;

  const analysisResult = await callOpenAI(prompt, 700);
  res.status(200).json({ analysis: analysisResult });
});

// @desc    Suggest follow-up strategy based on application status
// @route   POST /api/ai/suggest-follow-up
// @access  Private
const suggestFollowUp = asyncHandler(async (req, res) => {
    const { status, applicationDate, followUpDate, interviewDate, position, companyName } = req.body;
    const userName = req.user.name;

    if (!status || !position || !companyName) {
        res.status(400);
        throw new Error('Missing required fields: status, position, companyName');
    }

    // Format dates nicely if they exist
    const appDateStr = applicationDate ? new Date(applicationDate).toLocaleDateString() : 'N/A';
    const followUpStr = followUpDate ? new Date(followUpDate).toLocaleDateString() : 'N/A';
    const interviewStr = interviewDate ? new Date(interviewDate).toLocaleDateString() : 'N/A';

    const prompt = `
        You are advising ${userName} on following up for a job application.
        Application Details:
        - Position: ${position}
        - Company: ${companyName}
        - Current Status: ${status}
        - Application Date: ${appDateStr}
        - Planned Follow-up Date: ${followUpStr}
        - Scheduled Interview Date: ${interviewStr}

        Based on the current status and dates, provide a concise follow-up suggestion. Consider typical hiring timelines (e.g., waiting a week after applying, following up after an interview).

        Structure the suggestion:

        **1. Follow-up Action:** (e.g., "Send a brief follow-up email", "Prepare for interview", "Send thank-you note", "Wait for planned follow-up date", "No action needed / Consider moving on")

        **2. Timing:** (e.g., "Around [suggested date/timeframe]", "Within 24 hours of interview", "Wait until planned date: ${followUpStr}", "N/A")

        **3. Key Message Points (if action involves communication):**
           - Provide 2-3 bullet points for a brief message. Examples:
             * Reiterate strong interest in the ${position} role.
             * Briefly mention a key qualification or discussion point (if post-interview).
             * Inquire politely about the status or next steps in the hiring process.
             * Thank the interviewer for their time (if post-interview).

        Keep the advice practical and appropriate for the status. If status is 'Rejected' or 'Offer Received', suggest suitable closing actions. If 'Wishlist', suggest applying. If an interview is scheduled, focus on preparation. If a follow-up date is set, advise waiting unless status changes.
    `;

    const suggestionResult = await callOpenAI(prompt, 400);
    res.status(200).json({ suggestion: suggestionResult });
});


 // @desc    Get overall success insights (Placeholder - Requires complex logic)
 // @route   GET /api/ai/success-insights
 // @access  Private
 const getSuccessInsights = asyncHandler(async (req, res) => {
    // --- This endpoint requires significant development ---
    // 1. Fetch all applications for the user: `await Application.find({ user: req.user.id });`
    // 2. Aggregate data: Group by status, method, keywords vs. success (e.g., Offer/Interviewing vs. Rejected).
    // 3. Construct a complex prompt summarizing the user's aggregated data for OpenAI.
    // 4. Call `callOpenAI` with the summary prompt.
    // 5. Format and return the insights.

    // For now, return a placeholder message indicating it's not yet implemented.
    res.status(200).json({
        insights: "Insight generation based on your overall application history is a planned feature. Keep tracking your applications to enable future analysis!"
    });
 });

module.exports = {
    generateCoverLetter,
    analyzeApplicationFit,
    suggestFollowUp,
    getSuccessInsights
};