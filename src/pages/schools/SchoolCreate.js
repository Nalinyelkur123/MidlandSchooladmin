import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { FiArrowLeft, FiHome, FiMail, FiSearch } from 'react-icons/fi';
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateTextLength,
  validateSchoolCode,
} from '../../utils/validation';

export default function SchoolCreate() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  const [form, setForm] = useState({
    schoolCode: '',
    schoolName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    isActive: true,
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

    // School Code
    const schoolCodeError = validateSchoolCode(form.schoolCode);
    if (schoolCodeError) {
      errors.schoolCode = schoolCodeError;
      isValid = false;
    }

    // School Name
    const schoolNameError = validateRequired(form.schoolName, 'School name');
    if (schoolNameError) {
      errors.schoolName = schoolNameError;
      isValid = false;
    } else {
      const nameLengthError = validateTextLength(form.schoolName, 'School name', 2, 200);
      if (nameLengthError) {
        errors.schoolName = nameLengthError;
        isValid = false;
      }
    }

    // Email
    if (form.email) {
      const emailError = validateEmail(form.email);
      if (emailError) {
        errors.email = emailError;
        isValid = false;
      }
    }

    // Phone Number
    if (form.phoneNumber) {
      const phoneError = validatePhone(form.phoneNumber);
      if (phoneError) {
        errors.phoneNumber = phoneError;
        isValid = false;
      }
    }

    // Address fields
    if (form.address) {
      const addressError = validateTextLength(form.address, 'Address', 0, 255);
      if (addressError) {
        errors.address = addressError;
        isValid = false;
      }
    }

    if (form.city) {
      const cityError = validateTextLength(form.city, 'City', 0, 100);
      if (cityError) {
        errors.city = cityError;
        isValid = false;
      }
    }

    if (form.state) {
      const stateError = validateTextLength(form.state, 'State', 0, 100);
      if (stateError) {
        errors.state = stateError;
        isValid = false;
      }
    }

    if (form.country) {
      const countryError = validateTextLength(form.country, 'Country', 0, 100);
      if (countryError) {
        errors.country = countryError;
        isValid = false;
      }
    }

    if (form.pinCode) {
      const pinCodeError = validateTextLength(form.pinCode, 'Pin code', 0, 20);
      if (pinCodeError) {
        errors.pinCode = pinCodeError;
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
          <h2>Create New School</h2>
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
        <button className="btn-secondary" onClick={() => navigate('/schools')}>
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
          
          // Check if token exists before submitting
          if (!token) {
            setError('Authentication required. Please log in again.');
            toast.error('Authentication required. Please log in again.');
            return;
          }
          
          // Validate form before submission
          if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
          }
          
          setSubmitting(true);
          try {
            const payload = {
              schoolCode: String(form.schoolCode || '').trim(),
              schoolName: String(form.schoolName || '').trim(),
              email: String(form.email || '').trim(),
              phoneNumber: String(form.phoneNumber || '').trim(),
              address: String(form.address || '').trim(),
              city: String(form.city || '').trim(),
              state: String(form.state || '').trim(),
              country: String(form.country || '').trim(),
              pinCode: String(form.pinCode || '').trim(),
              isActive: form.isActive,
            };
            const url = getApiUrl('/midland/admin/schools/create');
            const res = await fetch(url, {
              method: 'POST',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              let errorMessage = `Failed to create school (${res.status})`;
              try {
                const errorData = await res.json();
                // Extract message from backend error response
                if (errorData.message) {
                  errorMessage = errorData.message;
                  
                  // Check for specific error types and highlight relevant fields
                  const lowerMessage = errorMessage.toLowerCase();
                  
                  // School code conflict
                  if (lowerMessage.includes('school') && (lowerMessage.includes('code') || lowerMessage.includes('already exists'))) {
                    setFieldErrors({ ...fieldErrors, schoolCode: errorMessage });
                  }
                  // Email conflict
                  else if (lowerMessage.includes('email') && lowerMessage.includes('already exists')) {
                    setFieldErrors({ ...fieldErrors, email: errorMessage });
                  }
                } else if (errorData.error) {
                  errorMessage = errorData.error;
                  const lowerError = errorMessage.toLowerCase();
                  if (lowerError.includes('school') && lowerError.includes('code')) {
                    setFieldErrors({ ...fieldErrors, schoolCode: errorMessage });
                  } else if (lowerError.includes('email')) {
                    setFieldErrors({ ...fieldErrors, email: errorMessage });
                  }
                }
              } catch {
                // If JSON parsing fails, try text
                const errorText = await res.text().catch(() => '');
                if (errorText) {
                  try {
                    const parsed = JSON.parse(errorText);
                    errorMessage = parsed.message || parsed.error || errorText;
                    const lowerText = errorMessage.toLowerCase();
                    if (lowerText.includes('school') && lowerText.includes('code')) {
                      setFieldErrors({ ...fieldErrors, schoolCode: errorMessage });
                    } else if (lowerText.includes('email')) {
                      setFieldErrors({ ...fieldErrors, email: errorMessage });
                    }
                  } catch {
                    const lowerText = errorText.toLowerCase();
                    if (lowerText.includes('school') && lowerText.includes('code')) {
                      setFieldErrors({ ...fieldErrors, schoolCode: errorText });
                    } else if (lowerText.includes('email')) {
                      setFieldErrors({ ...fieldErrors, email: errorText });
                    } else {
                      errorMessage = errorText || errorMessage;
                    }
                  }
                }
              }
              throw new Error(errorMessage);
            }
            
            toast.success('School created successfully');
            navigate('/schools', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to create school';
            setError(errorMsg);
            toast.error(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="form-section">
          <h3>
            <FiHome />
            School Information
          </h3>
          <div className="form-grid">
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
            <label>
              School Name *
              <input 
                value={form.schoolName} 
                onChange={(e) => handleFieldChange('schoolName', e.target.value)} 
                className={fieldErrors.schoolName ? 'input-error' : ''}
                required 
              />
              {fieldErrors.schoolName && <span className="field-error">{fieldErrors.schoolName}</span>}
            </label>
            <label>
              Status
              <select 
                value={form.isActive ? 'Active' : 'Inactive'} 
                onChange={(e) => handleFieldChange('isActive', e.target.value === 'Active')} 
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              Email
              <input 
                type="email" 
                value={form.email} 
                onChange={(e) => handleFieldChange('email', e.target.value)} 
                className={fieldErrors.email ? 'input-error' : ''}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </label>
            <label>
              Phone Number
              <input 
                value={form.phoneNumber} 
                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)} 
                className={fieldErrors.phoneNumber ? 'input-error' : ''}
              />
              {fieldErrors.phoneNumber && <span className="field-error">{fieldErrors.phoneNumber}</span>}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiHome />
            Address
          </h3>
          <div className="form-grid">
            <label>
              Address
              <input 
                value={form.address} 
                onChange={(e) => handleFieldChange('address', e.target.value)} 
                className={fieldErrors.address ? 'input-error' : ''}
                placeholder="123, Street Name"
              />
              {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
            </label>
            <label>
              City
              <input 
                value={form.city} 
                onChange={(e) => handleFieldChange('city', e.target.value)} 
                className={fieldErrors.city ? 'input-error' : ''}
              />
              {fieldErrors.city && <span className="field-error">{fieldErrors.city}</span>}
            </label>
            <label>
              State
              <input 
                value={form.state} 
                onChange={(e) => handleFieldChange('state', e.target.value)} 
                className={fieldErrors.state ? 'input-error' : ''}
              />
              {fieldErrors.state && <span className="field-error">{fieldErrors.state}</span>}
            </label>
            <label>
              Country
              <input 
                value={form.country} 
                onChange={(e) => handleFieldChange('country', e.target.value)} 
                className={fieldErrors.country ? 'input-error' : ''}
              />
              {fieldErrors.country && <span className="field-error">{fieldErrors.country}</span>}
            </label>
            <label>
              Pin Code
              <input 
                value={form.pinCode} 
                onChange={(e) => handleFieldChange('pinCode', e.target.value)} 
                className={fieldErrors.pinCode ? 'input-error' : ''}
                placeholder="500081"
              />
              {fieldErrors.pinCode && <span className="field-error">{fieldErrors.pinCode}</span>}
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/schools')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create School'}
          </button>
        </div>
      </form>
    </div>
  );
}

