// Validation utility functions for form validation

// Email validation
export const validateEmail = (email) => {
  if (!email) return null; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

// Phone number validation (allows digits, spaces, dashes, parentheses, plus)
export const validatePhone = (phone) => {
  if (!phone) return null; // Optional field
  const phoneRegex = /^[\d\s\-+()]+$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  // Remove non-digits and check length
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return 'Phone number must be between 10 and 15 digits';
  }
  return null;
};

// Username validation
export const validateUsername = (username) => {
  if (!username || username.trim() === '') {
    return 'Username is required';
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (trimmed.length > 50) {
    return 'Username must be less than 50 characters';
  }
  // Allow alphanumeric, underscore, hyphen, dot
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return 'Username can only contain letters, numbers, dots, underscores, and hyphens';
  }
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (password.length > 100) {
    return 'Password must be less than 100 characters';
  }
  return null;
};

// Required field validation
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

// Date validation (not in future)
export const validateDate = (date, fieldName, allowFuture = false) => {
  if (!date) return null; // Optional field
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `Please enter a valid ${fieldName}`;
  }
  if (!allowFuture && dateObj > new Date()) {
    return `${fieldName} cannot be in the future`;
  }
  // Check if date is too old (e.g., more than 150 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (dateObj < minDate) {
    return `${fieldName} is too old`;
  }
  return null;
};

// Text length validation
export const validateTextLength = (value, fieldName, minLength = 0, maxLength = 255) => {
  if (!value) return null; // Optional field
  const trimmed = value.trim();
  if (minLength > 0 && trimmed.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  if (trimmed.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return null;
};

// Numeric validation
export const validateNumeric = (value, fieldName) => {
  if (!value) return null; // Optional field
  if (isNaN(value) || value.trim() === '') {
    return `${fieldName} must be a valid number`;
  }
  return null;
};

// Roll number / Admission number validation
export const validateStudentId = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  const trimmed = value.trim();
  if (trimmed.length < 1) {
    return `${fieldName} is required`;
  }
  if (trimmed.length > 50) {
    return `${fieldName} must be less than 50 characters`;
  }
  return null;
};

// School code validation
export const validateSchoolCode = (code) => {
  if (!code || code.trim() === '') {
    return 'School code is required';
  }
  const trimmed = code.trim();
  if (trimmed.length < 2) {
    return 'School code must be at least 2 characters';
  }
  if (trimmed.length > 20) {
    return 'School code must be less than 20 characters';
  }
  return null;
};

// Teacher code validation
export const validateTeacherCode = (code) => {
  if (!code || code.trim() === '') {
    return 'Teacher code is required';
  }
  const trimmed = code.trim();
  if (trimmed.length < 2) {
    return 'Teacher code must be at least 2 characters';
  }
  if (trimmed.length > 20) {
    return 'Teacher code must be less than 20 characters';
  }
  return null;
};

// Full name validation
export const validateFullName = (name) => {
  if (!name || name.trim() === '') {
    return 'Full name is required';
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return 'Full name must be at least 2 characters';
  }
  if (trimmed.length > 100) {
    return 'Full name must be less than 100 characters';
  }
  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!nameRegex.test(trimmed)) {
    return 'Full name can only contain letters, spaces, hyphens, apostrophes, and dots';
  }
  return null;
};

