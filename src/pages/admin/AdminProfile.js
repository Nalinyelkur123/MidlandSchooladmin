import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SkeletonProfile } from '../../components/SkeletonLoader';
import StatusBadge from '../../components/StatusBadge';
import {
  FiArrowLeft,
  FiEdit2,
  FiPhone,
  FiMail,
  FiHome,
  FiHash,
  FiUser,
  FiBriefcase
} from 'react-icons/fi';
import './AdminProfile.css';

export default function AdminProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchAdmin() {
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
            setError('Invalid administrator identifier');
            setLoading(false);
            toast.error('Invalid administrator identifier');
          }
          return;
        }
        
        let adminData = null;
        
        // Check if ID looks like an email address
        const isEmail = decodedId.includes('@');
        
        // Try to fetch by email endpoint first (if ID is an email)
        if (isEmail) {
          try {
            const emailUrl = getApiUrl(`/midland/admin/email/${encodeURIComponent(decodedId)}`);
            const emailRes = await fetch(emailUrl, {
              method: 'GET',
              headers: getAuthHeaders(token)
            });
            if (emailRes.ok) {
              adminData = await emailRes.json();
            }
          } catch (err) {
            // Fall through to other methods
          }
        }
        
        // Try to fetch by specific endpoint (if not already found)
        if (!adminData) {
          try {
            const specificUrl = getApiUrl(`/midland/admin/${encodeURIComponent(decodedId)}`);
            const specificRes = await fetch(specificUrl, {
              method: 'GET',
              headers: getAuthHeaders(token)
            });
            if (specificRes.ok) {
              adminData = await specificRes.json();
            }
          } catch (err) {
            // Fall through to list endpoint
          }
        }
        
        // If not found, fetch all and search
        if (!adminData) {
          const url = getApiUrl('/midland/admin/all');
          const res = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(token)
          });

          if (!res.ok) {
            throw new Error('Failed to load administrator');
          }

          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          
          // Try multiple matching strategies
          const match = list.find(a => {
            if (!a) return false;
            
            const email = String(a.email || '').trim();
            const schoolEmail = String(a.schoolEmail || '').trim();
            const personalEmail = String(a.personalEmail || '').trim();
            const adminCode = String(a.adminCode || '').trim();
            const adminId = String(a.id || '').trim();
            const decodedIdLower = decodedId.toLowerCase().trim();
            
            // Try exact matches first (case-insensitive)
            if (email && email.toLowerCase() === decodedIdLower) return true;
            if (schoolEmail && schoolEmail.toLowerCase() === decodedIdLower) return true;
            if (personalEmail && personalEmail.toLowerCase() === decodedIdLower) return true;
            if (adminCode && adminCode.toLowerCase() === decodedIdLower) return true;
            if (adminId && adminId.toLowerCase() === decodedIdLower) return true;
            
            // Try case-sensitive matches
            if (email && email === decodedId) return true;
            if (schoolEmail && schoolEmail === decodedId) return true;
            if (personalEmail && personalEmail === decodedId) return true;
            if (adminCode && adminCode === decodedId) return true;
            if (adminId && adminId === decodedId) return true;
            
            return false;
          });
          
          adminData = match || null;
          
          // Debug logging (remove in production if needed)
          if (!adminData && list.length > 0) {
            console.log('AdminProfile: Could not find admin with ID:', decodedId);
            console.log('AdminProfile: Available admins:', list.map(a => ({
              schoolEmail: a.schoolEmail,
              personalEmail: a.personalEmail,
              adminCode: a.adminCode
            })));
          }
        }

        if (isMounted) {
          setAdmin(adminData);
          if (!adminData) {
            setError('Administrator not found');
            toast.error('Administrator not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load administrator';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAdmin();
    return () => {
      isMounted = false;
    };
  }, [id, token, toast]);

  const [imageError, setImageError] = useState(false);

  const initials = useMemo(() => {
    const name = (admin?.fullName || admin?.firstName || admin?.lastName || '').trim();
    if (!name) return '??';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [admin]);

  // Reset image error when admin changes
  useEffect(() => {
    setImageError(false);
  }, [admin?.profileImage, admin?.profile_image]);

  if (loading) return <div className="page"><SkeletonProfile /></div>;
  if (error || !admin) return <div className="page"><div className="alert alert-error">{error || 'Administrator not found'}</div></div>;

  // Handle different field name variations from API
  const primaryEmail = admin.email || admin.schoolEmail || admin.personalEmail || '';
  const status = admin.isActive !== undefined ? (admin.isActive ? 'Active' : 'Inactive') : (admin.status || 'Active');
  const phoneHref = admin.phoneNumber ? `tel:${String(admin.phoneNumber).replace(/\s+/g, '')}` : null;
  const emailHref = primaryEmail ? `mailto:${primaryEmail}` : null;
  const profileImageUrl = admin.profileImage || admin.profile_image || null;

  return (
    <div className="page admin-profile-page">
      <div className="profile-header-section">
        <div className="profile-header-left">
          <button className="back-button" onClick={() => navigate('/admin')}>
            <FiArrowLeft size={20} />
          </button>
          <h1>Administrator Profile</h1>
        </div>
        <button className="btn-secondary" onClick={() => navigate(`/admin/${encodeURIComponent(primaryEmail || admin.adminCode || id)}/edit`)}>
          <FiEdit2 size={16} style={{ marginRight: 8 }} />
          Edit Profile
        </button>
      </div>

      <div className="profile-top-card">
        <div className="profile-avatar-large">
          {profileImageUrl && !imageError ? (
            <img 
              src={profileImageUrl} 
              alt={admin.fullName || 'Administrator'}
              onError={() => setImageError(true)}
            />
          ) : (
            <div>{initials}</div>
          )}
        </div>
        <div className="profile-info-main">
          <h2 className="profile-name">{admin.fullName || admin.firstName || admin.lastName || '-'}</h2>
          <div className="profile-badges">
            <div className="info-badge purple">
              <FiBriefcase size={14} />
              <span>{admin.designation || 'Administrator'}</span>
            </div>
            <StatusBadge status={status} />
            <div className="info-badge orange">
              <FiHash size={14} />
              <span># {admin.id || admin.adminCode || '-'}</span>
            </div>
          </div>
          <div className="contact-cards">
            <div className="contact-card">
              <FiPhone size={18} />
              {admin.phoneNumber ? (
                <a className="contact-card-link" href={phoneHref}>{admin.phoneNumber}</a>
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
              <span>{admin.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><FiUser size={20} /></div>
          <div className="metric-label">USERNAME</div>
          <div className="metric-value">{admin.username || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><FiBriefcase size={20} /></div>
          <div className="metric-label">DESIGNATION</div>
          <div className="metric-value">{admin.designation || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><FiHash size={20} /></div>
          <div className="metric-label">SCHOOL CODE</div>
          <div className="metric-value">{admin.schoolCode || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><FiMail size={20} /></div>
          <div className="metric-label">EMAIL</div>
          <div className="metric-value">{primaryEmail || '-'}</div>
        </div>
        {admin.personalEmail && admin.personalEmail !== primaryEmail && (
          <div className="metric-card">
            <div className="metric-icon"><FiMail size={20} /></div>
            <div className="metric-label">PERSONAL EMAIL</div>
            <div className="metric-value">{admin.personalEmail || '-'}</div>
          </div>
        )}
        <div className="metric-card">
          <div className="metric-icon"><FiPhone size={20} /></div>
          <div className="metric-label">PHONE</div>
          <div className="metric-value">{admin.phoneNumber || '-'}</div>
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
                <label>ID</label>
                <div className="field-value">{admin.id || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Full Name</label>
                <div className="field-value">{admin.fullName || (admin.firstName && admin.lastName ? `${admin.firstName} ${admin.lastName}` : admin.firstName || admin.lastName || '-')}</div>
              </div>
              {(admin.firstName || admin.lastName) && admin.fullName && (
                <>
                  {admin.firstName && (
                    <div className="form-field-display">
                      <label>First Name</label>
                      <div className="field-value">{admin.firstName || '-'}</div>
                    </div>
                  )}
                  {admin.lastName && (
                    <div className="form-field-display">
                      <label>Last Name</label>
                      <div className="field-value">{admin.lastName || '-'}</div>
                    </div>
                  )}
                </>
              )}
              <div className="form-field-display">
                <label>Username</label>
                <div className="field-value">{admin.username || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Email</label>
                <div className="field-value">{primaryEmail || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Phone Number</label>
                <div className="field-value">{admin.phoneNumber || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Gender</label>
                <div className="field-value">{admin.gender || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>Designation</label>
                <div className="field-value">{admin.designation || '-'}</div>
              </div>
              <div className="form-field-display">
                <label>School Code</label>
                <div className="field-value">{admin.schoolCode || '-'}</div>
              </div>
              {admin.notes && (
                <div className="form-field-display">
                  <label>Notes</label>
                  <div className="field-value">{admin.notes || '-'}</div>
                </div>
              )}
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
              <span>Username</span>
              <strong>{admin.username || '-'}</strong>
            </li>
            <li>
              <span>Created</span>
              <strong>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}</strong>
            </li>
            {admin.updatedAt && (
              <li>
                <span>Last Updated</span>
                <strong>{new Date(admin.updatedAt).toLocaleDateString()}</strong>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
