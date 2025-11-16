import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';
import './DateRangeFilter.css';

export default function DateRangeFilter({ 
  label = 'Date Range',
  startDate,
  endDate,
  onChange,
  onClear,
  fieldName = 'date'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    onChange({ startDate: value, endDate: endDate || '' });
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    onChange({ startDate: startDate || '', endDate: value });
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ startDate: '', endDate: '' });
    if (onClear) onClear();
  };

  const hasValue = startDate || endDate;

  return (
    <div className="date-range-filter-wrapper" ref={wrapperRef}>
      <div 
        className={`date-range-filter ${hasValue ? 'has-value' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-label={`${label} filter`}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <FiCalendar className="filter-icon" />
        <span className="date-range-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{label}</span>
        {hasValue && (
          <button
            type="button"
            className="date-range-clear"
            onClick={handleClear}
            aria-label={`Clear ${label} filter`}
            title="Clear date range"
          >
            <FiX size={14} />
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="date-range-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="date-range-inputs">
            <div className="date-input-group">
              <label htmlFor={`${fieldName}-start`}>From</label>
              <input
                id={`${fieldName}-start`}
                type="date"
                value={startDate || ''}
                onChange={handleStartDateChange}
                max={endDate || undefined}
                aria-label="Start date"
              />
            </div>
            <div className="date-input-group">
              <label htmlFor={`${fieldName}-end`}>To</label>
              <input
                id={`${fieldName}-end`}
                type="date"
                value={endDate || ''}
                onChange={handleEndDateChange}
                min={startDate || undefined}
                aria-label="End date"
              />
            </div>
          </div>
          <div className="date-range-presets">
            <button
              type="button"
              className="date-preset-btn"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                onChange({
                  startDate: lastWeek.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                });
              }}
            >
              Last 7 days
            </button>
            <button
              type="button"
              className="date-preset-btn"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today);
                lastMonth.setMonth(today.getMonth() - 1);
                onChange({
                  startDate: lastMonth.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                });
              }}
            >
              Last 30 days
            </button>
            <button
              type="button"
              className="date-preset-btn"
              onClick={() => {
                const today = new Date();
                const thisYear = new Date(today.getFullYear(), 0, 1);
                onChange({
                  startDate: thisYear.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                });
              }}
            >
              This year
            </button>
            <button
              type="button"
              className="date-preset-btn"
              onClick={() => {
                const today = new Date();
                const lastYear = new Date(today.getFullYear() - 1, 0, 1);
                const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
                onChange({
                  startDate: lastYear.toISOString().split('T')[0],
                  endDate: lastYearEnd.toISOString().split('T')[0]
                });
              }}
            >
              Last year
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

