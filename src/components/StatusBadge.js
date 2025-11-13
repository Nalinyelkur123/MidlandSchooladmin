import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status, variant = 'default' }) {
  const statusMap = {
    active: { label: 'Active', color: 'green' },
    inactive: { label: 'Inactive', color: 'gray' },
    pending: { label: 'Pending', color: 'yellow' },
    completed: { label: 'Completed', color: 'green' },
    cancelled: { label: 'Cancelled', color: 'red' },
    default: { label: status || 'Unknown', color: 'gray' },
  };

  const statusInfo = statusMap[status?.toLowerCase()] || statusMap.default;
  
  return (
    <span className={`status-badge status-badge-${statusInfo.color} status-badge-${variant}`}>
      {statusInfo.label}
    </span>
  );
}

