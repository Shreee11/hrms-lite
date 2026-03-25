import React from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <div className="error-state">
    <HiOutlineExclamationCircle />
    <h3>Error</h3>
    <p>{message}</p>
    {onRetry && (
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
);

export default ErrorState;
