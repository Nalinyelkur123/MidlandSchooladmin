import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { FiSearch } from 'react-icons/fi';
import { FiArrowLeft, FiUser, FiBriefcase, FiMail } from 'react-icons/fi';
import {
  validateUsername,
  validatePassword,
  validateEmail,
  validatePhone,
  validateRequired,
  validateDate,
  validateFullName,
  validateSchoolCode,
  validateTeacherCode,
} from '../../utils/validation';

export default function TeacherCreate() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    gender: '',
    dateOfBirth: '',
    department: '',
    designation: '',
    teacherCode: '',
    experience: '',
    schoolEmail: '',
    personalEmail: '',
    phoneNumber: '',
    schoolCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { searchQuery, setSearchQuery } = useSearch();

  // Fetch schools for dropdown
  useEffect(() => {
    let isMounted = true;
    async function fetchSchools() {
      setLoadingSchools(true);
      try {
        const url = getApiUrl('/midland/admin/schools/all');
        const res = await fetch(url, { 
          headers: getAuthHeaders(token)
        });
        
        if (!res.ok) {
          throw new Error('Failed to load schools');
        }
        
        const data = await res.json();
        const schoolsData = Array.isArray(data) ? data : [];
        
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

    // Account section
    const usernameError = validateUsername(form.username);
    if (usernameError) {
      errors.username = usernameError;
      isValid = false;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      errors.password = passwordError;
      isValid = false;
    }

    // Personal Info section
    const fullNameError = validateFullName(form.fullName);
    if (fullNameError) {
      errors.fullName = fullNameError;
      isValid = false;
    }

    const genderError = validateRequired(form.gender, 'Gender');
    if (genderError) {
      errors.gender = genderError;
      isValid = false;
    }

    const dobError = validateDate(form.dateOfBirth, 'Date of birth');
    if (dobError) {
      errors.dateOfBirth = dobError;
      isValid = false;
    }

    // Professional Info section
    const departmentError = validateRequired(form.department, 'Department');
    if (departmentError) {
      errors.department = departmentError;
      isValid = false;
    }

    const designationError = validateRequired(form.designation, 'Designation');
    if (designationError) {
      errors.designation = designationError;
      isValid = false;
    }

    const teacherCodeError = validateTeacherCode(form.teacherCode);
    if (teacherCodeError) {
      errors.teacherCode = teacherCodeError;
      isValid = false;
    }

    const schoolCodeError = validateSchoolCode(form.schoolCode);
    if (schoolCodeError) {
      errors.schoolCode = schoolCodeError;
      isValid = false;
    }

    // Contact Details section
    if (form.phoneNumber) {
      const phoneError = validatePhone(form.phoneNumber);
      if (phoneError) {
        errors.phoneNumber = phoneError;
        isValid = false;
      }
    }

    const schoolEmailError = validateEmail(form.schoolEmail);
    if (schoolEmailError) {
      errors.schoolEmail = schoolEmailError;
      isValid = false;
    } else if (!form.schoolEmail || form.schoolEmail.trim() === '') {
      errors.schoolEmail = 'School email is required';
      isValid = false;
    }

    if (form.personalEmail) {
      const personalEmailError = validateEmail(form.personalEmail);
      if (personalEmailError) {
        errors.personalEmail = personalEmailError;
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <h2>Create New Teacher</h2>
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
        <button className="btn-secondary" onClick={() => navigate('/teachers')}>
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
          
          // Validate form before submission
          if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
          }
          
          setSubmitting(true);
          try {
            const payload = {
              username: String(form.username || '').trim(),
              password: String(form.password || '').trim(),
              fullName: String(form.fullName || '').trim(),
              gender: String(form.gender || '').trim(),
              dateOfBirth: String(form.dateOfBirth || '').trim(),
              department: String(form.department || '').trim(),
              designation: String(form.designation || '').trim(),
              teacherCode: String(form.teacherCode || '').trim(),
              experience: String(form.experience || '').trim(),
              schoolEmail: String(form.schoolEmail || '').trim(),
              personalEmail: String(form.personalEmail || '').trim(),
              phoneNumber: String(form.phoneNumber || '').trim(),
              schoolCode: String(form.schoolCode || '').trim(),
            };
            const url = getApiUrl('/midland/admin/teachers/create');
            const res = await fetch(url, {
              method: 'POST',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              let errorMessage = `Failed to create teacher (${res.status})`;
              try {
                const errorData = await res.json();
                // Extract message from backend error response
                if (errorData.message) {
                  errorMessage = errorData.message;
                  
                  // Check for specific error types and highlight relevant fields
                  const lowerMessage = errorMessage.toLowerCase();
                  
                  // Username conflict
                  if (lowerMessage.includes('username') && lowerMessage.includes('already exists')) {
                    setFieldErrors({ ...fieldErrors, username: errorMessage });
                  }
                  // School code foreign key constraint
                  else if (lowerMessage.includes('school_code') || lowerMessage.includes('school code') || 
                           (lowerMessage.includes('foreign key constraint') && lowerMessage.includes('school'))) {
                    const friendlyMessage = `School code "${form.schoolCode}" does not exist. Please enter a valid school code that exists in the system.`;
                    setFieldErrors({ ...fieldErrors, schoolCode: friendlyMessage });
                    errorMessage = friendlyMessage;
                  }
                } else if (errorData.error) {
                  errorMessage = errorData.error;
                  // Check error text for foreign key constraints
                  const lowerError = errorMessage.toLowerCase();
                  if (lowerError.includes('school_code') || lowerError.includes('foreign key')) {
                    const friendlyMessage = `School code "${form.schoolCode}" does not exist. Please enter a valid school code.`;
                    setFieldErrors({ ...fieldErrors, schoolCode: friendlyMessage });
                    errorMessage = friendlyMessage;
                  }
                }
              } catch {
                // If JSON parsing fails, try text
                const errorText = await res.text().catch(() => '');
                if (errorText) {
                  try {
                    const parsed = JSON.parse(errorText);
                    errorMessage = parsed.message || parsed.error || errorText;
                    // Check for school code errors in parsed text
                    const lowerText = errorMessage.toLowerCase();
                    if (lowerText.includes('school_code') || (lowerText.includes('foreign key') && lowerText.includes('school'))) {
                      const friendlyMessage = `School code "${form.schoolCode}" does not exist. Please enter a valid school code.`;
                      setFieldErrors({ ...fieldErrors, schoolCode: friendlyMessage });
                      errorMessage = friendlyMessage;
                    }
                  } catch {
                    // Check raw error text for school code issues
                    const lowerText = errorText.toLowerCase();
                    if (lowerText.includes('school_code') || (lowerText.includes('foreign key') && lowerText.includes('school'))) {
                      const friendlyMessage = `School code "${form.schoolCode}" does not exist. Please enter a valid school code.`;
                      setFieldErrors({ ...fieldErrors, schoolCode: friendlyMessage });
                      errorMessage = friendlyMessage;
                    } else {
                      errorMessage = errorText || errorMessage;
                    }
                  }
                }
              }
              throw new Error(errorMessage);
            }
            
            toast.success('Teacher created successfully');
            navigate('/teachers', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to create teacher';
            setError(errorMsg);
            toast.error(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="form-section">
          <h3>
            <FiUser />
            Account
          </h3>
          <div className="form-grid">
            <label>
              Username *
              <input 
                value={form.username} 
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value });
                  if (fieldErrors.username) {
                    setFieldErrors({ ...fieldErrors, username: '' });
                  }
                }}
                className={fieldErrors.username ? 'input-error' : ''}
                required 
              />
              {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
            </label>
            <label>
              Password *
              <input 
                type="password" 
                value={form.password} 
                onChange={(e) => handleFieldChange('password', e.target.value)} 
                className={fieldErrors.password ? 'input-error' : ''}
                required 
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiUser />
            Personal Info
          </h3>
          <div className="form-grid">
            <label>
              Full Name *
              <input 
                value={form.fullName} 
                onChange={(e) => handleFieldChange('fullName', e.target.value)} 
                className={fieldErrors.fullName ? 'input-error' : ''}
                required 
              />
              {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
            </label>
            <label>
              Gender *
              <select 
                value={form.gender} 
                onChange={(e) => handleFieldChange('gender', e.target.value)} 
                className={fieldErrors.gender ? 'input-error' : ''}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {fieldErrors.gender && <span className="field-error">{fieldErrors.gender}</span>}
            </label>
            <label>
              Date of Birth *
              <input 
                type="date" 
                value={form.dateOfBirth} 
                onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)} 
                className={fieldErrors.dateOfBirth ? 'input-error' : ''}
                required 
              />
              {fieldErrors.dateOfBirth && <span className="field-error">{fieldErrors.dateOfBirth}</span>}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiBriefcase />
            Professional Info
          </h3>
          <div className="form-grid">
            <label>
              Department *
              <input 
                value={form.department} 
                onChange={(e) => handleFieldChange('department', e.target.value)} 
                className={fieldErrors.department ? 'input-error' : ''}
                required 
              />
              {fieldErrors.department && <span className="field-error">{fieldErrors.department}</span>}
            </label>
            <label>
              Designation *
              <input 
                value={form.designation} 
                onChange={(e) => handleFieldChange('designation', e.target.value)} 
                className={fieldErrors.designation ? 'input-error' : ''}
                required 
              />
              {fieldErrors.designation && <span className="field-error">{fieldErrors.designation}</span>}
            </label>
            <label>
              Teacher Code *
              <input 
                value={form.teacherCode} 
                onChange={(e) => handleFieldChange('teacherCode', e.target.value)} 
                className={fieldErrors.teacherCode ? 'input-error' : ''}
                required 
              />
              {fieldErrors.teacherCode && <span className="field-error">{fieldErrors.teacherCode}</span>}
            </label>
            <label>
              Experience (Years)
              <input 
                type="number"
                min="0"
                value={form.experience} 
                onChange={(e) => handleFieldChange('experience', e.target.value)} 
                className={fieldErrors.experience ? 'input-error' : ''}
                placeholder="e.g., 5"
              />
              {fieldErrors.experience && <span className="field-error">{fieldErrors.experience}</span>}
            </label>
            <label>
              School Code *
              {loadingSchools ? (
                <input 
                  value={form.schoolCode} 
                  onChange={(e) => handleFieldChange('schoolCode', e.target.value)} 
                  className={fieldErrors.schoolCode ? 'input-error' : ''}
                  placeholder="Loading schools..."
                  disabled
                  required 
                />
              ) : schools.length > 0 ? (
                <select 
                  value={form.schoolCode} 
                  onChange={(e) => handleFieldChange('schoolCode', e.target.value)} 
                  className={fieldErrors.schoolCode ? 'input-error' : ''}
                  required 
                >
                  <option value="">Select School Code</option>
                  {schools.map(school => (
                    <option key={school.schoolCode || school.id} value={school.schoolCode || school.id}>
                      {school.schoolCode || school.id} {school.schoolName ? `- ${school.schoolName}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
              <input 
                value={form.schoolCode} 
                onChange={(e) => handleFieldChange('schoolCode', e.target.value)} 
                className={fieldErrors.schoolCode ? 'input-error' : ''}
                  placeholder="Enter school code"
                required 
              />
              )}
              {fieldErrors.schoolCode && <span className="field-error">{fieldErrors.schoolCode}</span>}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiMail />
            Contact Details
          </h3>
          <div className="form-grid">
            <label>
              Phone Number
              <input 
                value={form.phoneNumber} 
                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)} 
                className={fieldErrors.phoneNumber ? 'input-error' : ''}
              />
              {fieldErrors.phoneNumber && <span className="field-error">{fieldErrors.phoneNumber}</span>}
            </label>
            <label>
              School Email *
              <input 
                type="email" 
                value={form.schoolEmail} 
                onChange={(e) => handleFieldChange('schoolEmail', e.target.value)} 
                className={fieldErrors.schoolEmail ? 'input-error' : ''}
                required 
              />
              {fieldErrors.schoolEmail && <span className="field-error">{fieldErrors.schoolEmail}</span>}
            </label>
            <label>
              Personal Email
              <input 
                type="email" 
                value={form.personalEmail} 
                onChange={(e) => handleFieldChange('personalEmail', e.target.value)} 
                className={fieldErrors.personalEmail ? 'input-error' : ''}
              />
              {fieldErrors.personalEmail && <span className="field-error">{fieldErrors.personalEmail}</span>}
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/teachers')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}

