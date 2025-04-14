// client/src/pages/ApplicationDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    getApplicationById, deleteApplication, generateAICoverLetter,
    analyzeAIApplicationFit, suggestAIFollowUp
} from '../services/apiService';
import Spinner from '../components/Spinner';
import ReactMarkdown from 'react-markdown';
import he from 'he'; // For notes decoding
import {
    FaEdit, FaTrashAlt, FaArrowLeft, FaFileAlt, FaLink, FaTags, FaInfoCircle,
    FaLightbulb, FaCalendarCheck, FaPaperPlane, FaBrain, FaClock, FaBriefcase,
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from 'react-icons/fa';

// Helper function to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString); date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Adjust timezone
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return "Invalid Date"; }
};

// AI Result Display Component (assuming it's defined elsewhere or keep it here)
const AIResultDisplay = ({ title, icon, resultState, onGenerate, canGenerate = true, generationDisabledReason = "(Requires Job Description)" }) => {
    const { loading, error, content } = resultState;
    return (
        <div className="card ai-feature" style={{ background: '#f0f8ff', border: '1px dashed var(--primary-color)' }}> {/* Removed margin-top, handled by grid gap */}
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{icon} {title}</h4>
            {loading && <Spinner />}
            {error && <p className="alert alert-danger" style={{ fontSize: '0.9em' }}><FaExclamationTriangle /> {error}</p>}
            {content && (
                <div className="ai-content" style={{ background: 'white', padding: '15px', borderRadius: 'var(--border-radius)', maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', marginTop: '10px', fontSize: '0.95em', lineHeight: '1.5' }}>
                    <ReactMarkdown components={{ h1: 'h5', h2: 'h6', p: 'p', ul: 'ul', li: 'li', strong: 'strong' }}>{content}</ReactMarkdown>
                </div>
            )}
            {!loading && (
                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <button onClick={onGenerate} disabled={loading || !canGenerate} className="button secondary" title={!canGenerate ? generationDisabledReason : (content ? `Regenerate ${title}`: `Generate ${title}`)}>
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
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();

    const [aiCoverLetter, setAiCoverLetter] = useState({ loading: false, error: null, content: null });
    const [aiAnalysis, setAiAnalysis] = useState({ loading: false, error: null, content: null });
    const [aiFollowUp, setAiFollowUp] = useState({ loading: false, error: null, content: null });

    const fetchApplication = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const response = await getApplicationById(id); setApplication(response.data);
        } catch (err) { setError(err.response?.data?.message || 'Failed to load details.'); console.error("Load detail error:", err.response || err); setApplication(null); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchApplication(); }, [fetchApplication]);

    const handleDelete = async () => {
        if (window.confirm('Delete this application permanently?')) {
            setDeleteLoading(true); setError('');
            try {
                await deleteApplication(id); navigate('/dashboard', { replace: true, state: { message: 'Application deleted.' } });
            } catch (err) { setError(err.response?.data?.message || 'Failed to delete.'); console.error("Delete error:", err.response || err); setDeleteLoading(false); }
        }
    };

    // --- AI Handlers ---
    const handleGenerateCoverLetter = async () => { if (!application?.jobDescription) return; setAiCoverLetter({ loading: true, error: null, content: null }); try { const r = await generateAICoverLetter({ jobDescription: application.jobDescription, companyName: application.companyName, position: application.position }); setAiCoverLetter({ loading: false, error: null, content: r.data.coverLetter }); } catch (err) { setAiCoverLetter({ loading: false, error: err.response?.data?.message || 'Failed.', content: null }); } };
    const handleAnalyzeApplication = async () => { if (!application?.jobDescription) return; setAiAnalysis({ loading: true, error: null, content: null }); try { const r = await analyzeAIApplicationFit({ jobDescription: application.jobDescription, requiredExperience: application.requiredExperience, keywords: application.keywords, notes: application.notes }); setAiAnalysis({ loading: false, error: null, content: r.data.analysis }); } catch (err) { setAiAnalysis({ loading: false, error: err.response?.data?.message || 'Failed.', content: null }); } };
    const handleSuggestFollowUp = async () => { setAiFollowUp({ loading: true, error: null, content: null }); try { const r = await suggestAIFollowUp({ status: application.status, applicationDate: application.applicationDate, followUpDate: application.followUpDate, interviewDate: application.interviewDate, position: application.position, companyName: application.companyName, updatedAt: application.updatedAt }); setAiFollowUp({ loading: false, error: null, content: r.data.suggestion }); } catch (err) { setAiFollowUp({ loading: false, error: err.response?.data?.message || 'Failed.', content: null }); } };

    // --- Cloudinary File Link Logic ---
    const resumeLink = application?.resumeUrl;
    const coverLetterLink = application?.coverLetterUrl;

    // --- Render Logic ---
    if (loading) return <Spinner />;
    if (error) return ( <div className="container"> <p className="alert alert-danger"><FaExclamationTriangle /> {error}</p> <Link to="/dashboard" className="button secondary"><FaArrowLeft /> Back</Link> </div> );
    if (!application) return ( <div className="container"> <p className="alert alert-warning">Not found.</p> <Link to="/dashboard" className="button secondary"><FaArrowLeft /> Back</Link> </div> );

    return (
        // Container class is applied in App.jsx
        <div>
            {/* Top Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <Link to="/dashboard" className="button secondary" title="Back to dashboard"><FaArrowLeft /> Back</Link>
                <div> <Link to={`/edit-application/${id}`} className="button" style={{ marginRight: '0.5rem' }} title="Edit"><FaEdit /> Edit</Link> <button onClick={handleDelete} className="button danger" disabled={deleteLoading} title="Delete"><FaTrashAlt /> {deleteLoading ? 'Deleting...' : 'Delete'}</button> </div>
            </div>

            {/* Main Details Card */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '0.2rem' }}>{application.position}</h2>
                <h3 style={{ fontWeight: 'normal', color: '#555', marginTop: 0, marginBottom: '1rem' }}> <FaBriefcase style={{ marginRight: '8px', verticalAlign: 'middle' }} />{application.companyName} </h3>
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

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <h4><FaFileAlt /> Documents</h4>
                    <ul style={{ listStyle: 'none', paddingLeft: '1rem' }}>
                        <li> Resume: {resumeLink ? (<a href={resumeLink} target="_blank" rel="noopener noreferrer" className="document-link"> View/Download </a>) : (<em>Not uploaded</em>)} </li>
                        <li> Cover Letter: {coverLetterLink ? (<a href={coverLetterLink} target="_blank" rel="noopener noreferrer" className="document-link"> View/Download </a>) : (<em>Not uploaded</em>)} </li>
                    </ul>
                </div>

                {application.jobDescription && ( <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}> <h4>Job Description:</h4> <pre>{application.jobDescription}</pre> </div> )}
                {application.notes && ( <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}> <h4><FaInfoCircle /> Notes:</h4> <pre>{he.decode(application.notes || '')}</pre> </div> )}
            </div>

            {/* AI Assistance Section */}
            <section style={{ marginTop: '2rem', padding: '1.5rem', background: '#e7f5ff', borderRadius: 'var(--border-radius)', border: '1px solid #bce0ff' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>✨ AI Assistance ✨</h2>
                 {/* Add ai-results-grid class for responsive layout */}
                <div className="ai-results-grid">
                    <AIResultDisplay title="Cover Letter Draft" icon={<FaPaperPlane />} resultState={aiCoverLetter} onGenerate={handleGenerateCoverLetter} canGenerate={!!application.jobDescription} generationDisabledReason="(Job Description required)" />
                    <AIResultDisplay title="Application Analysis & Tips" icon={<FaBrain />} resultState={aiAnalysis} onGenerate={handleAnalyzeApplication} canGenerate={!!application.jobDescription} generationDisabledReason="(Job Description required)" />
                    <AIResultDisplay title="Follow-up Suggestion" icon={<FaLightbulb />} resultState={aiFollowUp} onGenerate={handleSuggestFollowUp} />
                </div>
            </section>
        </div>
    );
}
export default ApplicationDetailPage;