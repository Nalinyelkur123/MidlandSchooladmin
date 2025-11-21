import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchAllPaginatedItems } from '../../utils/api';
import { useSearch } from '../../context/SearchContext';
import { FiCalendar, FiPlus, FiSearch, FiHash, FiBook, FiX, FiClock, FiEdit2, FiTrash2, FiInfo, FiMapPin, FiUser } from 'react-icons/fi';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { debounce } from '../../utils/debounce';
import './Timetable.css';

export default function Timetable() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery, registerSearchHandler, unregisterSearchHandler } = useSearch();
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [day, setDay] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const hasFetchedRef = React.useRef(false);
  const isEmptyRef = React.useRef(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const debouncedSearchRef = useRef(null);

  const fetchTimetable = useCallback(async () => {
    if (hasFetchedRef.current && isEmptyRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    setLoading(true);
    setError('');
    try {
      const allEntries = await fetchAllPaginatedItems(
        '/midland/users/timetables/active',
        token,
        getApiUrl,
        getAuthHeaders
      );
      
      setEntries(allEntries);
      setError('');
      isEmptyRef.current = allEntries.length === 0;
    } catch (err) {
      const errorMsg = err.message || 'Failed to load timetable';
      setError(errorMsg);
      setEntries([]);
      isEmptyRef.current = true;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
      hasFetchedRef.current = false;
      isEmptyRef.current = false;
    fetchTimetable();
  }, [fetchTimetable, token]);

  // Debounced search
  useEffect(() => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value) => {
        setQuery(value);
      }, 300);
    }
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current = null;
      }
    };
  }, []);

  // Register search handler with context
  useEffect(() => {
    const handler = (value) => {
      setLocalSearchQuery(value);
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current(value);
      }
    };
    registerSearchHandler(handler);
    return () => {
      unregisterSearchHandler();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync context search with local query
  useEffect(() => {
    if (debouncedSearchRef.current && searchQuery !== localSearchQuery) {
      debouncedSearchRef.current(searchQuery);
      setLocalSearchQuery(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    try { Modal.setAppElement('#root'); } catch (_) {}
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && deleteOpen && !deleting) {
        setDeleteOpen(false);
        setDeleteError('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteOpen, deleting]);

  const grades = useMemo(() => Array.from(new Set(entries.map(e => String(e.gradeLevel || '').trim()).filter(Boolean))).sort(), [entries]);
  const sections = useMemo(() => Array.from(new Set(entries.map(e => String(e.section || '').trim()).filter(Boolean))).sort(), [entries]);
  const days = useMemo(() => Array.from(new Set(entries.map(e => String(e.dayOfWeek || '').trim()).filter(Boolean))).sort(), [entries]);
  const teacherCodes = useMemo(() => Array.from(new Set(entries.map(e => String(e.teacherCode || '').trim()).filter(Boolean))).sort(), [entries]);
  const academicYears = useMemo(() => Array.from(new Set(entries.map(e => String(e.academicYear || '').trim()).filter(Boolean))).sort().reverse(), [entries]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count++;
    if (grade) count++;
    if (section) count++;
    if (day) count++;
    if (teacherCode) count++;
    if (academicYear) count++;
    return count;
  }, [query, grade, section, day, teacherCode, academicYear]);

  const handleClearFilters = () => {
    setQuery('');
    setSearchQuery('');
    setLocalSearchQuery('');
    setGrade('');
    setSection('');
    setDay('');
    setTeacherCode('');
    setAcademicYear('');
  };

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(e => {
      const subjectName = String(e.subjectName || '').toLowerCase();
      const subjectCode = String(e.subjectCode || '').toLowerCase();
      const room = String(e.roomNumber || '').toLowerCase();
      const teacher = String(e.teacherCode || '').toLowerCase();
      const queryMatch = !q || subjectName.includes(q) || subjectCode.includes(q) || room.includes(q) || teacher.includes(q);
      const gradeMatch = !grade || String(e.gradeLevel || '') === grade;
      const sectionMatch = !section || String(e.section || '') === section;
      const dayMatch = !day || String(e.dayOfWeek || '').toLowerCase() === day.toLowerCase();
      const teacherMatch = !teacherCode || String(e.teacherCode || '') === teacherCode;
      const academicYearMatch = !academicYear || String(e.academicYear || '') === academicYear;
      return queryMatch && gradeMatch && sectionMatch && dayMatch && teacherMatch && academicYearMatch;
    });
  }, [entries, query, grade, section, day, teacherCode, academicYear]);

  // Group entries by day and period for week view
  const weekViewData = useMemo(() => {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};
    
    // Get all unique periods
    const periods = new Set();
    filteredEntries.forEach(e => {
      if (e.periodNumber) periods.add(e.periodNumber);
    });
    const sortedPeriods = Array.from(periods).sort((a, b) => a - b);
    
    // Initialize structure
    sortedPeriods.forEach(period => {
      grouped[period] = {};
      daysOrder.forEach(day => {
        grouped[period][day] = [];
      });
    });
    
    // Group entries
    filteredEntries.forEach(e => {
      const period = e.periodNumber;
      const day = e.dayOfWeek;
      if (period && day && grouped[period] && grouped[period][day]) {
        grouped[period][day].push(e);
      }
    });
    
    return { periods: sortedPeriods, data: grouped, daysOrder };
  }, [filteredEntries]);

  // Get color index for subject
  const getSubjectColor = (subjectCode) => {
    if (!subjectCode) return 1;
    const colors = [1, 2, 3, 4, 5, 6, 7];
    const hash = subjectCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get current day and time for highlighting
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const isCurrentDay = (day) => {
    return day === getCurrentDay();
  };

  const isCurrentPeriod = (period, startTime, endTime) => {
    if (!startTime || !endTime) return false;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= startTime.substring(0, 5) && currentTime <= endTime.substring(0, 5);
  };

  return (
    <div className="page timetable">
      <div className="page-header">
        <div className="header-main" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div>
          <h2>Timetable</h2>
            <div className="meta">
              {loading ? 'Loading…' : `${filteredEntries.length} period${filteredEntries.length !== 1 ? 's' : ''}`}
              {activeFilterCount > 0 && (
                <span style={{ marginLeft: '12px', color: 'var(--color-primary)' }}>
                  ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)
                </span>
              )}
            </div>
          </div>
          <div style={{ position: 'relative', flex: '0 0 300px', maxWidth: '300px' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              placeholder="Search timetable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--color-border-strong)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--color-surface)',
                color: 'var(--color-text-default)',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/timetable/create')}>
            <FiPlus size={18} style={{ marginRight: 8 }} />
            Add Entry
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-select-wrapper">
          <FiHash className="filter-icon" />
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="filter-select">
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
        <div className="filter-select-wrapper">
          <FiHash className="filter-icon" />
          <select value={section} onChange={(e) => setSection(e.target.value)} className="filter-select">
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
        <div className="filter-select-wrapper">
          <FiCalendar className="filter-icon" />
          <select value={day} onChange={(e) => setDay(e.target.value)} className="filter-select">
          <option value="">All Days</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        </div>
        <div className="filter-select-wrapper">
          <FiBook className="filter-icon" />
          <select value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} className="filter-select">
            <option value="">All Teachers</option>
            {teacherCodes.map(tc => <option key={tc} value={tc}>{tc}</option>)}
          </select>
        </div>
        <div className="filter-select-wrapper">
          <FiCalendar className="filter-icon" />
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="filter-select">
            <option value="">All Academic Years</option>
            {academicYears.map(ay => <option key={ay} value={ay}>{ay}</option>)}
          </select>
        </div>
        {activeFilterCount > 0 && (
          <button 
            className="btn-secondary" 
            onClick={handleClearFilters}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              whiteSpace: 'nowrap', 
              width: '100%', 
              minWidth: 0,
              padding: '10px 16px',
              fontSize: '14px',
              minHeight: 'auto',
              height: 'auto'
            }}
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <FiX size={16} />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={9} />
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FiCalendar size={64} />
          </div>
          <h3 className="empty-state-title">Error Loading Timetable</h3>
          <p className="empty-state-message">{error}</p>
          <button className="empty-state-action btn-secondary" onClick={() => {
            hasFetchedRef.current = false;
            isEmptyRef.current = false;
            fetchTimetable();
          }}>
            Try Again
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <EmptyState type="timetable" />
      ) : (
        <div className="timetable-week-view">
          <div className="timetable-week-header">
            <div className="timetable-week-header-cell time-header">Time</div>
            {weekViewData.daysOrder.map(day => (
              <div 
                key={day} 
                className={`timetable-week-header-cell ${isCurrentDay(day) ? 'current-day' : ''}`}
              >
                {day.substring(0, 3)}
                {isCurrentDay(day) && <span className="current-indicator" title="Today">●</span>}
              </div>
            ))}
          </div>
          <div className="timetable-week-body">
            {weekViewData.periods.map(period => {
              // Get time for this period from first entry
              const firstEntry = filteredEntries.find(e => e.periodNumber === period);
              const startTime = firstEntry?.startTime ? firstEntry.startTime.substring(0, 5) : '';
              const endTime = firstEntry?.endTime ? firstEntry.endTime.substring(0, 5) : '';
              
              return (
                <div key={period} className="timetable-week-row">
                  <div className="timetable-time-cell">
                    <div className="timetable-period-label">P{period}</div>
                    {startTime && endTime && (
                      <div className="timetable-time-label">
                        <FiClock size={10} style={{ marginRight: 2 }} />
                        {startTime} - {endTime}
                      </div>
                    )}
                  </div>
                  {weekViewData.daysOrder.map(day => {
                    const dayEntries = weekViewData.data[period]?.[day] || [];
                    const isCurrent = isCurrentDay(day) && isCurrentPeriod(period, startTime, endTime);
                    return (
                      <div 
                        key={day} 
                        className={`timetable-day-cell ${isCurrentDay(day) ? 'current-day-cell' : ''} ${isCurrent ? 'current-period' : ''}`}
                      >
                        {dayEntries.length > 0 ? (
                          dayEntries.map((entry, idx) => {
                            const colorClass = `color-${getSubjectColor(entry.subjectCode)}`;
                            const cardId = `${entry.timetableCode || idx}-${period}-${day}`;
                            return (
                              <div
                                key={entry.timetableCode || idx}
                                className={`timetable-entry-card ${colorClass} ${isCurrent ? 'current-period-card' : ''}`}
                                onMouseEnter={() => setHoveredCard(cardId)}
                                onMouseLeave={() => setHoveredCard(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Show actions menu or delete modal
                                }}
                                title={`${entry.subjectName}\n${entry.subjectCode}\nGrade: ${entry.gradeLevel} - Section: ${entry.section}\nTeacher: ${entry.teacherCode}\nRoom: ${entry.roomNumber}\nTime: ${entry.startTime?.substring(0, 5)} - ${entry.endTime?.substring(0, 5)}\nAcademic Year: ${entry.academicYear}`}
                              >
                                {isCurrent && (
                                  <div className="current-period-badge">NOW</div>
                                )}
                                <div className="timetable-entry-subject">
                                  {entry.subjectName}
                                  <span className="timetable-entry-code">{entry.subjectCode}</span>
                                </div>
                                <div className="timetable-entry-details">
                                  {entry.gradeLevel} - {entry.section}
                                </div>
                                <div className="timetable-entry-teacher">
                                  <FiUser size={10} style={{ marginRight: 4 }} />
                                  {entry.teacherCode}
                                </div>
                                <div className="timetable-entry-room">
                                  <FiMapPin size={10} style={{ marginRight: 4 }} />
                                  {entry.roomNumber}
                                </div>
                                {hoveredCard === cardId && (
                                  <div className="timetable-entry-actions">
                                    <button
                                      className="timetable-action-btn edit-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Navigate to edit if edit page exists
                                        // navigate(`/timetable/${entry.timetableCode}/edit`);
                                      }}
                                      title="Edit"
                                    >
                                      <FiEdit2 size={14} />
                                    </button>
                                    <button
                                      className="timetable-action-btn delete-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteCode(entry.timetableCode);
                                        setDeleteOpen(true);
                                      }}
                                      title="Delete"
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          isCurrent && (
                            <div className="timetable-empty-current">
                              <FiInfo size={16} />
                              <span>Free Period</span>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        isOpen={deleteOpen}
        onRequestClose={() => !deleting && setDeleteOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-content">
          <h3>Delete Timetable Entry</h3>
          <p>Are you sure you want to delete this timetable entry? This action cannot be undone.</p>
          {deleteError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{deleteError}</div>}
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteCode('');
              }}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="btn-danger"
              disabled={deleting}
              onClick={async () => {
                if (!deleteCode) return;
                setDeleting(true);
                setDeleteError('');
                try {
                  const codeKey = encodeURIComponent(deleteCode);
                  const url = getApiUrl(`/midland/users/timetables/delete/${codeKey}`);
                  const res = await fetch(url, {
                    method: 'DELETE',
                    headers: getAuthHeaders(token)
                  });
                  
                  if (!res.ok) {
                    const errorText = await res.text().catch(() => '');
                    throw new Error(errorText || `Failed to delete: ${res.status}`);
                  }
                  
                  setDeleteOpen(false);
                  setDeleteCode('');
                  toast.success('Timetable entry deleted successfully');
                  hasFetchedRef.current = false;
                  isEmptyRef.current = false;
                  fetchTimetable();
                } catch (err) {
                  const errorMsg = err.message || 'Failed to delete timetable entry';
                  setDeleteError(errorMsg);
                  toast.error(errorMsg);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
