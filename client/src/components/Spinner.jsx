 // client/src/components/Spinner.jsx
 import React from 'react';
 import './Spinner.css'; // Create this CSS file

 const Spinner = () => (
   <div className="spinner-overlay">
     <div className="spinner-container"></div>
     <p>Loading...</p>
   </div>
 );

 export default Spinner;