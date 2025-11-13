import React from 'react';
import './FormField.css';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options,
  ...props
}) {
  const inputId = `field-${name}`;

  return (
    <div className={`form-field ${error ? 'form-field-error' : ''}`}>
      <label htmlFor={inputId}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      {type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value || ''}
          onChange={onChange}
          required={required}
          className={error ? 'input-error' : ''}
          {...props}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value || ''}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={error ? 'input-error' : ''}
          {...props}
        />
      )}
      {error && <span className="field-error-message">{error}</span>}
    </div>
  );
}

