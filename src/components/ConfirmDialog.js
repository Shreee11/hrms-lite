import React from 'react';
import { HiOutlineExclamation } from 'react-icons/hi';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action">
      <div className="modal-body">
        <div className="confirm-dialog">
          <HiOutlineExclamation />
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
