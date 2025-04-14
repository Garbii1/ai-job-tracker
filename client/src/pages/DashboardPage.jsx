// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import { getApplications, deleteApplication } from '../services/apiService'; // Adjust path
import Spinner from '../components/Spinner'; // Adjust path
import ApplicationCard from '../components/ApplicationCard'; // Adjust path
import { FaPlusCircle, FaExclamationTriangle, FaCheckCircle, FaChartBar } from 'react-icons/fa';

function DashboardPage({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation(); // Hook to get location state
  const [successMessage, setSuccessMessage] = useState(location.state?.message || ''); // Get message from navigation state

  // Function to fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await getApplications();
      setApplications(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch applications.';
      console.error("Fetch applications error:", err.response || err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
  }, []); // Empty dependency array ensures it runs only once

  // Clear success message after a delay
  useEffect(() => {
      if (successMessage) {
          const timer = setTimeout(() => {
              setSuccessMessage('');
              // Optional: Clear location state if needed, though usually not necessary
              // navigate(location.pathname, { replace: true, state: {} });
          }, 3000); // Clear after 3 seconds
          return () => clearTimeout(timer); // Cleanup timer on unmount
      }
  }, [successMessage]);


  // Handler to delete an application
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application and its data?')) {
      // Note: setLoading(true) might cause the whole page to show spinner.
      // Consider adding a loading state specific to the card being deleted for better UX.
      // setLoading(true); // Optionally indicate activity
      setError(''); // Clear previous errors
      try {
        await deleteApplication(id);
        setSuccessMessage('Application deleted successfully.'); // Set success message
        // Remove the application from the local state for immediate UI update
        setApplications(prev => prev.filter(app => app._id !== id));
        // Or optionally refetch: await fetchApplications();
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to delete application.';
        console.error("Delete application error:", err.response || err);
        setError(errorMsg); // Show delete error
        // setLoading(false); // Stop loading indicator on error
      }
    }
  };

  // Calculate stats using useMemo to avoid recalculating on every render
  const stats = useMemo(() => {
    const statusCounts = {
      Wishlist: 0, Applied: 0, Screening: 0, Interviewing: 0,
      'Offer Received': 0, Rejected: 0, Withdrawn: 0
    };
    let upcomingReminders = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    applications.forEach(app => {
      // Count statuses
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
      // Check for upcoming dates (within 7 days)
      const checkUpcoming = (dateString) => {
          if (!dateString) return false;
          const eventDate = new Date(dateString);
          eventDate.setUTCHours(0, 0, 0, 0); // Compare consistently
          const diffTime = eventDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
      };
      if (checkUpcoming(app.followUpDate) || checkUpcoming(app.interviewDate)) {
          upcomingReminders++;
      }
    });

    return {
      total: applications.length,
      statusCounts,
      upcomingReminders
    };
  }, [applications]); // Recalculate only when applications array changes

  // Display loading spinner only on initial load when applications are empty
  if (loading && applications.length === 0) return <Spinner />;

  return (
    // Container class applied in App.jsx
    <div>
      <h2>Welcome to your Dashboard, {user?.name}!</h2>

      {/* Display Success/Error Messages */}
      {successMessage && <p className="alert alert-success"><FaCheckCircle /> {successMessage}</p>}
      {error && <p className="alert alert-danger"><FaExclamationTriangle /> {error}</p>}
      {loading && <p><i>Refreshing data...</i></p>} {/* Show text indicator during refresh */}

      {/* Stats Overview Card */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #e9f5ff, #e7fff5)' }}>
        <h3><FaChartBar /> Application Stats</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <p><strong>Total:</strong> {stats.total}</p>
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            count > 0 && <span key={status} style={{ marginRight: '10px', fontSize: '0.9em' }}>{status}: <strong>{count}</strong></span>
          ))}
           {stats.upcomingReminders > 0 &&
             <span style={{ color: 'var(--warning-color)', fontWeight: 'bold', fontSize: '0.9em' }}> | Upcoming Reminders: {stats.upcomingReminders}</span>
           }
        </div>
      </div>

      {/* Applications List Section */}
      <h3>My Applications</h3>
      {applications.length === 0 && !loading ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>You haven't added any applications yet.</p>
          <Link to="/add-application" className="button primary-action"> {/* Use button classes */}
             <FaPlusCircle /> Add Your First Application
          </Link>
        </div>
      ) : (
        // Add dashboard-cards class for responsive grid layout
        <div className="dashboard-cards">
          {applications.map(app => (
            <ApplicationCard key={app._id} application={app} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;