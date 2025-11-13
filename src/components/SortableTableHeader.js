import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import './SortableTableHeader.css';

export default function SortableTableHeader({ 
  children, 
  sortKey, 
  currentSort = null, 
  onSort,
  className = '' 
}) {
  const isActive = currentSort?.key === sortKey;
  const sortDirection = isActive && currentSort?.direction ? currentSort.direction : null;

  const handleClick = () => {
    if (onSort) {
      const newDirection = isActive && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(sortKey, newDirection);
    }
  };

  return (
    <th 
      className={`sortable-header ${className} ${isActive ? 'active' : ''} ${onSort ? 'clickable' : ''}`}
      onClick={onSort ? handleClick : undefined}
    >
      <div className="sortable-header-content">
        <span>{children}</span>
        {onSort && (
          <span className="sort-icon">
            {sortDirection === 'asc' ? (
              <FiArrowUp size={14} />
            ) : sortDirection === 'desc' ? (
              <FiArrowDown size={14} />
            ) : (
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.5 }}>
                <FiArrowUp size={10} />
                <FiArrowDown size={10} />
              </span>
            )}
          </span>
        )}
      </div>
    </th>
  );
}

