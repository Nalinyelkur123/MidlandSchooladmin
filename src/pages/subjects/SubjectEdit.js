import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchAllPaginatedItems } from '../../utils/api';
import { useSearch } from '../../context/SearchContext';
import { FiArrowLeft, FiBook, FiSearch } from 'react-icons/fi';
import { SkeletonForm } from '../../components/SkeletonLoader';
import {
  validateRequired,
  validateTextLength,
} from '../../utils/validation';

export default function SubjectEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  const [form, setForm] = useState({
    subjectCode: '',
    subjectName: '',
    gradeLevel: '',
    teacherCode: '',
    curriculumType: '',
    schoolCode: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Fetch subject data
  useEffect(() => {
    let isMounted = true;
    async function fetchSubject() {
      setLoading(true);
      setError('');
      try {
        const subjectsData = await fetchAllPaginatedItems(
          '/midland/users/subjects/all',
          token,
          getApiUrl,
          getAuthHeaders
        );
        
        const decodedId = decodeURIComponent(id);
        const match = subjectsData.find(s => 
          String(s.subjectCode || '') === decodedId
        );
        
        if (isMounted) {
          if (match) {
            setForm({
              subjectCode: match.subjectCode || '',
              subjectName: match.subjectName || '',
              gradeLevel: match.gradeLevel || '',
              teacherCode: match.teacherCode || '',
              curriculumType: match.curriculumType || '',
              schoolCode: match.schoolCode || '',
            });
          } else {
            setError('Subject not found');
            toast.error('Subject not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load subject';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    if (token && id) {
      fetchSubject();
    }
    
    return () => { isMounted = false; };
  }, [id, token, toast]);

  // Fetch teachers for dropdown
  useEffect(() => {
    let isMounted = true;
    async function fetchTeachers() {
      setLoadingTeachers(true);
      try {
        const teachersData = await fetchAllPaginatedItems(
          '/midland/admin/teachers/all',
          token,
          getApiUrl,
          getAuthHeaders
        );
        
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

  // Fetch schools for dropdown
  useEffect(() => {
    let isMounted = true;
    async function fetchSchools() {
      setLoadingSchools(true);
      try {
        const schoolsData = await fetchAllPaginatedItems(
          '/midland/admin/schools/all',
          token,
          getApiUrl,
          getAuthHeaders
        );
        
        if (isMounted) {
          setSchools(schoolsData);
        }
      } catch (err) {
        if (isMounted) {
          toast.error('Failed to load schools. You can still enter school code manually.');
        }
      } finally {
        if (isMounted) setLoadingSchools(false);
      }
    }
    
    if (token) {
      fetchSchools();
    }
    
    return () => { isMounted = false; };
  }, [token, toast]);

  const handleFieldChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    const subjectCodeError = validateRequired(form.subjectCode, 'Subject Code');
    if (subjectCodeError) {
      errors.subjectCode = subjectCodeError;
      isValid = false;
    } else {
      const codeLengthError = validateTextLength(form.subjectCode, 'Subject Code', 2, 20);
      if (codeLengthError) {
        errors.subjectCode = codeLengthError;
        isValid = false;
      }
    }

    const subjectNameError = validateRequired(form.subjectName, 'Subject Name');
    if (subjectNameError) {
      errors.subjectName = subjectNameError;
      isValid = false;
    } else {
      const nameLengthError = validateTextLength(form.subjectName, 'Subject Name', 2, 100);
      if (nameLengthError) {
        errors.subjectName = nameLengthError;
        isValid = false;
      }
    }

    const gradeLevelError = validateRequired(form.gradeLevel, 'Grade Level');
    if (gradeLevelError) {
      errors.gradeLevel = gradeLevelError;
      isValid = false;
    }

    const teacherCodeError = validateRequired(form.teacherCode, 'Teacher Code');
    if (teacherCodeError) {
      errors.teacherCode = teacherCodeError;
      isValid = false;
    }

    const curriculumTypeError = validateRequired(form.curriculumType, 'Curriculum Type');
    if (curriculumTypeError) {
      errors.curriculumType = curriculumTypeError;
      isValid = false;
    }

    const schoolCodeError = validateRequired(form.schoolCode, 'School Code');
    if (schoolCodeError) {
      errors.schoolCode = schoolCodeError;
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Grade levels (1-12)
  const gradeLevels = Array.from({ length: 12 }, (_, i) => String(i + 1));

  // Curriculum types
  const curriculumTypes = ['CBSE', 'ICSE', 'IGCSE', 'IB', 'State Board', 'Other'];

  if (loading) return <div className="page"><SkeletonForm /></div>;
  if (error && !form.subjectCode) return <div className="page"><div className="alert alert-error">{error}</div></div>;

  const subjectCodeKey = form.subjectCode || id;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <h2>Edit Subject</h2>
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
        <button className="btn-secondary" onClick={() => navigate('/subjects')}>
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
              subjectCode: String(form.subjectCode || '').trim().toUpperCase(),
              subjectName: String(form.subjectName || '').trim(),
              gradeLevel: String(form.gradeLevel || '').trim(),
              teacherCode: String(form.teacherCode || '').trim(),
              curriculumType: String(form.curriculumType || '').trim(),
              schoolCode: String(form.schoolCode || '').trim(),
            };
            const url = getApiUrl(`/midland/users/subjects/update/${encodeURIComponent(subjectCodeKey)}`);
            const res = await fetch(url, {
              method: 'PUT',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              let errorMessage = `Failed to update subject (${res.status})`;
              try {
                const errorData = await res.json();
                if (errorData.message) {
                  errorMessage = errorData.message;
                  
                  const lowerMessage = errorMessage.toLowerCase();
                  
                  if (lowerMessage.includes('subject code') && lowerMessage.includes('already exists')) {
                    setFieldErrors({ subjectCode: 'Subject code already exists' });
                  } else if (lowerMessage.includes('teacher') && lowerMessage.includes('not found')) {
                    setFieldErrors({ teacherCode: 'Teacher code not found' });
                  } else if (lowerMessage.includes('school') && lowerMessage.includes('not found')) {
                    setFieldErrors({ schoolCode: 'School code not found' });
                  }
                }
              } catch (parseError) {
                // If JSON parsing fails, use default message
              }
              setError(errorMessage);
              toast.error(errorMessage);
              setSubmitting(false);
              return;
            }
            
            toast.success('Subject updated successfully!');
            navigate('/subjects', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to update subject';
            setError(errorMsg);
            toast.error(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="form-section">
          <h3>
            <FiBook />
            Subject Information
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="subjectCode">
                Subject Code <span className="required">*</span>
              </label>
              <input
                id="subjectCode"
                type="text"
                value={form.subjectCode}
                onChange={(e) => handleFieldChange('subjectCode', e.target.value.toUpperCase())}
                placeholder="e.g., MATH6"
                className={fieldErrors.subjectCode ? 'error' : ''}
                disabled={submitting}
                maxLength={20}
              />
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
                placeholder="e.g., Mathematics"
                className={fieldErrors.subjectName ? 'error' : ''}
                disabled={submitting}
                maxLength={100}
              />
              {fieldErrors.subjectName && (
                <span className="field-error">{fieldErrors.subjectName}</span>
              )}
            </div>

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
              <label htmlFor="curriculumType">
                Curriculum Type <span className="required">*</span>
              </label>
              <select
                id="curriculumType"
                value={form.curriculumType}
                onChange={(e) => handleFieldChange('curriculumType', e.target.value)}
                className={fieldErrors.curriculumType ? 'error' : ''}
                disabled={submitting}
              >
                <option value="">Select Curriculum</option>
                {curriculumTypes.map(curriculum => (
                  <option key={curriculum} value={curriculum}>{curriculum}</option>
                ))}
              </select>
              {fieldErrors.curriculumType && (
                <span className="field-error">{fieldErrors.curriculumType}</span>
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
              <label htmlFor="schoolCode">
                School Code <span className="required">*</span>
              </label>
              <select
                id="schoolCode"
                value={form.schoolCode}
                onChange={(e) => handleFieldChange('schoolCode', e.target.value)}
                className={fieldErrors.schoolCode ? 'error' : ''}
                disabled={submitting || loadingSchools}
              >
                <option value="">{loadingSchools ? 'Loading schools...' : 'Select School'}</option>
                {schools.map(school => (
                  <option key={school.schoolCode} value={school.schoolCode || ''}>
                    {school.schoolCode || ''} - {school.schoolName || ''}
                  </option>
                ))}
              </select>
              {fieldErrors.schoolCode && (
                <span className="field-error">{fieldErrors.schoolCode}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/subjects')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Subject'}
          </button>
        </div>
      </form>
    </div>
  );
}

