import React from 'react';
import './SkeletonLoader.css';

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-icon"></div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-line-short"></div>
        <div className="skeleton-line skeleton-line-long"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 6 }) {
  return (
    <div className="skeleton-table-container">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton-header-cell"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className="skeleton-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="skeleton-form">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-form-group">
          <div className="skeleton-label"></div>
          <div className="skeleton-input"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-profile-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-profile-info">
          <div className="skeleton-line skeleton-line-long"></div>
          <div className="skeleton-line skeleton-line-medium"></div>
        </div>
      </div>
      <div className="skeleton-profile-sections">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-section">
            <div className="skeleton-line skeleton-line-short"></div>
            <div className="skeleton-grid">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="skeleton-grid-item">
                  <div className="skeleton-line skeleton-line-short"></div>
                  <div className="skeleton-line skeleton-line-medium"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

