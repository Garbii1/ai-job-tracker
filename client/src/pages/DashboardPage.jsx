// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getApplications, deleteApplication } from '../services/apiService';
import Spinner from '../components/Spinner';
import ApplicationCard from '../components/ApplicationCard';
import { FaPlusCircle, FaExclamationTriangle, FaCheckCircle, FaChartBar } from 'react-icons/fa';

function DashboardPage({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getApplications();
      setApplications(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch applications.');
      console.error("Fetch applications error:", err.response || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
      if (successMessage) {
          const timer = setTimeout(() => setSuccessMessage(''), 3000);
          return () => clearTimeout(timer);
      }
  }, [successMessage]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      setError(''); // Clear previous errors before trying
      try {
        await deleteApplication(id);
        setSuccessMessage('Application deleted successfully.');
        setApplications(prev => prev.filter(app => app._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete application.');
        console.error("Delete application error:", err.response || err);
      }
    }
  };

  const stats = useMemo(() => {
    const statusCounts = { Wishlist: 0, Applied: 0, Screening: 0, Interviewing: 0, 'Offer Received': 0, Rejected: 0, Withdrawn: 0 };
    let upcomingReminders = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    applications.forEach(app => {
      if (statusCounts[app.status] !== undefined) statusCounts[app.status]++;
      const checkUpcoming = (dateString) => {
          if (!dateString) return false;
          const eventDate = new Date(dateString); eventDate.setUTCHours(0, 0, 0, 0);
          const diffTime = eventDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
      };
      if (checkUpcoming(app.followUpDate) || checkUpcoming(app.interviewDate)) upcomingReminders++;
    });
    return { total: applications.length, statusCounts, upcomingReminders };
  }, [applications]);

  if (loading && applications.length === 0) return <Spinner />;

  return (
    // Container class is applied in App.jsx for this route
    <div>
      <h2>Welcome to your Dashboard, {user?.name}!</h2>

      {successMessage && <p className="alert alert-success"><FaCheckCircle /> {successMessage}</p>}
      {error && <p className="alert alert-danger"><FaExclamationTriangle /> {error}</p>}
      {loading && <p><i>Loading applications...</i></p>}

      {/* Stats Overview Card */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #e9f5ff, #e7fff5)' }}>
        <h3><FaChartBar /> Application Stats</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center' }}> {/* Allow wrapping */}
          <p style={{margin: 0}}><strong>Total:</strong> {stats.total}</p>
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            count > 0 && <span key={status} style={{ marginRight: '10px', fontSize: '0.9em' }}>{status}: <strong>{count}</strong></span>
          ))}
           {stats.upcomingReminders > 0 &&
             <span style={{ color: 'var(--warning-color)', fontWeight: 'bold', fontSize: '0.9em' }}> | Upcoming: {stats.upcomingReminders}</span>
           }
        </div>
      </div>

      {/* Applications List Section */}
      <h3>My Applications</h3>
      {!loading && applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>You haven't added any applications yet.</p>
          <Link to="/add-application" className="button primary-action">
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