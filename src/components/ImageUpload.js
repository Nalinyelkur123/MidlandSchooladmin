import React, { useRef, useState, useCallback } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import './ImageUpload.css';

export default function ImageUpload({ 
  value, 
  onChange, 
  onError,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  label = 'Profile Image',
  description = 'Drag and drop an image here, or click to select'
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [error, setError] = useState('');

  const handleFile = useCallback((file) => {
    if (!file) return;

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      const errorMsg = `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      const errorMsg = `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setPreview(result);
      // Convert to base64 or data URL
      if (onChange) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      const errorMsg = 'Failed to read file';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    };
    reader.readAsDataURL(file);
  }, [onChange, onError, acceptedTypes, maxSize]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    setPreview(null);
    setError('');
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  // Update preview when value changes externally
  React.useEffect(() => {
    if (value && value !== preview) {
      setPreview(value);
    } else if (!value) {
      setPreview(null);
    }
  }, [value, preview]);

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">{label}</label>
      <div
        className={`image-upload-dropzone ${isDragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''} ${error ? 'has-error' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Image upload dropzone"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="image-upload-input"
          aria-label="Select image file"
        />
        
        {preview ? (
          <div className="image-upload-preview">
            <img src={preview} alt="Preview" />
            <button
              type="button"
              className="image-upload-remove"
              onClick={handleRemove}
              aria-label="Remove image"
              title="Remove image"
            >
              <FiX size={20} />
            </button>
            <div className="image-upload-overlay">
              <FiUpload size={24} />
              <span>Click to change image</span>
            </div>
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <FiImage size={48} />
            <p>{description}</p>
            <span className="image-upload-hint">Max size: {Math.round(maxSize / 1024 / 1024)}MB</span>
          </div>
        )}
      </div>
      {error && (
        <div className="image-upload-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

