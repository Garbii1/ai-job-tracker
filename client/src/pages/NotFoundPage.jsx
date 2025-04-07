 // client/src/pages/NotFoundPage.jsx
 import React from 'react';
 import { Link } from 'react-router-dom';
 import { FaExclamationTriangle } from 'react-icons/fa';

 function NotFoundPage() {
   return (
     <div style={{ textAlign: 'center', marginTop: '5rem' }}>
       <FaExclamationTriangle size="3em" color="var(--warning-color)" />
       <h2 style={{ marginTop: '1rem' }}>404 - Page Not Found</h2>
       <p>Sorry, the page you are looking for does not exist.</p>
       <Link to="/" className="button">Go Back Home</Link>
     </div>
   );
 }

 export default NotFoundPage;