import React from 'react';
import { HiX } from 'react-icons/hi';

const Modal = ({ isOpen, onClose, title, children, style, className }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${className ? ' ' + className : ''}`} style={style} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}>
            <HiX size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
