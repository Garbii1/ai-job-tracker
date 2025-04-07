// client/src/pages/ApplicationFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createApplication, getApplicationById, updateApplication, uploadFiles } from '../services/apiService'; // Ensure correct path to apiService
import Spinner from '../components/Spinner'; // Ensure Spinner component exists
import { FaSave, FaPlusCircle, FaTimesCircle, FaUpload } from 'react-icons/fa';

const STATUS_OPTIONS = [ // Make sure these match your backend model enum
  'Wishlist', 'Applied', 'Screening', 'Interviewing', 'Offer Received', 'Rejected', 'Withdrawn'
];

function ApplicationFormPage() {
  // State for form fields
  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    status: 'Applied', // Default status
    applicationDate: '', // Will default to today if adding new
    notes: '',
    jobDescription: '',
    followUpDate: '',
    interviewDate: '',
    applicationLink: '',
    applicationMethod: '',
    requiredExperience: '',
    keywords: '', // Stored as comma-separated string in form, converted on submit
  });

  // State for file inputs
  const [resumeFile, setResumeFile] = useState(null); // For NEW resume upload
  const [coverLetterFile, setCoverLetterFile] = useState(null); // For NEW CL upload
  const [existingFiles, setExistingFiles] = useState({ resume: null, coverLetter: null }); // To display current filenames

  // State for loading and feedback
  const [loading, setLoading] = useState(false); // For saving/uploading
  const [fetchLoading, setFetchLoading] = useState(false); // For fetching existing data
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // React Router hooks
  const { id } = useParams(); // Get application ID from URL if editing
  const navigate = useNavigate();
  const isEditing = Boolean(id); // True if an ID exists in the URL

  // Helper to format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
          // Ensures the date is interpreted correctly regardless of timezone issues during parsing
          const date = new Date(dateString);
          // Adjust for timezone offset to get the correct local date in YYYY-MM-DD
          date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
          return date.toISOString().split('T')[0];
      } catch (e) {
          console.error("Error formatting date:", e);
          return '';
      }
  };

  // Fetch existing application data if in 'edit' mode
  const fetchApplicationData = useCallback(async () => {
    if (isEditing) {
      setFetchLoading(true);
      setError('');
      try {
        const response = await getApplicationById(id);
        const appData = response.data;
        // Populate form state with fetched data
        setFormData({
          companyName: appData.companyName || '',
          position: appData.position || '',
          status: appData.status || 'Applied',
          applicationDate: formatDateForInput(appData.applicationDate),
          notes: appData.notes || '',
          jobDescription: appData.jobDescription || '',
          followUpDate: formatDateForInput(appData.followUpDate),
          interviewDate: formatDateForInput(appData.interviewDate),
          applicationLink: appData.applicationLink || '',
          applicationMethod: appData.applicationMethod || '',
          requiredExperience: appData.requiredExperience || '',
          keywords: Array.isArray(appData.keywords) ? appData.keywords.join(', ') : '', // Join array for input field
        });
        // Store existing filenames to display
        setExistingFiles({
          resume: appData.resumeFilename,
          coverLetter: appData.coverLetterFilename
        });
      } catch (err) {
        setError('Failed to load application data. It might have been deleted or you lack permissions.');
        console.error("Load error:", err.response || err);
        // Optional: Redirect if load fails badly? navigate('/dashboard');
      } finally {
        setFetchLoading(false);
      }
    } else {
      // Reset form for 'add' mode - Set default applicationDate to today
      setFormData(prev => ({
        ...prev,
        companyName: '', position: '', status: 'Applied',
        applicationDate: formatDateForInput(new Date()), // Default to today
        notes: '', jobDescription: '', followUpDate: '', interviewDate: '', applicationLink: '',
        applicationMethod: '', requiredExperience: '', keywords: '',
      }));
      setExistingFiles({ resume: null, coverLetter: null });
      setResumeFile(null);
      setCoverLetterFile(null);
      setError('');
      setSuccess('');
    }
  }, [id, isEditing]); // Dependencies for useCallback

  // useEffect hook to call fetchApplicationData when component mounts or ID changes
  useEffect(() => {
    fetchApplicationData();
  }, [fetchApplicationData]);

  // Handler for changes in text/select inputs
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handler for changes in file inputs
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      if (name === 'resume') setResumeFile(files[0]);
      if (name === 'coverLetter') setCoverLetterFile(files[0]);
    } else {
      // Optional: Clear state if user deselects file (though browser behavior varies)
      if (name === 'resume') setResumeFile(null);
      if (name === 'coverLetter') setCoverLetterFile(null);
    }
  };

  // Handler for form submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true);
    setError('');
    setSuccess('');

    // Convert keywords string back to array, trim whitespace, remove empty elements
    const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(Boolean); // filter(Boolean) removes empty strings

    // Prepare data object for submission
    const dataToSubmit = {
      ...formData,
      keywords: keywordsArray,
      // Ensure empty dates are handled appropriately (send null or omit based on backend)
      // Sending empty strings might cause validation issues if backend expects Date or null
      followUpDate: formData.followUpDate || null,
      interviewDate: formData.interviewDate || null,
      applicationDate: formData.applicationDate || null,
    };

    // Optional: Remove null values if backend prefers fields to be absent
     Object.keys(dataToSubmit).forEach(key => {
       if (dataToSubmit[key] === null) {
         delete dataToSubmit[key];
       }
     });


    try {
      let savedApplication;
      // Determine if creating or updating
      if (isEditing) {
        const response = await updateApplication(id, dataToSubmit);
        savedApplication = response.data;
        setSuccess('Application updated successfully!');
      } else {
        const response = await createApplication(dataToSubmit);
        savedApplication = response.data;
        setSuccess('Application added successfully!');
      }

      // If files were selected, attempt to upload them AFTER saving text data
      // This requires the application ID from the savedApplication response
      if ((resumeFile || coverLetterFile) && savedApplication?._id) {
        await handleFileUpload(savedApplication._id); // Call separate upload function
      }

      // Navigate to the detail page after success and potential upload
      setTimeout(() => {
           navigate(`/application/${savedApplication._id}`); // Go to detail page
      }, 1500); // Delay allows user to see success message

    } catch (err) {
      // Extract more specific error messages if possible (e.g., validation errors)
      const errorMsg = err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} application. Check required fields.`;
      setError(errorMsg);
      console.error("Submit error:", err.response || err);
      setLoading(false); // IMPORTANT: Stop loading on error
    }
    // setLoading(false) is handled implicitly by navigation on success or explicitly on error
  };

  // Separate function to handle the actual file upload API call
  const handleFileUpload = async (applicationId) => {
    // Check if there are actually files to upload
     if (!resumeFile && !coverLetterFile) {
        console.log("No new files selected for upload.");
        return; // Nothing to upload
     }

     // Use FormData, necessary for sending files
     const uploadData = new FormData();
     if (resumeFile) uploadData.append('resume', resumeFile);
     if (coverLetterFile) uploadData.append('coverLetter', coverLetterFile);

     // Update UI feedback
     setError(''); // Clear previous file errors specifically
     setSuccess(prev => prev + ' Uploading files...'); // Append to existing success message
     setLoading(true); // Indicate upload activity

     try {
       const response = await uploadFiles(applicationId, uploadData); // Call API service function
       // Update the displayed existing file names from the response
       if(response.data.application){
            setExistingFiles({
               resume: response.data.application.resumeFilename,
               coverLetter: response.data.application.coverLetterFilename
            });
       }
       setSuccess(prev => prev.replace(' Uploading files...', ' Files uploaded successfully.')); // Update success message
       // Clear the file input state variables
       setResumeFile(null);
       setCoverLetterFile(null);
       // Attempt to clear the actual file input elements visually
       try {
           document.getElementById('resume').value = null;
           document.getElementById('coverLetter').value = null;
       } catch (e) { console.warn("Could not reset file input elements visually."); }

     } catch (err) {
       const errorMsg = err.response?.data?.message || 'File upload failed. Check file type/size (Max 5MB: PDF, DOC, DOCX, TXT).';
       // Append file upload error to any existing form error, or set it if none exists
       setError(prev => prev ? `${prev} ${errorMsg}` : errorMsg);
       console.error("Upload error:", err.response || err);
       // Remove the "Uploading files..." part from success message if it exists
       setSuccess(prev => prev.replace(' Uploading files...', ''));
     } finally {
        // Note: Keep setLoading(true) until navigation or if submit fails overall
        // Only set loading false here if upload is truly independent and failure shouldn't stop navigation
        // For simplicity, we let the main handleSubmit control final loading state
     }
  };

  // Display loading spinner while fetching data for editing
  if (fetchLoading) return <Spinner />;

  // Main component render
  return (
    <form onSubmit={handleSubmit}>
      {/* Form Title */}
      <h2>{isEditing ? 'Edit Application Details' : <><FaPlusCircle /> Add New Application</>}</h2>

      {/* Display Messages & Loading Spinner */}
      {error && <p className="alert alert-danger">{error}</p>}
      {success && <p className="alert alert-success">{success}</p>}
      {loading && !fetchLoading && <Spinner />} {/* Show spinner during save/upload, but not initial fetch */}

      {/* Form Layout (using grid for potential two-column layout on wider screens) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Column 1: Core Job Info */}
        <section>
          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="position">Position / Role *</label>
            <input type="text" id="position" name="position" value={formData.position} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} required>
              {STATUS_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="applicationDate">Application Date</label>
            <input type="date" id="applicationDate" name="applicationDate" value={formData.applicationDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="applicationLink">Job Posting Link</label>
            <input type="url" id="applicationLink" name="applicationLink" value={formData.applicationLink} onChange={handleChange} placeholder="https://..." />
          </div>

          <div className="form-group">
            <label htmlFor="applicationMethod">Application Method</label>
            <input type="text" id="applicationMethod" name="applicationMethod" value={formData.applicationMethod} onChange={handleChange} placeholder="e.g., LinkedIn, Referral" />
          </div>
        </section>

        {/* Column 2: Details & Dates */}
        <section>
          <div className="form-group">
            <label htmlFor="requiredExperience">Required Experience Level</label>
            <input type="text" id="requiredExperience" name="requiredExperience" value={formData.requiredExperience} onChange={handleChange} placeholder="e.g., 2+ years, Senior" />
          </div>

          <div className="form-group">
            <label htmlFor="keywords">Keywords (comma-separated)</label>
            <input type="text" id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} placeholder="e.g., JavaScript, API Design" />
          </div>

          <div className="form-group">
            <label htmlFor="followUpDate">Follow-up Date</label>
            <input type="date" id="followUpDate" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="interviewDate">Interview Date</label>
            <input type="date" id="interviewDate" name="interviewDate" value={formData.interviewDate} onChange={handleChange} />
          </div>

          {/* File Upload Section */}
          <fieldset style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius)', marginTop: '1rem' }}>
            <legend style={{ padding: '0 0.5rem' }}><FaUpload /> Documents</legend>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="resume">Upload New Resume (PDF, DOC, DOCX, TXT - Max 5MB)</label>
              <input type="file" id="resume" name="resume" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />
              {existingFiles.resume && !resumeFile && <p><small>Current: {existingFiles.resume}</small></p>}
              {resumeFile && <p><small>Selected new: {resumeFile.name}</small></p>}
            </div>
            <div className="form-group">
              <label htmlFor="coverLetter">Upload New Cover Letter (PDF, DOC, DOCX, TXT - Max 5MB)</label>
              <input type="file" id="coverLetter" name="coverLetter" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />
              {existingFiles.coverLetter && !coverLetterFile && <p><small>Current: {existingFiles.coverLetter}</small></p>}
              {coverLetterFile && <p><small>Selected new: {coverLetterFile.name}</small></p>}
            </div>
            <p><small>Note: Uploading a new file will replace the existing one for this application upon saving.</small></p>
          </fieldset>
        </section>
      </div>

      {/* Full Width Fields Below Grid */}
      <section style={{ marginTop: '1.5rem' }}>
        <div className="form-group">
          <label htmlFor="jobDescription">Job Description (Paste here for AI features)</label>
          <textarea id="jobDescription" name="jobDescription" value={formData.jobDescription} onChange={handleChange} rows="8"></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes / Details</label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="4"></textarea>
        </div>
      </section>

      {/* Action Buttons */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Link to={isEditing ? `/application/${id}` : '/dashboard'} className="button secondary">
          <FaTimesCircle /> Cancel
        </Link>
        <button type="submit" disabled={loading}>
          <FaSave /> {loading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Application' : 'Save Application')}
        </button>
      </div>
    </form>
  );
}

export default ApplicationFormPage;