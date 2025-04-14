 // client/src/pages/DashboardPage.jsx
 import React, { useState, useEffect } from 'react';
 import { Link } from 'react-router-dom';
 import { getApplications, deleteApplication } from '../services/apiService';
 import Spinner from '../components/Spinner';
 import ApplicationCard from '../components/ApplicationCard'; // Create this component
 import { FaPlusCircle } from 'react-icons/fa';

 function DashboardPage({ user }) {
   const [applications, setApplications] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   const fetchApplications = async () => {
     setLoading(true);
     setError('');
     try {
       const response = await getApplications();
       setApplications(response.data);
     } catch (err) {
       const errorMsg = err.response?.data?.message || 'Failed to fetch applications.';
       console.error("Fetch applications error:", err.response || err);
       setError(errorMsg);
       // Error interceptor might handle 401 redirect already
     } finally {
       setLoading(false);
     }
   };

   // Fetch applications on component mount
   useEffect(() => {
     fetchApplications();
   }, []); // Empty dependency array ensures it runs only once on mount


   // Handler to delete an application
   const handleDelete = async (id) => {
       if (window.confirm('Are you sure you want to delete this application and its data?')) {
            setLoading(true); // Indicate activity
           try {
               await deleteApplication(id);
               // Refetch applications list to update UI
               await fetchApplications();
               // Or filter locally for faster UI update:
               // setApplications(prev => prev.filter(app => app._id !== id));
           } catch (err) {
               const errorMsg = err.response?.data?.message || 'Failed to delete application.';
                console.error("Delete application error:", err.response || err);
               setError(errorMsg);
               setLoading(false);
           }
       }
   };

   // Basic Stats Calculation (can be moved to a separate component)
    const calculateStats = () => {
        const stats = { total: applications.length, statusCounts: {} };
        const statuses = ['Wishlist', 'Applied', 'Screening', 'Interviewing', 'Offer Received', 'Rejected', 'Withdrawn'];
        statuses.forEach(status => stats.statusCounts[status] = 0); // Initialize counts

        applications.forEach(app => {
            if (stats.statusCounts[app.status] !== undefined) {
                stats.statusCounts[app.status]++;
            }
        });
        return stats;
    };
   const stats = calculateStats();


   if (loading && applications.length === 0) return <Spinner />; // Show spinner only on initial load


   return (
     <div>
       <h2>Welcome to your Dashboard, {user?.name}!</h2>
       {loading && <p><i>Refreshing data...</i></p>}
       {error && <p className="alert alert-danger">{error}</p>}

        {/* Stats Overview */}
         <div className="card" style={{ marginBottom: '2rem' }}>
             <h3>Application Stats</h3>
             <p><strong>Total Applications:</strong> {stats.total}</p>
             <div>
                {Object.entries(stats.statusCounts).map(([status, count]) => (
                    count > 0 && <span key={status} style={{ marginRight: '15px' }}>{status}: <strong>{count}</strong></span>
                ))}
             </div>
             {/* TODO: Add charts or more visual stats later */}
         </div>


       <h3>My Applications</h3>
       {applications.length === 0 && !loading ? (
          <div className="card">
             <p>You haven't added any applications yet.</p>
              <Link to="/add-application" className="button"><FaPlusCircle /> Add Your First Application</Link>
         </div>
       ) : (
         <div>
           {applications.map(app => (
             <ApplicationCard key={app._id} application={app} onDelete={handleDelete} />
           ))}
         </div>
       )}
     </div>
   );
 }

 export default DashboardPage;