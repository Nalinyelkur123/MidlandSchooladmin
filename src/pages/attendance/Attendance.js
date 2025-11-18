import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiChevronLeft, FiChevronRight, FiSearch, FiHash, FiX } from 'react-icons/fi';
import Modal from 'react-modal';
import { SkeletonTable } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import './Attendance.css';

export default function Attendance() {
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Mark attendance modal
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({}); // { studentCode: 'present'|'absent'|'leave' }
  
  // Filters
  const defaultAcademicYear = '2025-2026';
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);


  const hasFilters = grade || section || academicYear !== defaultAcademicYear;

  const handleClearFilters = () => {
    setGrade('');
    setSection('');
    setAcademicYear(defaultAcademicYear);
  };
  // Get current month/year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      days.push({
        date,
        day,
        isToday: normalizedDate.getTime() === today.getTime(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        isFuture: normalizedDate.getTime() > today.getTime(),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
      });
    }
    
    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfMonth, selectedDate, today]);

  // Fetch timetable entries for selected date
  const fetchTimetable = useCallback(async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const url = getApiUrl('/midland/users/timetables/active');
      const res = await fetch(url, {
        headers: getAuthHeaders(token)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load timetable: ${res.status}`);
      }
      
      const data = await res.json();
      const entries = Array.isArray(data) ? data : (data.content || []);
      
      // Filter by selected date's day of week
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const filtered = entries.filter(e => 
        e.dayOfWeek === dayOfWeek &&
        (!grade || e.gradeLevel === grade) &&
        (!section || e.section === section)
      );
      
      setTimetableEntries(filtered);
    } catch (err) {
      toast.error(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, [token, selectedDate, grade, section, toast]);

  // Fetch students for a period
  const fetchStudents = useCallback(async (period) => {
    if (!period) return;
    
    setLoading(true);
    try {
      // Get students from the period's grade and section
      // For now, we'll use a mock or need to get from another API
      // Assuming we have student data or need to fetch it
      const mockStudents = [
        { studentCode: 'STD1001', name: 'Alice Johnson', admissionNumber: 'ADM001' },
        { studentCode: 'STD1002', name: 'Bob Smith', admissionNumber: 'ADM002' },
        { studentCode: 'STD1003', name: 'Charlie Lee', admissionNumber: 'ADM003' },
      ];
      
      setStudents(mockStudents);
      
      // Initialize attendance status
      const initialStatus = {};
      mockStudents.forEach(s => {
        initialStatus[s.studentCode] = 'present';
      });
      setAttendanceStatus(initialStatus);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [toast]);


  // Mark attendance
  const handleMarkAttendance = useCallback(async () => {
    if (!selectedPeriod) return;
    
    setSubmitting(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      const payload = {
        academic_year: academicYear,
        day_of_week: dayOfWeek,
        date: dateStr,
        timetable_code: selectedPeriod.timetableCode || '',
        subject_code: selectedPeriod.subjectCode,
        gradeLevel: selectedPeriod.gradeLevel,
        section: selectedPeriod.section,
        academicYear: academicYear,
        periodNumber: selectedPeriod.periodNumber,
        attendanceDate: dateStr,
        teacherCode: selectedPeriod.teacherCode,
        results: Object.entries(attendanceStatus).map(([studentCode, status]) => ({
          student_code: studentCode,
          status: status
        }))
      };
      
      const url = getApiUrl('/midland/users/attendance/mark');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || `Failed to mark attendance: ${res.status}`);
      }
      
      toast.success('Attendance marked successfully');
      setMarkModalOpen(false);
      setSelectedPeriod(null);
      setAttendanceStatus({});
      
      // Refresh data
      fetchTimetable();
    } catch (err) {
      toast.error(err.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  }, [selectedPeriod, selectedDate, academicYear, attendanceStatus, token, toast, fetchTimetable]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  useEffect(() => {
    try { Modal.setAppElement('#root'); } catch (_) {}
  }, []);

  const handleDateClick = (day) => {
    if (day) {
      setSelectedDate(day.date);
    }
  };

  const handlePeriodClick = (period) => {
    setSelectedPeriod(period);
    fetchStudents(period);
    setMarkModalOpen(true);
  };

  const handleStatusChange = (studentCode, status) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentCode]: status
    }));
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };


  return (
    <div className="page attendance">
      <div className="page-header">
        <div className="header-main" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div>
            <h2>Attendance</h2>
            <div className="meta">
              {selectedDate && (
                <span>
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              )}
            </div>
          </div>
          <div style={{ position: 'relative', flex: '0 0 300px', maxWidth: '300px' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              placeholder="Search..."
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
      </div>

      <div className="filters">
        <div className="filter-select-wrapper">
          <FiHash className="filter-icon" />
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="filter-select">
            <option value="">All Grades</option>
            {Array.from(new Set(timetableEntries.map(e => e.gradeLevel).filter(Boolean))).map(g => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
        <div className="filter-select-wrapper">
          <FiHash className="filter-icon" />
          <select value={section} onChange={(e) => setSection(e.target.value)} className="filter-select">
            <option value="">All Sections</option>
            {Array.from(new Set(timetableEntries.map(e => e.section).filter(Boolean))).map(s => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>
        <div className="filter-select-wrapper">
          <FiCalendar className="filter-icon" />
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="filter-select">
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
        {hasFilters && (
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

      <div className="attendance-calendar-view">
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}>
                <FiChevronLeft size={18} />
              </button>
              <h3 className="calendar-month-year">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}>
                <FiChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-grid">
              <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>
              <div className="calendar-days">
                {calendarDays.map((day, idx) => {
                  const isDisabled = !day || day.isFuture;
                  const classes = ['calendar-day'];
                  if (!day) {
                    classes.push('empty');
                  } else {
                    if (day.isToday) classes.push('today');
                    if (day.isSelected) classes.push('selected');
                    if (day.isFuture) classes.push('future');
                  }
                  return (
                    <div
                      key={idx}
                      className={classes.join(' ')}
                      onClick={() => {
                        if (!isDisabled && day) {
                          handleDateClick(day);
                        }
                      }}
                      aria-disabled={isDisabled}
                      title={day && day.isFuture ? 'Upcoming dates are disabled' : undefined}
                    >
                      {day && (
                        <>
                          <span className="calendar-day-number">{day.day}</span>
                          {day.isToday && <span className="today-indicator" />}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="periods-section">
            {selectedDate ? (
              <div className="attendance-periods">
                <h3 className="periods-title">
                  <FiClock size={18} style={{ marginRight: 8 }} />
                  Class Periods - {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', width: '100%', marginTop: '4px' }}>
                    (Click a period to mark attendance)
                  </span>
                </h3>
                {loading ? (
                  <SkeletonTable rows={3} columns={4} />
                ) : timetableEntries.length === 0 ? (
                  <EmptyState type="attendance" />
                ) : (
                  <div className="periods-grid">
                    {timetableEntries.map((period, idx) => (
                      <div
                        key={idx}
                        className="period-card"
                        onClick={() => handlePeriodClick(period)}
                      >
                        <div className="period-header">
                          <span className="period-number">Period {period.periodNumber}</span>
                          <span className="period-time">
                            {period.startTime?.substring(0, 5)} - {period.endTime?.substring(0, 5)}
                          </span>
                        </div>
                        <div className="period-subject">{period.subjectName}</div>
                        <div className="period-details">
                          <span>{period.gradeLevel} - {period.section}</span>
                          <span>{period.roomNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="attendance-periods">
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                  <FiCalendar size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>Select a date to view periods</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Click on any date in the calendar to see available class periods</p>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={markModalOpen}
        onRequestClose={() => !submitting && setMarkModalOpen(false)}
        className="modal attendance-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-content">
          <h3>Mark Attendance</h3>
          {selectedPeriod && (
            <div className="modal-period-info">
              <div><strong>Subject:</strong> {selectedPeriod.subjectName}</div>
              <div><strong>Period:</strong> {selectedPeriod.periodNumber}</div>
              <div><strong>Time:</strong> {selectedPeriod.startTime?.substring(0, 5)} - {selectedPeriod.endTime?.substring(0, 5)}</div>
              <div><strong>Grade:</strong> {selectedPeriod.gradeLevel} - {selectedPeriod.section}</div>
            </div>
          )}
          
          <div className="attendance-students-list">
            {students.map((student) => (
              <div key={student.studentCode} className="attendance-student-row">
                <div className="student-info">
                  <div className="student-name">{student.name}</div>
                  <div className="student-code">{student.studentCode}</div>
                </div>
                <div className="attendance-buttons">
                  <button
                    className={`status-btn present ${attendanceStatus[student.studentCode] === 'present' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(student.studentCode, 'present')}
                  >
                    <FiCheckCircle size={18} />
                    Present
                  </button>
                  <button
                    className={`status-btn absent ${attendanceStatus[student.studentCode] === 'absent' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(student.studentCode, 'absent')}
                  >
                    <FiXCircle size={18} />
                    Absent
                  </button>
                  <button
                    className={`status-btn leave ${attendanceStatus[student.studentCode] === 'leave' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(student.studentCode, 'leave')}
                  >
                    <FiAlertCircle size={18} />
                    Leave
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setMarkModalOpen(false);
                setSelectedPeriod(null);
                setAttendanceStatus({});
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleMarkAttendance}
              disabled={submitting || students.length === 0}
            >
              {submitting ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
