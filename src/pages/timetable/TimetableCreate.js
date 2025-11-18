import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { FiArrowLeft, FiCalendar, FiSearch } from 'react-icons/fi';
import {
  validateRequired,
} from '../../utils/validation';

export default function TimetableCreate() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  const [form, setForm] = useState({
    gradeLevel: '',
    section: '',
    dayOfWeek: '',
    periodNumber: '',
    startTime: '',
    endTime: '',
    subjectCode: '',
    subjectName: '',
    teacherCode: '',
    roomNumber: '',
    academicYear: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Fetch subjects for dropdown
  useEffect(() => {
    let isMounted = true;
    async function fetchSubjects() {
      setLoadingSubjects(true);
      try {
        const url = getApiUrl('/midland/users/subjects/all');
        const res = await fetch(url, { 
          headers: getAuthHeaders(token)
        });
        
        if (!res.ok) {
          throw new Error('Failed to load subjects');
        }
        
        const data = await res.json();
        // Handle paginated response (content array) or direct array
        let subjectsData = [];
        if (data && Array.isArray(data)) {
          subjectsData = data;
        } else if (data && Array.isArray(data.content)) {
          subjectsData = data.content;
        }
        
        if (isMounted) {
          setSubjects(subjectsData);
        }
      } catch (err) {
        if (isMounted) {
          toast.error('Failed to load subjects. You can still enter subject code manually.');
        }
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    }
    
    if (token) {
      fetchSubjects();
    }
    
    return () => { isMounted = false; };
  }, [token, toast]);

  // Fetch teachers for dropdown
  useEffect(() => {
    let isMounted = true;
    async function fetchTeachers() {
      setLoadingTeachers(true);
      try {
        const url = getApiUrl('/midland/admin/teachers/all');
        const res = await fetch(url, { 
          headers: getAuthHeaders(token)
        });
        
        if (!res.ok) {
          throw new Error('Failed to load teachers');
        }
        
        const data = await res.json();
        const teachersData = Array.isArray(data) ? data : [];
        
        if (isMounted) {
          setTeachers(teachersData);
        }
      } catch (err) {
        if (isMounted) {
          toast.error('Failed to load teachers. You can still enter teacher code manually.');
        }
      } finally {
        if (isMounted) setLoadingTeachers(false);
      }
    }
    
    if (token) {
      fetchTeachers();
    }
    
    return () => { isMounted = false; };
  }, [token, toast]);

  const handleFieldChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
    
    // Auto-populate subjectName when subjectCode is selected
    if (field === 'subjectCode') {
      const selectedSubject = subjects.find(s => s.subjectCode === value);
      if (selectedSubject) {
        setForm(prev => ({ ...prev, subjectName: selectedSubject.subjectName || '' }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    const gradeLevelError = validateRequired(form.gradeLevel, 'Grade Level');
    if (gradeLevelError) {
      errors.gradeLevel = gradeLevelError;
      isValid = false;
    }

    const sectionError = validateRequired(form.section, 'Section');
    if (sectionError) {
      errors.section = sectionError;
      isValid = false;
    }

    const dayOfWeekError = validateRequired(form.dayOfWeek, 'Day of Week');
    if (dayOfWeekError) {
      errors.dayOfWeek = dayOfWeekError;
      isValid = false;
    }

    const periodNumberError = validateRequired(form.periodNumber, 'Period Number');
    if (periodNumberError) {
      errors.periodNumber = periodNumberError;
      isValid = false;
    } else {
      const periodNum = parseInt(form.periodNumber, 10);
      if (isNaN(periodNum) || periodNum < 1 || periodNum > 20) {
        errors.periodNumber = 'Period number must be between 1 and 20';
        isValid = false;
      }
    }

    const startTimeError = validateRequired(form.startTime, 'Start Time');
    if (startTimeError) {
      errors.startTime = startTimeError;
      isValid = false;
    }

    const endTimeError = validateRequired(form.endTime, 'End Time');
    if (endTimeError) {
      errors.endTime = endTimeError;
      isValid = false;
    } else if (form.startTime && form.endTime) {
      // Validate that end time is after start time
      const [startHour, startMin] = form.startTime.split(':').map(Number);
      const [endHour, endMin] = form.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (endMinutes <= startMinutes) {
        errors.endTime = 'End time must be after start time';
        isValid = false;
      }
    }

    const subjectCodeError = validateRequired(form.subjectCode, 'Subject Code');
    if (subjectCodeError) {
      errors.subjectCode = subjectCodeError;
      isValid = false;
    }

    const subjectNameError = validateRequired(form.subjectName, 'Subject Name');
    if (subjectNameError) {
      errors.subjectName = subjectNameError;
      isValid = false;
    }

    const teacherCodeError = validateRequired(form.teacherCode, 'Teacher Code');
    if (teacherCodeError) {
      errors.teacherCode = teacherCodeError;
      isValid = false;
    }

    const roomNumberError = validateRequired(form.roomNumber, 'Room Number');
    if (roomNumberError) {
      errors.roomNumber = roomNumberError;
      isValid = false;
    }

    const academicYearError = validateRequired(form.academicYear, 'Academic Year');
    if (academicYearError) {
      errors.academicYear = academicYearError;
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Grade levels (1-12)
  const gradeLevels = Array.from({ length: 12 }, (_, i) => String(i + 1));

  // Sections (A-Z)
  const sections = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  // Days of week
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  // Academic years (current and next few years)
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let i = -1; i <= 2; i++) {
    const year = currentYear + i;
    academicYears.push(`${year}-${year + 1}`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <h2>Create New Timetable Entry</h2>
          <div style={{ position: 'relative', flex: '0 0 300px', maxWidth: '300px' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
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
        <button className="btn-secondary" onClick={() => navigate('/timetable')}>
          <FiArrowLeft size={16} style={{ marginRight: 8 }} />
          Back to List
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setFieldErrors({});
          
          if (!token) {
            setError('Authentication required. Please log in again.');
            toast.error('Authentication required. Please log in again.');
            return;
          }
          
          if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
          }
          
          setSubmitting(true);
          try {
            const payload = {
              gradeLevel: String(form.gradeLevel || '').trim(),
              section: String(form.section || '').trim().toUpperCase(),
              dayOfWeek: String(form.dayOfWeek || '').trim().toUpperCase(),
              periodNumber: parseInt(form.periodNumber, 10),
              startTime: String(form.startTime || '').trim(),
              endTime: String(form.endTime || '').trim(),
              subjectCode: String(form.subjectCode || '').trim().toUpperCase(),
              subjectName: String(form.subjectName || '').trim(),
              teacherCode: String(form.teacherCode || '').trim(),
              roomNumber: String(form.roomNumber || '').trim(),
              academicYear: String(form.academicYear || '').trim(),
            };
            const url = getApiUrl('/midland/users/timetables/create');
            const res = await fetch(url, {
              method: 'POST',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              let errorMessage = `Failed to create timetable entry (${res.status})`;
              try {
                const errorData = await res.json();
                if (errorData.message) {
                  errorMessage = errorData.message;
                }
              } catch (parseError) {
                // If JSON parsing fails, use default message
              }
              setError(errorMessage);
              toast.error(errorMessage);
              setSubmitting(false);
              return;
            }
            
            await res.json();
            toast.success('Timetable entry created successfully!');
            navigate('/timetable');
          } catch (err) {
            const errorMsg = err.message || 'Failed to create timetable entry';
            setError(errorMsg);
            toast.error(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="form-section">
          <h3>
            <FiCalendar />
            Timetable Information
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="gradeLevel">
                Grade Level <span className="required">*</span>
              </label>
              <select
                id="gradeLevel"
                value={form.gradeLevel}
                onChange={(e) => handleFieldChange('gradeLevel', e.target.value)}
                className={fieldErrors.gradeLevel ? 'error' : ''}
                disabled={submitting}
              >
                <option value="">Select Grade Level</option>
                {gradeLevels.map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
              {fieldErrors.gradeLevel && (
                <span className="field-error">{fieldErrors.gradeLevel}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="section">
                Section <span className="required">*</span>
              </label>
              <select
                id="section"
                value={form.section}
                onChange={(e) => handleFieldChange('section', e.target.value)}
                className={fieldErrors.section ? 'error' : ''}
                disabled={submitting}
              >
                <option value="">Select Section</option>
                {sections.map(section => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
              {fieldErrors.section && (
                <span className="field-error">{fieldErrors.section}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="dayOfWeek">
                Day of Week <span className="required">*</span>
              </label>
              <select
                id="dayOfWeek"
                value={form.dayOfWeek}
                onChange={(e) => handleFieldChange('dayOfWeek', e.target.value)}
                className={fieldErrors.dayOfWeek ? 'error' : ''}
                disabled={submitting}
              >
                <option value="">Select Day</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              {fieldErrors.dayOfWeek && (
                <span className="field-error">{fieldErrors.dayOfWeek}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="periodNumber">
                Period Number <span className="required">*</span>
              </label>
              <input
                id="periodNumber"
                type="number"
                min="1"
                max="20"
                value={form.periodNumber}
                onChange={(e) => handleFieldChange('periodNumber', e.target.value)}
                placeholder="e.g., 1"
                className={fieldErrors.periodNumber ? 'error' : ''}
                disabled={submitting}
              />
              {fieldErrors.periodNumber && (
                <span className="field-error">{fieldErrors.periodNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="startTime">
                Start Time <span className="required">*</span>
              </label>
              <input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => handleFieldChange('startTime', e.target.value)}
                className={fieldErrors.startTime ? 'error' : ''}
                disabled={submitting}
              />
              {fieldErrors.startTime && (
                <span className="field-error">{fieldErrors.startTime}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="endTime">
                End Time <span className="required">*</span>
              </label>
              <input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => handleFieldChange('endTime', e.target.value)}
                className={fieldErrors.endTime ? 'error' : ''}
                disabled={submitting}
              />
              {fieldErrors.endTime && (
                <span className="field-error">{fieldErrors.endTime}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="subjectCode">
                Subject Code <span className="required">*</span>
              </label>
              <select
                id="subjectCode"
                value={form.subjectCode}
                onChange={(e) => handleFieldChange('subjectCode', e.target.value)}
                className={fieldErrors.subjectCode ? 'error' : ''}
                disabled={submitting || loadingSubjects}
              >
                <option value="">{loadingSubjects ? 'Loading subjects...' : 'Select Subject'}</option>
                {subjects.map(subject => (
                  <option key={subject.subjectCode} value={subject.subjectCode || ''}>
                    {subject.subjectCode || ''} - {subject.subjectName || ''}
                  </option>
                ))}
              </select>
              {fieldErrors.subjectCode && (
                <span className="field-error">{fieldErrors.subjectCode}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="subjectName">
                Subject Name <span className="required">*</span>
              </label>
              <input
                id="subjectName"
                type="text"
                value={form.subjectName}
                onChange={(e) => handleFieldChange('subjectName', e.target.value)}
                placeholder="e.g., English"
                className={fieldErrors.subjectName ? 'error' : ''}
                disabled={submitting}
                maxLength={100}
              />
              {fieldErrors.subjectName && (
                <span className="field-error">{fieldErrors.subjectName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="teacherCode">
                Teacher Code <span className="required">*</span>
              </label>
              <select
                id="teacherCode"
                value={form.teacherCode}
                onChange={(e) => handleFieldChange('teacherCode', e.target.value)}
                className={fieldErrors.teacherCode ? 'error' : ''}
                disabled={submitting || loadingTeachers}
              >
                <option value="">{loadingTeachers ? 'Loading teachers...' : 'Select Teacher'}</option>
                {teachers.map(teacher => (
                  <option key={teacher.teacherCode || teacher.schoolEmail} value={teacher.teacherCode || ''}>
                    {teacher.teacherCode || ''} - {teacher.fullName || ''}
                  </option>
                ))}
              </select>
              {fieldErrors.teacherCode && (
                <span className="field-error">{fieldErrors.teacherCode}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="roomNumber">
                Room Number <span className="required">*</span>
              </label>
              <input
                id="roomNumber"
                type="text"
                value={form.roomNumber}
                onChange={(e) => handleFieldChange('roomNumber', e.target.value)}
                placeholder="e.g., R101"
                className={fieldErrors.roomNumber ? 'error' : ''}
                disabled={submitting}
                maxLength={20}
              />
              {fieldErrors.roomNumber && (
                <span className="field-error">{fieldErrors.roomNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="academicYear">
                Academic Year <span className="required">*</span>
              </label>
              <select
                id="academicYear"
                value={form.academicYear}
                onChange={(e) => handleFieldChange('academicYear', e.target.value)}
                className={fieldErrors.academicYear ? 'error' : ''}
                disabled={submitting}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {fieldErrors.academicYear && (
                <span className="field-error">{fieldErrors.academicYear}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/timetable')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Timetable Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}

