import React from 'react';

const Loading = ({ message = 'Loading...' }) => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);

export default Loading;
