import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchAllPaginatedItems } from '../../utils/api';
import { SkeletonProfile } from '../../components/SkeletonLoader';
import StatusBadge from '../../components/StatusBadge';
import {
  FiArrowLeft,
  FiEdit2,
  FiPhone,
  FiMail,
  FiHome,
  FiHash,
} from 'react-icons/fi';
import './SchoolProfile.css';

export default function SchoolProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchSchool() {
      if (!token) {
        if (isMounted) {
          setError('Authentication required');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Decode the ID from URL
        const decodedId = decodeURIComponent(id);
        
        // Validate ID - don't make API calls with invalid IDs
        if (!decodedId || decodedId === '-' || decodedId.trim() === '') {
          if (isMounted) {
            setError('Invalid school identifier');
            setLoading(false);
            toast.error('Invalid school identifier');
          }
          return;
        }
        
        let schoolData = null;
        
        // Try to fetch by specific endpoint first
        try {
          const specificUrl = getApiUrl(`/midland/admin/schools/${encodeURIComponent(decodedId)}`);
          const specificRes = await fetch(specificUrl, {
            method: 'GET',
            headers: getAuthHeaders(token)
          });
          if (specificRes.ok) {
            schoolData = await specificRes.json();
          }
        } catch (err) {
          // Fall through to list endpoint
        }
        
        // If not found, fetch all and search
        if (!schoolData) {
          const list = await fetchAllPaginatedItems(
            '/midland/admin/schools/all',
            token,
            getApiUrl,
            getAuthHeaders
          );
          
          // Try multiple matching strategies
          const match = list.find(s => {
            if (!s) return false;
            
            const schoolCode = String(s.schoolCode || '').trim();
            const schoolId = String(s.id || '').trim();
            const decodedIdLower = decodedId.toLowerCase().trim();
            
            // Try exact matches first (case-insensitive)
            if (schoolCode && schoolCode.toLowerCase() === decodedIdLower) return true;
            if (schoolId && schoolId.toLowerCase() === decodedIdLower) return true;
            
            // Try case-sensitive matches
            if (schoolCode && schoolCode === decodedId) return true;
            if (schoolId && schoolId === decodedId) return true;
            
            return false;
          });
          
          schoolData = match || null;
        }

        if (isMounted) {
          setSchool(schoolData);
          if (!schoolData) {
            setError('School not found');
            toast.error('School not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load school';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSchool();
    return () => {
      isMounted = false;
    };
  }, [id, token, toast]);

  const [imageError, setImageError] = useState(false);

  const initials = useMemo(() => {
    const name = (school?.schoolName || school?.name || '').trim();
    if (!name) return '??';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [school]);

  // Reset image error when school changes
  useEffect(() => {
    setImageError(false);
  }, [school?.profileImage, school?.profile_image]);

  if (loading) return <div className="page"><SkeletonProfile /></div>;
  if (error || !school) return <div className="page"><div className="alert alert-error">{error || 'School not found'}</div></div>;

  // Handle different field name variations from API
  const primaryEmail = school.email || school.schoolEmail || '';
  const status = school.isActive !== undefined ? (school.isActive ? 'Active' : 'Inactive') : (school.status || 'Active');
  const phoneHref = school.phoneNumber ? `tel:${String(school.phoneNumber).replace(/\s+/g, '')}` : null;
  const emailHref = primaryEmail ? `mailto:${primaryEmail}` : null;
  const profileImageUrl = school.profileImage || school.profile_image || null;
  const schoolName = school.schoolName || school.name || '-';
  const schoolCode = school.schoolCode || school.id || '-';

  return (
    <div className="page school-profile-page">
      <div className="profile-header-section">
        <div className="profile-header-left">
          <button className="back-button" onClick={() => navigate('/schools')}>
            <FiArrowLeft size={20} />
          </button>
          <h1>School Profile</h1>
        </div>
        <button className="btn-secondary" onClick={() => navigate(`/schools/${encodeURIComponent(schoolCode)}/edit`)}>
          <FiEdit2 size={16} style={{ marginRight: 8 }} />
          Edit Profile
        </button>
      </div>

      <div className="profile-top-card">
        <div className="profile-avatar-large">
          {profileImageUrl && !imageError ? (
            <img 
              src={profileImageUrl} 
              alt={schoolName}
              onError={() => setImageError(true)}
            />
          ) : (
            <div>{initials}</div>
          )}
        </div>
        <div className="profile-info-main">
          <h2 className="profile-name">{schoolName}</h2>
          <div className="profile-badges">
            <StatusBadge status={status} />
            <div className="info-badge orange">
              <FiHash size={14} />
              <span># {schoolCode}</span>
            </div>
          </div>
          <div className="contact-cards">
            <div className="contact-card">
              <FiPhone size={18} />
              {school.phoneNumber ? (
                <a className="contact-card-link" href={phoneHref}>{school.phoneNumber}</a>
              ) : (
                <span>N/A</span>
              )}
            </div>
            <div className="contact-card">
              <FiMail size={18} />
              {primaryEmail ? (
                <a className="contact-card-link" href={emailHref}>{primaryEmail}</a>
              ) : (
                <span>N/A</span>
              )}
            </div>
            <div className="contact-card">
              <FiHome size={18} />
              <span>{school.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><FiHash size={20} /></div>
          <div className="metric-label">SCHOOL CODE</div>
          <div className="metric-value">{schoolCode}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><FiHome size={20} /></div>
          <div className="metric-label">CITY</div>
          <div className="metric-value">{school.city || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><FiHome size={20} /></div>
          <div className="metric-label">STATE</div>
          <div className="metric-value">{school.state || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><FiHome size={20} /></div>
          <div className="metric-label">COUNTRY</div>
          <div className="metric-value">{school.country || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><FiMail size={20} /></div>
          <div className="metric-label">EMAIL</div>
          <div className="metric-value">{primaryEmail || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><FiPhone size={20} /></div>
          <div className="metric-label">PHONE</div>
          <div className="metric-value">{school.phoneNumber || '-'}</div>
        </div>
      </div>

      <div className="profile-content-layout">
        <div className="profile-tabs-section">
          <div className="profile-tabs single">
            <button className="profile-tab active" type="button">
              Overview
            </button>
          </div>
          <div className="profile-tab-content">
            <div className="tab-panel">
              <div className="form-field-display">
                <label>School Code</label>
                <div className="field-value">{schoolCode}</div>
              </div>
              <div className="form-field-display">
                <label>School Name</label>
                <div className="field-value">{schoolName}</div>
              </div>
              <div className="form-field-display">
                <label>Email</label>
                <div className="field-value">{primaryEmail || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Phone Number</label>
                <div className="field-value">{school.phoneNumber || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Address</label>
                <div className="field-value">{school.address || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>City</label>
                <div className="field-value">{school.city || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>State</label>
                <div className="field-value">{school.state || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Country</label>
                <div className="field-value">{school.country || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Pin Code</label>
                <div className="field-value">{school.pinCode || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Status</label>
                <div className="field-value">{status}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-summary-card">
          <h3>Profile Highlights</h3>
          <ul className="summary-list">
            <li>
              <span>Status</span>
              <strong>{status}</strong>
            </li>
            <li>
              <span>School Code</span>
              <strong>{schoolCode}</strong>
            </li>
            <li>
              <span>Created</span>
              <strong>{school.createdAt ? new Date(school.createdAt).toLocaleDateString() : '—'}</strong>
            </li>
            {school.updatedAt && (
              <li>
                <span>Last Updated</span>
                <strong>{new Date(school.updatedAt).toLocaleDateString()}</strong>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

