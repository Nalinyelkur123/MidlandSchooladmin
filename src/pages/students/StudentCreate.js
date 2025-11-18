import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSearch } from '../../context/SearchContext';
import { FiSearch } from 'react-icons/fi';
import { FiArrowLeft, FiUser, FiBook, FiMail, FiUsers, FiHome } from 'react-icons/fi';
import ImageUpload from '../../components/ImageUpload';
import '../../components/ImageUpload.css';
import {
  validateUsername,
  validatePassword,
  validateEmail,
  validatePhone,
  validateRequired,
  validateDate,
  validateTextLength,
  validateFullName,
  validateSchoolCode,
  validateStudentId,
} from '../../utils/validation';

export default function StudentCreate() {
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
    bloodGroup: '',
    nationality: '',
    motherTongue: '',
    languagePreference: '',
    gradeLevel: '',
    section: '',
    academicYear: '',
    admissionDate: '',
    status: 'Active',
    admissionNumber: '',
    rollNo: '',
    phoneNumber: '',
    schoolEmail: '',
    personalEmail: '',
    guardianName: '',
    guardianRelation: '',
    guardianContact: '',
    schoolCode: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    profileImage: '',
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

    if (form.bloodGroup) {
      const bloodGroupError = validateTextLength(form.bloodGroup, 'Blood group', 0, 10);
      if (bloodGroupError) {
        errors.bloodGroup = bloodGroupError;
        isValid = false;
      }
    }

    if (form.nationality) {
      const nationalityError = validateTextLength(form.nationality, 'Nationality', 0, 50);
      if (nationalityError) {
        errors.nationality = nationalityError;
        isValid = false;
      }
    }

    if (form.motherTongue) {
      const motherTongueError = validateTextLength(form.motherTongue, 'Mother tongue', 0, 50);
      if (motherTongueError) {
        errors.motherTongue = motherTongueError;
        isValid = false;
      }
    }

    if (form.languagePreference) {
      const langError = validateTextLength(form.languagePreference, 'Language preference', 0, 50);
      if (langError) {
        errors.languagePreference = langError;
        isValid = false;
      }
    }

    // Academic Info section
    const schoolCodeError = validateSchoolCode(form.schoolCode);
    if (schoolCodeError) {
      errors.schoolCode = schoolCodeError;
      isValid = false;
    }

    const gradeLevelError = validateRequired(form.gradeLevel, 'Class');
    if (gradeLevelError) {
      errors.gradeLevel = gradeLevelError;
      isValid = false;
    }

    const sectionError = validateRequired(form.section, 'Section');
    if (sectionError) {
      errors.section = sectionError;
      isValid = false;
    }

    const academicYearError = validateRequired(form.academicYear, 'Academic year');
    if (academicYearError) {
      errors.academicYear = academicYearError;
      isValid = false;
    }

    const admissionDateError = validateDate(form.admissionDate, 'Admission date', true);
    if (admissionDateError) {
      errors.admissionDate = admissionDateError;
      isValid = false;
    }

    const admissionNumberError = validateStudentId(form.admissionNumber, 'Admission number');
    if (admissionNumberError) {
      errors.admissionNumber = admissionNumberError;
      isValid = false;
    }

    const rollNoError = validateStudentId(form.rollNo, 'Roll number');
    if (rollNoError) {
      errors.rollNo = rollNoError;
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

    // Guardian Info section
    if (form.guardianName) {
      const guardianNameError = validateTextLength(form.guardianName, 'Guardian name', 2, 100);
      if (guardianNameError) {
        errors.guardianName = guardianNameError;
        isValid = false;
      }
    }

    if (form.guardianRelation) {
      const guardianRelationError = validateTextLength(form.guardianRelation, 'Guardian relation', 0, 50);
      if (guardianRelationError) {
        errors.guardianRelation = guardianRelationError;
        isValid = false;
      }
    }

    if (form.guardianContact) {
      const guardianContactError = validatePhone(form.guardianContact);
      if (guardianContactError) {
        errors.guardianContact = guardianContactError;
        isValid = false;
      }
    }

    // Address section
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

    // Profile Image URL validation
    if (form.profileImage) {
      try {
        new URL(form.profileImage);
      } catch {
        errors.profileImage = 'Please enter a valid URL';
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
        <h2>Create New Student</h2>
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
        <button className="btn-secondary" onClick={() => navigate('/students')}>
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
          
          // Check for duplicates
          try {
            const checkUrl = getApiUrl('/midland/admin/students/all');
            const checkRes = await fetch(checkUrl, {
              headers: getAuthHeaders(token)
            });
            
            if (checkRes.ok) {
              const existingStudents = await checkRes.json();
              const studentsArray = Array.isArray(existingStudents) ? existingStudents : [];
              
              // Check for duplicate admission number
              if (form.admissionNumber && studentsArray.some(s => 
                (s.admissionNumber || '').trim().toLowerCase() === form.admissionNumber.trim().toLowerCase()
              )) {
                setFieldErrors({ admissionNumber: 'A student with this admission number already exists' });
                toast.error('A student with this admission number already exists');
                return;
              }
              
              // Check for duplicate roll number
              if (form.rollNo && studentsArray.some(s => 
                (s.rollNo || '').trim().toLowerCase() === form.rollNo.trim().toLowerCase()
              )) {
                setFieldErrors({ rollNo: 'A student with this roll number already exists' });
                toast.error('A student with this roll number already exists');
                return;
              }
              
              // Check for duplicate school email
              if (form.schoolEmail && studentsArray.some(s => 
                ((s.schoolEmail || '').trim().toLowerCase() === form.schoolEmail.trim().toLowerCase())
              )) {
                setFieldErrors({ schoolEmail: 'A student with this school email already exists' });
                toast.error('A student with this school email already exists');
                return;
              }
            }
          } catch (checkErr) {
            // If duplicate check fails, continue with submission (backend will catch duplicates)
            console.warn('Could not check for duplicates:', checkErr);
          }
          
          setSubmitting(true);
          try {
            const payload = {
              username: String(form.username || '').trim(),
              password: String(form.password || '').trim(),
              fullName: String(form.fullName || '').trim(),
              gender: String(form.gender || '').trim(),
              dateOfBirth: String(form.dateOfBirth || '').trim(),
              bloodGroup: String(form.bloodGroup || '').trim(),
              nationality: String(form.nationality || '').trim(),
              motherTongue: String(form.motherTongue || '').trim(),
              languagePreference: String(form.languagePreference || '').trim(),
              gradeLevel: String(form.gradeLevel || '').trim(),
              section: String(form.section || '').trim(),
              academicYear: String(form.academicYear || '').trim(),
              admissionDate: String(form.admissionDate || '').trim(),
              status: String(form.status || 'Active').trim(),
              admissionNumber: String(form.admissionNumber || '').trim(),
              rollNo: String(form.rollNo || '').trim(),
              phoneNumber: String(form.phoneNumber || '').trim(),
              schoolEmail: String(form.schoolEmail || '').trim(),
              personalEmail: String(form.personalEmail || '').trim(),
              guardianName: String(form.guardianName || '').trim(),
              guardianRelation: String(form.guardianRelation || '').trim(),
              guardianContact: String(form.guardianContact || '').trim(),
              schoolCode: String(form.schoolCode || '').trim(),
              address: String(form.address || '').trim(),
              city: String(form.city || '').trim(),
              state: String(form.state || '').trim(),
              country: String(form.country || '').trim(),
              pinCode: String(form.pinCode || '').trim(),
              profileImage: String(form.profileImage || '').trim(),
            };
            const url = getApiUrl('/midland/admin/students/create');
            const res = await fetch(url, {
              method: 'POST',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              let errorMessage = `Failed to create student (${res.status})`;
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
                  // Roll number or admission number conflicts
                  else if (lowerMessage.includes('roll') || lowerMessage.includes('admission')) {
                    if (lowerMessage.includes('roll')) {
                      setFieldErrors({ ...fieldErrors, rollNo: errorMessage });
                    }
                    if (lowerMessage.includes('admission')) {
                      setFieldErrors({ ...fieldErrors, admissionNumber: errorMessage });
                    }
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
            
            toast.success('Student created successfully');
            navigate('/students', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to create student';
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
                onChange={(e) => handleFieldChange('username', e.target.value)} 
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
            <label>
              Blood Group
              <input 
                value={form.bloodGroup} 
                onChange={(e) => handleFieldChange('bloodGroup', e.target.value)} 
                className={fieldErrors.bloodGroup ? 'input-error' : ''}
              />
              {fieldErrors.bloodGroup && <span className="field-error">{fieldErrors.bloodGroup}</span>}
            </label>
            <label>
              Nationality
              <input 
                value={form.nationality} 
                onChange={(e) => handleFieldChange('nationality', e.target.value)} 
                className={fieldErrors.nationality ? 'input-error' : ''}
              />
              {fieldErrors.nationality && <span className="field-error">{fieldErrors.nationality}</span>}
            </label>
            <label>
              Mother Tongue
              <input 
                value={form.motherTongue} 
                onChange={(e) => handleFieldChange('motherTongue', e.target.value)} 
                className={fieldErrors.motherTongue ? 'input-error' : ''}
              />
              {fieldErrors.motherTongue && <span className="field-error">{fieldErrors.motherTongue}</span>}
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <ImageUpload
              value={form.profileImage || ''}
              onChange={(value) => handleFieldChange('profileImage', value)}
              onError={(error) => {
                setFieldErrors({ ...fieldErrors, profileImage: error });
                toast.error(error);
              }}
              label="Profile Image"
              description="Drag and drop an image here, or click to select"
              />
            {fieldErrors.profileImage && <span className="field-error" style={{ marginTop: '8px', display: 'block' }}>{fieldErrors.profileImage}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>
            <FiBook />
            Academic Info
          </h3>
          <div className="form-grid">
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
            <label>
              Class *
              <input 
                value={form.gradeLevel} 
                onChange={(e) => handleFieldChange('gradeLevel', e.target.value)} 
                className={fieldErrors.gradeLevel ? 'input-error' : ''}
                required 
              />
              {fieldErrors.gradeLevel && <span className="field-error">{fieldErrors.gradeLevel}</span>}
            </label>
            <label>
              Section *
              <input 
                value={form.section} 
                onChange={(e) => handleFieldChange('section', e.target.value)} 
                className={fieldErrors.section ? 'input-error' : ''}
                required 
              />
              {fieldErrors.section && <span className="field-error">{fieldErrors.section}</span>}
            </label>
            <label>
              Academic Year *
              <input 
                value={form.academicYear} 
                onChange={(e) => handleFieldChange('academicYear', e.target.value)} 
                className={fieldErrors.academicYear ? 'input-error' : ''}
                required 
              />
              {fieldErrors.academicYear && <span className="field-error">{fieldErrors.academicYear}</span>}
            </label>
            <label>
              Admission Date *
              <input 
                type="date" 
                value={form.admissionDate} 
                onChange={(e) => handleFieldChange('admissionDate', e.target.value)} 
                className={fieldErrors.admissionDate ? 'input-error' : ''}
                required 
              />
              {fieldErrors.admissionDate && <span className="field-error">{fieldErrors.admissionDate}</span>}
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label>
              Admission No *
              <input 
                value={form.admissionNumber} 
                onChange={(e) => handleFieldChange('admissionNumber', e.target.value)} 
                className={fieldErrors.admissionNumber ? 'input-error' : ''}
                required 
              />
              {fieldErrors.admissionNumber && <span className="field-error">{fieldErrors.admissionNumber}</span>}
            </label>
            <label>
              Roll No *
              <input 
                value={form.rollNo} 
                onChange={(e) => handleFieldChange('rollNo', e.target.value)} 
                className={fieldErrors.rollNo ? 'input-error' : ''}
                required 
              />
              {fieldErrors.rollNo && <span className="field-error">{fieldErrors.rollNo}</span>}
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

        <div className="form-section">
          <h3>
            <FiUsers />
            Guardian Info
          </h3>
          <div className="form-grid">
            <label>
              Guardian Name
              <input 
                value={form.guardianName} 
                onChange={(e) => handleFieldChange('guardianName', e.target.value)} 
                className={fieldErrors.guardianName ? 'input-error' : ''}
              />
              {fieldErrors.guardianName && <span className="field-error">{fieldErrors.guardianName}</span>}
            </label>
            <label>
              Guardian Relation
              <input 
                value={form.guardianRelation} 
                onChange={(e) => handleFieldChange('guardianRelation', e.target.value)} 
                className={fieldErrors.guardianRelation ? 'input-error' : ''}
              />
              {fieldErrors.guardianRelation && <span className="field-error">{fieldErrors.guardianRelation}</span>}
            </label>
            <label>
              Guardian Contact
              <input 
                value={form.guardianContact} 
                onChange={(e) => handleFieldChange('guardianContact', e.target.value)} 
                className={fieldErrors.guardianContact ? 'input-error' : ''}
              />
              {fieldErrors.guardianContact && <span className="field-error">{fieldErrors.guardianContact}</span>}
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/students')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
}

