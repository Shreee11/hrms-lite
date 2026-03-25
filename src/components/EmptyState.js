import React from 'react';
import { HiOutlineInbox } from 'react-icons/hi';

const EmptyState = ({ title = 'No data found', message = '' }) => (
  <div className="empty-state">
    <HiOutlineInbox />
    <h3>{title}</h3>
    {message && <p>{message}</p>}
  </div>
);

export default EmptyState;
