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
import Spinner from '../components/Spinner'; // Ensure Spinner component exists and path is correct
import ReactMarkdown from 'react-markdown'; // Renders Markdown text from AI
// Install if needed: npm install react-markdown
import {
    FaEdit, FaTrashAlt, FaArrowLeft, FaFileAlt, FaLink, FaTags,
    FaInfoCircle, FaLightbulb, FaCalendarCheck, FaPaperPlane, FaBrain,
    FaClock, FaBriefcase, FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from 'react-icons/fa'; // Import necessary icons
import he from 'he'; // Import 'he' library for HTML entity decoding (for notes field)

// Helper function to format dates consistently (e.g., "January 1, 2024")
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Adjust for timezone offset to display the intended local date
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Invalid Date";
    }
};

// Reusable Component for displaying AI feature results
const AIResultDisplay = ({ title, icon, resultState, onGenerate, canGenerate = true, generationDisabledReason = "(Requires Job Description)" }) => {
    const { loading, error, content } = resultState;

    return (
        <div className="card ai-feature" style={{ marginTop: '1rem', background: '#f0f8ff', border: '1px dashed var(--primary-color)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{icon} {title}</h4>
            {loading && <Spinner />}
            {error && <p className="alert alert-danger" style={{ fontSize: '0.9em' }}><FaExclamationTriangle /> {error}</p>}
            {content && (
                <div className="ai-content" style={{ background: 'white', padding: '15px', borderRadius: 'var(--border-radius)', maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', marginTop: '10px', fontSize: '0.95em', lineHeight: '1.5' }}>
                    <ReactMarkdown
                        components={{
                            h1: ({node, ...props}) => <h5 style={{marginTop: '0.75rem', marginBottom: '0.25rem'}} {...props} />,
                            h2: ({node, ...props}) => <h6 style={{marginTop: '0.6rem', marginBottom: '0.2rem'}} {...props} />,
                            h3: ({node, ...props}) => <strong style={{marginTop: '0.5rem', marginBottom: '0.15rem'}} {...props} />,
                            p: ({node, ...props}) => <p style={{marginBottom: '0.5rem'}} {...props} />,
                            ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', marginBottom: '0.5rem'}} {...props} />,
                            li: ({node, ...props}) => <li style={{marginBottom: '0.3rem'}} {...props} />,
                            strong: ({node, ...props}) => <strong style={{fontWeight: '600'}} {...props} />,
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
    // State variables
    const [application, setApplication] = useState(null); // Holds the fetched application data
    const [loading, setLoading] = useState(true); // Loading state for fetching the application
    const [deleteLoading, setDeleteLoading] = useState(false); // Loading state for delete operation
    const [error, setError] = useState(''); // Error message state

    // State for AI features { loading, error, content }
    const [aiCoverLetter, setAiCoverLetter] = useState({ loading: false, error: null, content: null });
    const [aiAnalysis, setAiAnalysis] = useState({ loading: false, error: null, content: null });
    const [aiFollowUp, setAiFollowUp] = useState({ loading: false, error: null, content: null });

    // React Router hooks
    const { id } = useParams(); // Get application ID from the URL parameters
    const navigate = useNavigate(); // Hook for programmatic navigation

    // Fetch application data using useCallback and useEffect
    const fetchApplication = useCallback(async () => {
        console.log(`Fetching application with ID: ${id}`);
        setLoading(true);
        setError(''); // Clear previous errors
        try {
            const response = await getApplicationById(id); // Call API service
            setApplication(response.data); // Store fetched data in state
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to load application details.';
            setError(errorMsg);
            console.error("Load detail error:", err.response || err);
            setApplication(null); // Ensure application is null on error
        } finally {
            setLoading(false); // Stop loading indicator
        }
    }, [id]); // Dependency array: re-run if ID changes

    useEffect(() => {
        fetchApplication(); // Fetch data when component mounts or ID changes
    }, [fetchApplication]); // Dependency on the memoized fetch function

    // Handler function for deleting the application
    const handleDelete = async () => {
        // Confirmation dialog
        if (window.confirm('Are you sure you want to permanently delete this application and associated files? This action cannot be undone.')) {
            setDeleteLoading(true);
            setError('');
            try {
                await deleteApplication(id); // Call API service
                // Redirect to dashboard after successful deletion
                navigate('/dashboard', { replace: true, state: { message: 'Application deleted successfully.' } });
            } catch (err) {
                const errorMsg = err.response?.data?.message || 'Failed to delete application.';
                setError(errorMsg); // Show error message
                console.error("Delete error:", err.response || err);
                setDeleteLoading(false); // Stop delete loading indicator on error
            }
            // No need to setDeleteLoading(false) on success because we navigate away
        }
    };

    // --- AI Feature Handler Functions ---
    const handleGenerateCoverLetter = async () => {
        if (!application?.jobDescription) return;
        setAiCoverLetter({ loading: true, error: null, content: null });
        try {
            const response = await generateAICoverLetter({
                jobDescription: application.jobDescription,
                companyName: application.companyName,
                position: application.position,
            });
            setAiCoverLetter({ loading: false, error: null, content: response.data.coverLetter });
        } catch (err) {
            setAiCoverLetter({ loading: false, error: err.response?.data?.message || 'Failed to generate.', content: null });
            console.error("AI Cover Letter error:", err.response?.data?.message || err);
        }
    };

    const handleAnalyzeApplication = async () => {
        if (!application?.jobDescription) return;
        setAiAnalysis({ loading: true, error: null, content: null });
        try {
            const response = await analyzeAIApplicationFit({
                jobDescription: application.jobDescription,
                requiredExperience: application.requiredExperience,
                keywords: application.keywords,
                notes: application.notes,
            });
            setAiAnalysis({ loading: false, error: null, content: response.data.analysis });
        } catch (err) {
            setAiAnalysis({ loading: false, error: err.response?.data?.message || 'Failed to analyze.', content: null });
            console.error("AI Analysis error:", err.response?.data?.message || err);
        }
    };

    const handleSuggestFollowUp = async () => {
        setAiFollowUp({ loading: true, error: null, content: null });
        try {
            const response = await suggestAIFollowUp({
                status: application.status,
                applicationDate: application.applicationDate,
                followUpDate: application.followUpDate,
                interviewDate: application.interviewDate,
                position: application.position,
                companyName: application.companyName,
                updatedAt: application.updatedAt
            });
            setAiFollowUp({ loading: false, error: null, content: response.data.suggestion });
        } catch (err) {
            setAiFollowUp({ loading: false, error: err.response?.data?.message || 'Failed to suggest follow-up.', content: null });
            console.error("AI Follow-up error:", err.response?.data?.message || err);
        }
    };

    // --- *** UPDATED Cloudinary File Link Logic *** ---
    // Directly use the URLs stored in the application data object
    const resumeLink = application?.resumeUrl;
    const coverLetterLink = application?.coverLetterUrl;
    // --- *** End Update *** ---

    // --- Conditional Rendering ---
    if (loading) {
        return <Spinner />;
    }
    if (error) {
        return (
            <div className="container">
                <p className="alert alert-danger"><FaExclamationTriangle /> {error}</p>
                <Link to="/dashboard" className="button secondary"><FaArrowLeft /> Back to Dashboard</Link>
            </div>
        );
    }
    if (!application) {
        return (
            <div className="container">
                <p className="alert alert-warning">Application data not found.</p>
                <Link to="/dashboard" className="button secondary"><FaArrowLeft /> Back to Dashboard</Link>
            </div>
        );
    }

    // --- Main Component Render Output ---
    return (
        <div>
            {/* Top Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <Link to="/dashboard" className="button secondary" title="Go back to the dashboard">
                    <FaArrowLeft /> Back to Dashboard
                </Link>
                <div>
                    <Link to={`/edit-application/${id}`} className="button" style={{ marginRight: '0.5rem' }} title="Edit this application">
                        <FaEdit /> Edit
                    </Link>
                    <button onClick={handleDelete} className="button danger" disabled={deleteLoading} title="Delete this application permanently">
                        {deleteLoading ? 'Deleting...' : <><FaTrashAlt /> Delete</>}
                    </button>
                </div>
            </div>

            {/* Main Application Details Card */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '0.2rem' }}>{application.position}</h2>
                <h3 style={{ fontWeight: 'normal', color: '#555', marginTop: 0, marginBottom: '1rem' }}>
                    <FaBriefcase style={{ marginRight: '8px', verticalAlign: 'middle' }} />{application.companyName}
                </h3>
                <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem 1.5rem' }}>
                    <p><strong>Status:</strong> <span className={`status-${application.status?.toLowerCase().replace(' ', '-')}`}>{application.status || 'N/A'}</span></p>
                    <p><FaClock style={{ marginRight: '5px' }} /> <strong>Applied:</strong> {formatDate(application.applicationDate)}</p>
                    {application.applicationLink && <p><FaLink style={{ marginRight: '5px' }} /> <strong>Job Link:</strong> <a href={application.applicationLink} target="_blank" rel="noopener noreferrer" title={application.applicationLink}>Visit Link</a></p>}
                    {application.applicationMethod && <p><strong>Method:</strong> {application.applicationMethod}</p>}
                    {application.requiredExperience && <p><strong>Experience Req:</strong> {application.requiredExperience}</p>}
                    {application.followUpDate && <p><FaCalendarCheck style={{ color: 'orange', marginRight: '5px' }} /> <strong>Follow-up Due:</strong> {formatDate(application.followUpDate)}</p>}
                    {application.interviewDate && <p><FaCalendarCheck style={{ color: 'green', marginRight: '5px' }} /> <strong>Interview Date:</strong> {formatDate(application.interviewDate)}</p>}
                    {application.keywords?.length > 0 && <p style={{ gridColumn: '1 / -1' }}><FaTags style={{ marginRight: '5px' }} /> <strong>Keywords:</strong> {application.keywords.join(', ')}</p>}
                </div>

                 {/* --- *** UPDATED Documents Section *** --- */}
                 <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <h4><FaFileAlt /> Documents</h4>
                    <ul style={{ listStyle: 'none', paddingLeft: '1rem' }}>
                        <li>
                            Resume: {resumeLink ? (
                                <a href={resumeLink} target="_blank" rel="noopener noreferrer" className="document-link">
                                    View/Download Resume
                                </a>
                            ) : (
                                <em>Not uploaded</em>
                            )}
                        </li>
                        <li>
                            Cover Letter: {coverLetterLink ? (
                                <a href={coverLetterLink} target="_blank" rel="noopener noreferrer" className="document-link">
                                    View/Download Cover Letter
                                </a>
                            ) : (
                                <em>Not uploaded</em>
                            )}
                        </li>
                    </ul>
                </div>
                 {/* --- *** End Update *** --- */}


                {/* Job Description Section */}
                {application.jobDescription && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4>Job Description:</h4>
                        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#f8f9fa', padding: '15px', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', fontSize: '0.9em', fontFamily: 'inherit' }}>
                            {application.jobDescription}
                        </pre>
                    </div>
                )}

                {/* Notes Section - With HTML entity decoding */}
                {application.notes && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4><FaInfoCircle /> Notes:</h4>
                        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#fff9e6', padding: '15px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.9em', fontFamily: 'inherit' }}>
                             {/* Decode HTML entities from notes before rendering */}
                             {he.decode(application.notes || '')}
                        </pre>
                    </div>
                )}
            </div> {/* End Main Details Card */}


            {/* AI Assistance Section */}
            <section style={{ marginTop: '2rem', padding: '1.5rem', background: '#e7f5ff', borderRadius: 'var(--border-radius)', border: '1px solid #bce0ff' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>✨ AI Assistance ✨</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                    <AIResultDisplay
                        title="Cover Letter Draft"
                        icon={<FaPaperPlane />}
                        resultState={aiCoverLetter}
                        onGenerate={handleGenerateCoverLetter}
                        canGenerate={!!application.jobDescription}
                        generationDisabledReason="(Job Description required)"
                    />

                    <AIResultDisplay
                        title="Application Analysis & Tips"
                        icon={<FaBrain />}
                        resultState={aiAnalysis}
                        onGenerate={handleAnalyzeApplication}
                        canGenerate={!!application.jobDescription}
                        generationDisabledReason="(Job Description required)"
                    />

                    <AIResultDisplay
                        title="Follow-up Suggestion"
                        icon={<FaLightbulb />}
                        resultState={aiFollowUp}
                        onGenerate={handleSuggestFollowUp}
                    />
                </div>
            </section>

        </div>
    );
}

export default ApplicationDetailPage;