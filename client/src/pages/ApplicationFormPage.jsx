// client/src/pages/ApplicationFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createApplication, getApplicationById, updateApplication, uploadFiles } from '../services/apiService';
import Spinner from '../components/Spinner';
import { FaSave, FaPlusCircle, FaTimesCircle, FaUpload, FaExclamationTriangle, FaFileAlt } from 'react-icons/fa';

const STATUS_OPTIONS = [
  'Wishlist', 'Applied', 'Screening', 'Interviewing', 'Offer Received', 'Rejected', 'Withdrawn'
];

function ApplicationFormPage() {
  const [formData, setFormData] = useState({
    companyName: '', position: '', status: 'Applied', applicationDate: '', notes: '',
    jobDescription: '', followUpDate: '', interviewDate: '', applicationLink: '',
    applicationMethod: '', requiredExperience: '', keywords: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [existingFiles, setExistingFiles] = useState({ resumeUrl: null, coverLetterUrl: null });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
          const date = new Date(dateString);
          date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
          return date.toISOString().split('T')[0];
      } catch (e) { return ''; }
  };

  const fetchApplicationData = useCallback(async () => {
    if (isEditing) {
      setFetchLoading(true); setError('');
      try {
        const response = await getApplicationById(id); const appData = response.data;
        setFormData({
          companyName: appData.companyName || '', position: appData.position || '',
          status: appData.status || 'Applied', applicationDate: formatDateForInput(appData.applicationDate),
          notes: appData.notes || '', jobDescription: appData.jobDescription || '',
          followUpDate: formatDateForInput(appData.followUpDate), interviewDate: formatDateForInput(appData.interviewDate),
          applicationLink: appData.applicationLink || '', applicationMethod: appData.applicationMethod || '',
          requiredExperience: appData.requiredExperience || '', keywords: Array.isArray(appData.keywords) ? appData.keywords.join(', ') : '',
        });
        setExistingFiles({ resumeUrl: appData.resumeUrl, coverLetterUrl: appData.coverLetterUrl });
      } catch (err) { setError('Failed to load application data.'); console.error("Load error:", err.response || err); }
      finally { setFetchLoading(false); }
    } else {
      setFormData({ // Reset form, default date to today
          companyName: '', position: '', status: 'Applied', applicationDate: formatDateForInput(new Date()),
          notes: '', jobDescription: '', followUpDate: '', interviewDate: '', applicationLink: '',
          applicationMethod: '', requiredExperience: '', keywords: '',
      });
      setExistingFiles({ resumeUrl: null, coverLetterUrl: null }); setResumeFile(null); setCoverLetterFile(null);
      setError(''); setSuccess('');
    }
  }, [id, isEditing]);

  useEffect(() => { fetchApplicationData(); }, [fetchApplicationData]);

  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) { if (name === 'resume') setResumeFile(files[0]); if (name === 'coverLetter') setCoverLetterFile(files[0]); }
    else { if (name === 'resume') setResumeFile(null); if (name === 'coverLetter') setCoverLetterFile(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);
    const dataToSubmit = { ...formData, keywords: keywordsArray, followUpDate: formData.followUpDate || null, interviewDate: formData.interviewDate || null, applicationDate: formData.applicationDate || null, };
    Object.keys(dataToSubmit).forEach(key => { if (dataToSubmit[key] === null || dataToSubmit[key] === '') delete dataToSubmit[key]; });

    let fileUploadError = null; // Track file upload errors separately

    try {
      let savedApplication;
      if (isEditing) {
        const response = await updateApplication(id, dataToSubmit); savedApplication = response.data; setSuccess('Application updated.');
      } else {
        const response = await createApplication(dataToSubmit); savedApplication = response.data; setSuccess('Application added.');
      }

      if ((resumeFile || coverLetterFile) && savedApplication?._id) {
          // Try uploading files but catch specific errors
          try {
             await handleFileUpload(savedApplication._id);
          } catch (uploadErr) {
             fileUploadError = uploadErr.message || 'File upload failed.';
             console.error("Caught upload error:", uploadErr);
             // Set main error state to include upload error
             setError(prev => prev ? `${prev} ${fileUploadError}` : fileUploadError);
          }
      }

      setLoading(false); // Stop loading after save/upload attempt

      // Navigate only if there were NO errors at all
      if (!error && !fileUploadError) {
          setTimeout(() => navigate(`/application/${savedApplication._id}`), 1000);
      }

    } catch (err) { // Catch errors from create/updateApplication
      const errorMsg = err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} application.`;
      setError(errorMsg); console.error("Submit error:", err.response || err); setLoading(false);
    }
  };

  const handleFileUpload = async (applicationId) => {
     if (!resumeFile && !coverLetterFile) return;
     const uploadData = new FormData();
     if (resumeFile) uploadData.append('resume', resumeFile);
     if (coverLetterFile) uploadData.append('coverLetter', coverLetterFile);
     setSuccess(prev => prev + ' Uploading files...');

     try { // This try/catch is specifically for the upload call
       const response = await uploadFiles(applicationId, uploadData);
        if(response.data.application){
             setExistingFiles({ resumeUrl: response.data.application.resumeUrl, coverLetterUrl: response.data.application.coverLetterUrl });
        }
       setSuccess(prev => prev.replace(' Uploading files...', ' Files uploaded.'));
       setResumeFile(null); setCoverLetterFile(null);
       try { document.getElementById('resume').value = null; document.getElementById('coverLetter').value = null; } catch (e) { console.warn("Could not reset file input."); }
     } catch (err) {
        // Rethrow the error to be caught by handleSubmit
        throw err;
     }
     // setLoading(false) is now handled in handleSubmit
  };

  if (fetchLoading) return <Spinner />;

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Edit Application Details' : <><FaPlusCircle /> Add New Application</>}</h2>
      {error && <p className="alert alert-danger"><FaExclamationTriangle /> {error}</p>}
      {success && <p className="alert alert-success">{success}</p>}
      {loading && !fetchLoading && <Spinner />}

       {/* Add form-grid-layout class for responsive columns */}
      <div className="form-grid-layout">
        <section> {/* Column 1 */}
          <div className="form-group"> <label htmlFor="companyName">Company Name *</label> <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required /> </div>
          <div className="form-group"> <label htmlFor="position">Position / Role *</label> <input type="text" id="position" name="position" value={formData.position} onChange={handleChange} required /> </div>
          <div className="form-group"> <label htmlFor="status">Status *</label> <select id="status" name="status" value={formData.status} onChange={handleChange} required> {STATUS_OPTIONS.map(option => (<option key={option} value={option}>{option}</option>))} </select> </div>
          <div className="form-group"> <label htmlFor="applicationDate">Application Date</label> <input type="date" id="applicationDate" name="applicationDate" value={formData.applicationDate} onChange={handleChange} /> </div>
          <div className="form-group"> <label htmlFor="applicationLink">Job Posting Link</label> <input type="url" id="applicationLink" name="applicationLink" value={formData.applicationLink} onChange={handleChange} placeholder="https://..." /> </div>
          <div className="form-group"> <label htmlFor="applicationMethod">Application Method</label> <input type="text" id="applicationMethod" name="applicationMethod" value={formData.applicationMethod} onChange={handleChange} placeholder="e.g., LinkedIn, Referral" /> </div>
        </section>

        <section> {/* Column 2 */}
          <div className="form-group"> <label htmlFor="requiredExperience">Required Experience Level</label> <input type="text" id="requiredExperience" name="requiredExperience" value={formData.requiredExperience} onChange={handleChange} placeholder="e.g., 2+ years, Senior" /> </div>
          <div className="form-group"> <label htmlFor="keywords">Keywords (comma-separated)</label> <input type="text" id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} placeholder="e.g., JavaScript, API Design" /> </div>
          <div className="form-group"> <label htmlFor="followUpDate">Follow-up Date</label> <input type="date" id="followUpDate" name="followUpDate" value={formData.followUpDate} onChange={handleChange} /> </div>
          <div className="form-group"> <label htmlFor="interviewDate">Interview Date</label> <input type="date" id="interviewDate" name="interviewDate" value={formData.interviewDate} onChange={handleChange} /> </div>

          <fieldset> {/* Group file inputs */}
            <legend><FaUpload /> Documents</legend>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="resume">Upload New Resume (PDF, DOC, DOCX, TXT - Max 10MB)</label>
              <input type="file" id="resume" name="resume" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />
              {existingFiles.resumeUrl && !resumeFile && <p><small>Current: <a href={existingFiles.resumeUrl} target="_blank" rel="noopener noreferrer"><FaFileAlt /> View Current</a></small></p>}
              {resumeFile && <p><small>Selected: {resumeFile.name}</small></p>}
            </div>
            <div className="form-group">
              <label htmlFor="coverLetter">Upload New Cover Letter (PDF, DOC, DOCX, TXT - Max 10MB)</label>
              <input type="file" id="coverLetter" name="coverLetter" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />
              {existingFiles.coverLetterUrl && !coverLetterFile && <p><small>Current: <a href={existingFiles.coverLetterUrl} target="_blank" rel="noopener noreferrer"><FaFileAlt /> View Current</a></small></p>}
              {coverLetterFile && <p><small>Selected: {coverLetterFile.name}</small></p>}
            </div>
            <p><small>Note: Uploading replaces existing file upon saving.</small></p>
          </fieldset>
        </section>
      </div>

      {/* Full Width Fields Below Grid */}
      <section style={{ marginTop: '1.5rem' }}>
        <div className="form-group"> <label htmlFor="jobDescription">Job Description (Paste for AI features)</label> <textarea id="jobDescription" name="jobDescription" value={formData.jobDescription} onChange={handleChange} rows="8"></textarea> </div>
        <div className="form-group"> <label htmlFor="notes">Notes / Details</label> <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="4"></textarea> </div>
      </section>

      {/* Action Buttons */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}> {/* Allow buttons to wrap */}
        <Link to={isEditing ? `/application/${id}` : '/dashboard'} className="button secondary"> <FaTimesCircle /> Cancel </Link>
        <button type="submit" disabled={loading} className="button"> <FaSave /> {loading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Application' : 'Save Application')} </button>
      </div>
    </form>
  );
}
export default ApplicationFormPage;