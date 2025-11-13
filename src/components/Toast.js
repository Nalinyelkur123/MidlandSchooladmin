import React, { useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import './Toast.css';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
  };

  const Icon = icons[type] || icons.info;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <Icon className="toast-icon" size={20} />
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        <FiX size={18} />
      </button>
    </div>
  );
};

export default Toast;

