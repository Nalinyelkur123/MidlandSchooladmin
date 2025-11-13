import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FiArrowLeft, FiUser, FiMail } from 'react-icons/fi';
import {
  validateUsername,
  validatePassword,
  validateEmail,
  validatePhone,
  validateRequired,
  validateFullName,
  validateSchoolCode,
} from '../../utils/validation';

export default function AdminCreate() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    gender: '',
    designation: '',
    schoolEmail: '',
    personalEmail: '',
    phoneNumber: '',
    schoolCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

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

    const designationError = validateRequired(form.designation, 'Designation');
    if (designationError) {
      errors.designation = designationError;
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
        <h2>Create New Administrator</h2>
        <button className="btn-secondary" onClick={() => navigate('/admin')}>
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
              designation: String(form.designation || '').trim(),
              schoolEmail: String(form.schoolEmail || '').trim(),
              personalEmail: String(form.personalEmail || '').trim(),
              phoneNumber: String(form.phoneNumber || '').trim(),
              schoolCode: String(form.schoolCode || '').trim(),
            };
            const url = getApiUrl('/midland/admin/create');
            const res = await fetch(url, {
              method: 'POST',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              let errorMessage = `Failed to create administrator (${res.status})`;
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
            
            toast.success('Administrator created successfully');
            navigate('/admin', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to create admin';
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
              School Code *
              <input 
                value={form.schoolCode} 
                onChange={(e) => handleFieldChange('schoolCode', e.target.value)} 
                className={fieldErrors.schoolCode ? 'input-error' : ''}
                required 
              />
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
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Administrator'}
          </button>
        </div>
      </form>
    </div>
  );
}

