 // client/src/components/ApplicationCard.jsx
 import React from 'react';
 import { Link } from 'react-router-dom';
 import { FaEdit, FaTrashAlt, FaEye, FaCalendarAlt, FaBell } from 'react-icons/fa'; // Import icons

 // Helper to format dates nicely
 const formatDate = (dateString) => {
     if (!dateString) return 'N/A';
     try {
       return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
     } catch (e) {
       return 'Invalid Date';
     }
 };

 // Helper to check if a date is upcoming (within next 7 days)
 const isUpcoming = (dateString) => {
     if (!dateString) return false;
     const today = new Date();
     const eventDate = new Date(dateString);
     today.setHours(0, 0, 0, 0); // Ignore time part for comparison
     eventDate.setUTCHours(0, 0, 0, 0); // Assume date input was UTC or local, compare consistently
     const diffTime = eventDate - today;
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     return diffDays >= 0 && diffDays <= 7;
 };


 function ApplicationCard({ application, onDelete }) {
   const { _id, companyName, position, status, applicationDate, followUpDate, interviewDate } = application;

   const upcomingFollowUp = isUpcoming(followUpDate);
   const upcomingInterview = isUpcoming(interviewDate);

   return (
     <div className="card">
       <h3>{position} <span style={{ fontWeight: 'normal', color: '#555' }}>at</span> {companyName}</h3>
       <p>Status: <strong style={{ color: status === 'Offer Received' ? 'var(--success-color)' : (status === 'Rejected' ? 'var(--danger-color)' : 'inherit') }}>{status}</strong></p>
       <p><FaCalendarAlt /> Applied: {formatDate(applicationDate)}</p>

       {followUpDate && (
         <p style={upcomingFollowUp ? { color: 'var(--warning-color)', fontWeight: 'bold' } : {}}>
           <FaBell /> Follow-up Due: {formatDate(followUpDate)} {upcomingFollowUp && '(Upcoming!)'}
         </p>
       )}
       {interviewDate && (
         <p style={upcomingInterview ? { color: 'var(--success-color)', fontWeight: 'bold' } : {}}>
           <FaCalendarAlt /> Interview Date: {formatDate(interviewDate)} {upcomingInterview && '(Upcoming!)'}
         </p>
       )}

       {/* Action Buttons */}
       <div style={{ marginTop: '1rem' }}>
         <Link to={`/application/${_id}`} className="button secondary" title="View Details">
           <FaEye /> View
         </Link>
         <Link to={`/edit-application/${_id}`} className="button" title="Edit Application">
           <FaEdit /> Edit
         </Link>
         <button onClick={() => onDelete(_id)} className="button danger" title="Delete Application">
           <FaTrashAlt /> Delete
         </button>
       </div>
     </div>
   );
 }

 export default ApplicationCard;