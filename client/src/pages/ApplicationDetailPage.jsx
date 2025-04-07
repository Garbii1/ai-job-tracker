// client/src/pages/ApplicationDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    getApplicationById,
    deleteApplication,
    generateAICoverLetter, // Assuming function names in apiService
    analyzeAIApplicationFit,
    suggestAIFollowUp
} from '../services/apiService'; // Adjust path if needed
import Spinner from '../components/Spinner'; // Ensure Spinner component exists
import ReactMarkdown from 'react-markdown'; // For rendering AI markdown output
// You might need to install this: npm install react-markdown
import {
    FaEdit, FaTrashAlt, FaArrowLeft, FaFileAlt, FaLink, FaTags,
    FaInfoCircle, FaLightbulb, FaCalendarCheck, FaPaperPlane, FaBrain,
    FaClock, FaBriefcase, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa'; // Import necessary icons

// Helper to format dates nicely (e.g., "January 1, 2024")
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Adjust for timezone offset to display the correct local date
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Invalid Date";
    }
};

// Reusable Component to display AI Results with loading/error states
const AIResultDisplay = ({ title, icon, resultState, onGenerate, canGenerate = true, generationDisabledReason = "(Requires Job Description)" }) => {
    const { loading, error, content } = resultState;

    return (
        <div className="card ai-feature" style={{ marginTop: '1rem', background: 'var(--light-bg)', border: '1px dashed var(--primary-color)' }}>
            <h4>{icon} {title}</h4>
            {loading && <Spinner />} {/* Use a smaller, inline spinner if preferred */}
            {error && <p className="alert alert-danger" style={{ fontSize: '0.9em' }}>{error}</p>}
            {content && (
                <div className="ai-content" style={{ background: 'white', padding: '15px', borderRadius: 'var(--border-radius)', maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', marginTop: '10px', fontSize: '0.95em' }}>
                    {/* Use ReactMarkdown to render markdown content from AI */}
                    <ReactMarkdown
                        components={{ // Optional: Customize rendering if needed
                            h1: ({node, ...props}) => <h4 style={{marginTop: '0.5rem'}} {...props} />, // Render h1 as h4
                            h2: ({node, ...props}) => <h5 style={{marginTop: '0.5rem'}} {...props} />, // Render h2 as h5
                            p: ({node, ...props}) => <p style={{marginBottom: '0.5rem'}} {...props} />,
                            ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', marginBottom: '0.5rem'}} {...props} />,
                            li: ({node, ...props}) => <li style={{marginBottom: '0.2rem'}} {...props} />,
                        }}
                    >{content}</ReactMarkdown>
                </div>
            )}
            {!loading && (
                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <button
                        onClick={onGenerate}
                        disabled={loading || !canGenerate}
                        className="button secondary"
                        title={!canGenerate ? generationDisabledReason : (content ? `Regenerate ${title}`: `Generate ${title}`)}
                    >
                        {content ? 'Regenerate' : 'Generate'}
                    </button>
                    {!canGenerate && !content && <small style={{ marginLeft: '10px', color: 'gray' }}> {generationDisabledReason}</small>}
                </div>
            )}
        </div>
    );
};


// Main Detail Page Component
function ApplicationDetailPage() {
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true); // For fetching main application data
    const [deleteLoading, setDeleteLoading] = useState(false); // Separate loading for delete action
    const [error, setError] = useState('');
    const { id } = useParams(); // Get application ID from the URL
    const navigate = useNavigate();

    // State for AI features { loading, error, content }
    const [aiCoverLetter, setAiCoverLetter] = useState({ loading: false, error: null, content: null });
    const [aiAnalysis, setAiAnalysis] = useState({ loading: false, error: null, content: null });
    const [aiFollowUp, setAiFollowUp] = useState({ loading: false, error: null, content: null });

    // Fetch application details using useCallback to memoize
    const fetchApplication = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getApplicationById(id);
            setApplication(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load application details. It might not exist or you may not have permission.');
            console.error("Load detail error:", err.response || err);
            setApplication(null); // Ensure application is null on error
        } finally {
            setLoading(false);
        }
    }, [id]); // Re-run fetch if the ID parameter changes

    // useEffect to call fetchApplication on mount and when fetchApplication changes
    useEffect(() => {
        fetchApplication();
    }, [fetchApplication]);

    // Handle Application Deletion
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this application and all its associated data? This action cannot be undone.')) {
            setDeleteLoading(true); // Indicate deletion in progress
            setError(''); // Clear previous errors
            try {
                await deleteApplication(id);
                navigate('/dashboard', { state: { message: 'Application deleted successfully.' } }); // Redirect to dashboard with success message (optional)
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete application.');
                console.error("Delete error:", err.response || err);
                setDeleteLoading(false); // Stop loading indicator on error
            }
            // No need to setDeleteLoading(false) on success due to navigation
        }
    };

    // --- AI Feature Handler Functions ---

    const handleGenerateCoverLetter = async () => {
        if (!application?.jobDescription) return; // Guard clause
        setAiCoverLetter({ loading: true, error: null, content: null }); // Reset state before call
        try {
            const response = await generateAICoverLetter({ // Use the imported service function
                jobDescription: application.jobDescription,
                companyName: application.companyName,
                position: application.position,
                // Pass additional context if available/needed (e.g., from user profile)
            });
            setAiCoverLetter({ loading: false, error: null, content: response.data.coverLetter });
        } catch (err) {
            setAiCoverLetter({ loading: false, error: err.response?.data?.message || 'Failed to generate cover letter.', content: null });
            console.error("AI Cover Letter error:", err.response?.data?.message || err);
        }
    };

    const handleAnalyzeApplication = async () => {
        if (!application?.jobDescription) return;
        setAiAnalysis({ loading: true, error: null, content: null });
        try {
            const response = await analyzeAIApplicationFit({ // Use the imported service function
                jobDescription: application.jobDescription,
                requiredExperience: application.requiredExperience,
                keywords: application.keywords,
                notes: application.notes,
                // Pass resume/CL text if implemented and available
            });
            setAiAnalysis({ loading: false, error: null, content: response.data.analysis });
        } catch (err) {
            setAiAnalysis({ loading: false, error: err.response?.data?.message || 'Failed to analyze application.', content: null });
            console.error("AI Analysis error:", err.response?.data?.message || err);
        }
    };

    const handleSuggestFollowUp = async () => {
        setAiFollowUp({ loading: true, error: null, content: null });
        try {
            const response = await suggestAIFollowUp({ // Use the imported service function
                status: application.status,
                applicationDate: application.applicationDate,
                followUpDate: application.followUpDate, // Planned follow-up
                interviewDate: application.interviewDate,
                position: application.position,
                companyName: application.companyName,
                updatedAt: application.updatedAt // Can indicate last activity/update
            });
            setAiFollowUp({ loading: false, error: null, content: response.data.suggestion });
        } catch (err) {
            setAiFollowUp({ loading: false, error: err.response?.data?.message || 'Failed to suggest follow-up.', content: null });
            console.error("AI Follow-up error:", err.response?.data?.message || err);
        }
    };

    // --- Construct File Download Links ---
    // This logic needs adjustment based on your actual file serving strategy (local vs. cloud)
    // Assuming local serving via `/uploads` route on the backend for this example
    const getFileLink = (filename) => {
        if (!filename) return null;
        // Construct URL relative to the backend base URL (remove '/api' part)
        const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');
        // Ensure we don't have double slashes if backendBaseUrl is empty or '/'
        return `${backendBaseUrl}/uploads/${filename}`.replace(/([^:]\/)\/+/g, "$1");
    };
    const resumeLink = getFileLink(application?.resumeFilename);
    const coverLetterLink = getFileLink(application?.coverLetterFilename);
    // --- End File Link Construction ---

    // --- Conditional Rendering ---
    if (loading) return <Spinner />; // Show spinner during initial load

    if (error) return ( // Show error message if fetching failed
        <div className="container">
            <p className="alert alert-danger">{error}</p>
            <Link to="/dashboard" className="button secondary"><FaArrowLeft /> Back to Dashboard</Link>
        </div>
    );

    if (!application) return ( // Should be covered by error state, but good fallback
        <div className="container">
            <p className="alert alert-warning">Application data could not be loaded.</p>
            <Link to="/dashboard" className="button secondary"><FaArrowLeft /> Back to Dashboard</Link>
        </div>
    );

    // --- Main Render ---
    return (
        <div>
            {/* Header Section with Back/Edit/Delete Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <Link to="/dashboard" className="button secondary"><FaArrowLeft /> Back to Dashboard</Link>
                <div>
                    <Link to={`/edit-application/${id}`} className="button" style={{ marginRight: '0.5rem' }}><FaEdit /> Edit Application</Link>
                    <button onClick={handleDelete} className="button danger" disabled={deleteLoading}>
                        {deleteLoading ? 'Deleting...' : <><FaTrashAlt /> Delete Application</>}
                    </button>
                </div>
            </div>

            {/* Main Application Details Card */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                {/* Title and Company */}
                <h2 style={{ marginBottom: '0.2rem' }}>{application.position || 'N/A'}</h2>
                <h3 style={{ fontWeight: 'normal', color: '#555', marginTop: 0, marginBottom: '1rem' }}>
                    <FaBriefcase style={{ marginRight: '5px', verticalAlign: 'middle' }} /> {application.companyName || 'N/A'}
                </h3>

                <hr style={{ margin: '1rem 0' }} />

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <p><strong>Status:</strong> {application.status || 'N/A'}</p>
                    <p><FaClock style={{ marginRight: '5px' }} /> <strong>Applied:</strong> {formatDate(application.applicationDate)}</p>
                    {application.applicationLink && <p><FaLink style={{ marginRight: '5px' }} /> <strong>Job Link:</strong> <a href={application.applicationLink} target="_blank" rel="noopener noreferrer" title={application.applicationLink}>Link</a></p>}
                    {application.applicationMethod && <p><strong>Method:</strong> {application.applicationMethod}</p>}
                    {application.requiredExperience && <p><strong>Experience:</strong> {application.requiredExperience}</p>}
                    {application.keywords?.length > 0 && <p><FaTags style={{ marginRight: '5px' }} /> <strong>Keywords:</strong> {application.keywords.join(', ')}</p>}
                    {application.followUpDate && <p><FaCalendarCheck style={{ marginRight: '5px' }} /> <strong>Follow-up:</strong> {formatDate(application.followUpDate)}</p>}
                    {application.interviewDate && <p><FaCalendarCheck style={{ marginRight: '5px' }} /> <strong>Interview:</strong> {formatDate(application.interviewDate)}</p>}
                </div>

                {/* Documents Section */}
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <h4><FaFileAlt /> Documents</h4>
                    <p style={{ marginLeft: '1rem' }}>Resume: {resumeLink ? <a href={resumeLink} target="_blank" rel="noopener noreferrer">{application.resumeFilename}</a> : 'Not uploaded'}</p>
                    <p style={{ marginLeft: '1rem' }}>Cover Letter: {coverLetterLink ? <a href={coverLetterLink} target="_blank" rel="noopener noreferrer">{application.coverLetterFilename}</a> : 'Not uploaded'}</p>
                    <small style={{ marginLeft: '1rem', display: 'block', color: '#777' }}>Note: File links depend on backend serving configuration.</small>
                </div>

                {/* Job Description & Notes */}
                {application.jobDescription && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4>Job Description:</h4>
                        <pre className="code-block" style={{ whiteSpace: 'pre-wrap', background: '#f8f9fa', padding: '15px', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', fontSize: '0.9em' }}>
                            {application.jobDescription}
                        </pre>
                    </div>
                )}
                {application.notes && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4><FaInfoCircle /> Notes:</h4>
                        <pre className="notes-block" style={{ whiteSpace: 'pre-wrap', background: '#fff9e6', padding: '15px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.9em' }}>
                            {application.notes}
                        </pre>
                    </div>
                )}
            </div>

            {/* AI Features Section */}
            <section style={{ marginTop: '2rem', padding: '1.5rem', background: '#e9f5ff', borderRadius: 'var(--border-radius)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>✨ AI Assistance ✨</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                    {/* AI Cover Letter */}
                    <AIResultDisplay
                        title="Cover Letter Draft"
                        icon={<FaPaperPlane />}
                        resultState={aiCoverLetter}
                        onGenerate={handleGenerateCoverLetter}
                        canGenerate={!!application.jobDescription} // Enable only if JD exists
                        generationDisabledReason="(Job Description required)"
                    />

                    {/* AI Analysis */}
                    <AIResultDisplay
                        title="Application Analysis & Tips"
                        icon={<FaBrain />}
                        resultState={aiAnalysis}
                        onGenerate={handleAnalyzeApplication}
                        canGenerate={!!application.jobDescription} // Enable only if JD exists
                        generationDisabledReason="(Job Description required)"
                    />

                    {/* AI Follow Up */}
                    <AIResultDisplay
                        title="Follow-up Suggestion"
                        icon={<FaLightbulb />}
                        resultState={aiFollowUp}
                        onGenerate={handleSuggestFollowUp}
                        // Can always generate follow-up based on status/dates
                    />

                    {/* Placeholder for Future AI Success Insights */}
                    {/* <div className="card ai-feature"><h4><FaChartLine/> Success Insights</h4> <p>Overall analysis coming soon!</p> </div> */}

                </div>
            </section>
        </div>
    );
}

export default ApplicationDetailPage;