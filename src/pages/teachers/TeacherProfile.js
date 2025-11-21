import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchAllPaginatedItems } from '../../utils/api';
import { SkeletonProfile } from '../../components/SkeletonLoader';
import { FiEdit2, FiArrowLeft, FiPhone, FiMail, FiHome, FiCalendar, FiTag, FiHash, FiBriefcase, FiUser, FiPhoneCall } from 'react-icons/fi';
import StatusBadge from '../../components/StatusBadge';
import './TeacherProfile.css';

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    let isMounted = true;
    async function fetchTeacher() {
      setLoading(true);
      setError('');
      try {
        const list = await fetchAllPaginatedItems(
          '/midland/admin/teachers/all',
          token,
          getApiUrl,
          getAuthHeaders
        );
        
        const match = list.find(t => 
          String(t.schoolEmail) === id || 
          String(t.personalEmail) === id ||
          String(t.teacherCode) === id
        );
        
        if (isMounted) {
          setTeacher(match || null);
          if (!match) {
            setError('Teacher not found');
            toast.error('Teacher not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load teacher';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTeacher();
    return () => { isMounted = false; };
  }, [id, token, toast]);

  const initials = useMemo(() => {
    const name = (teacher?.fullName || '').trim();
    if (!name) return '??';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [teacher]);

  if (loading) return <div className="page"><SkeletonProfile /></div>;
  if (error || !teacher) return <div className="page"><div className="alert alert-error">{error || 'Teacher not found'}</div></div>;

  const primaryPhone = teacher.phoneNumber || '';
  const primaryEmail = teacher.schoolEmail || teacher.personalEmail || '';
  const phoneHref = primaryPhone ? `tel:${String(primaryPhone).replace(/\s+/g, '')}` : null;
  const emailHref = primaryEmail ? `mailto:${primaryEmail}` : null;

  const tabs = [
    { id: 'basic', label: 'Basic', icon: FiUser },
    { id: 'professional', label: 'Professional', icon: FiBriefcase },
    { id: 'contact', label: 'Contact', icon: FiPhoneCall },
  ];

  const highlights = [
    { label: 'Status', value: teacher.status || 'Active' },
    { label: 'School Code', value: teacher.schoolCode || '-' },
    { label: 'Joined', value: teacher.joinDate || 'N/A' },
  ];

  return (
    <div className="page teacher-profile-page">
      <div className="profile-header-section">
        <div className="profile-header-left">
          <button className="back-button" onClick={() => navigate('/teachers')}>
            <FiArrowLeft size={20} />
          </button>
          <h1>Teacher Profile</h1>
        </div>
        <button className="btn-secondary" onClick={() => navigate(`/teachers/${id}/edit`)}>
          <FiEdit2 size={16} style={{ marginRight: 8 }} />
          Edit Profile
        </button>
      </div>

      <div className="profile-top-card">
        <div className="profile-avatar-large">{initials}</div>
        <div className="profile-info-main">
          <h2 className="profile-name">{teacher.fullName || '-'}</h2>
          <div className="profile-badges">
            <div className="info-badge purple">
              <FiBriefcase size={14} />
              <span>{teacher.department || '-'} • {teacher.designation || '-'}</span>
          </div>
            <StatusBadge status={teacher.status || 'Active'} />
            <div className="info-badge orange">
              <FiHash size={14} />
              <span># {teacher.teacherCode || '-'}</span>
            </div>
          </div>
          <div className="contact-cards">
            <div className="contact-card">
              <FiPhone size={18} />
              {primaryPhone ? (
                <a className="contact-card-link" href={phoneHref}>
                  {primaryPhone}
                </a>
              ) : (
                <span>N/A</span>
              )}
            </div>
            <div className="contact-card">
              <FiMail size={18} />
              {primaryEmail ? (
                <a className="contact-card-link" href={emailHref}>
                  {primaryEmail}
                </a>
              ) : (
                <span>N/A</span>
              )}
          </div>
            <div className="contact-card">
              <FiHome size={18} />
              <span>{teacher.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FiBriefcase size={20} />
          </div>
          <div className="metric-label">DEPARTMENT</div>
          <div className="metric-value">{teacher.department || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiTag size={20} />
          </div>
          <div className="metric-label">DESIGNATION</div>
          <div className="metric-value">{teacher.designation || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiHash size={20} />
          </div>
          <div className="metric-label">TEACHER CODE</div>
          <div className="metric-value">{teacher.teacherCode || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiTag size={20} />
          </div>
          <div className="metric-label">STATUS</div>
          <div className="metric-value">{teacher.status || 'Active'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiCalendar size={20} />
          </div>
          <div className="metric-label">SCHOOL CODE</div>
          <div className="metric-value">{teacher.schoolCode || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiCalendar size={20} />
          </div>
          <div className="metric-label">JOIN DATE</div>
          <div className="metric-value">{teacher.joinDate || '-'}</div>
        </div>
      </div>

      <div className="profile-content-layout">
        <div className="profile-tabs-section">
          <div className="profile-tabs">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  <TabIcon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="profile-tab-content">
            {activeTab === 'basic' && (
              <div className="tab-panel">
                <div className="form-field-display">
                  <label>Full Name</label>
                  <div className="field-value">{teacher.fullName || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Gender</label>
                  <div className="field-value">{teacher.gender || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Date of Birth</label>
                  <div className="field-value">{teacher.dateOfBirth || '-'}</div>
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="tab-panel">
                <div className="form-field-display">
                  <label>Teacher Code</label>
                  <div className="field-value">{teacher.teacherCode || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Department</label>
                  <div className="field-value">{teacher.department || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Designation</label>
                  <div className="field-value">{teacher.designation || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>School Code</label>
                  <div className="field-value">{teacher.schoolCode || '-'}</div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="tab-panel">
                <div className="form-field-display">
                  <label>Phone Number</label>
                  <div className="field-value">{teacher.phoneNumber || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>School Email</label>
                  <div className="field-value">{teacher.schoolEmail || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Personal Email</label>
                  <div className="field-value">{teacher.personalEmail || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Address</label>
                  <div className="field-value">{teacher.address || '-'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="attendance-summary-card teacher-summary-card">
          <h3>Profile Highlights</h3>
          <ul className="summary-list">
            {highlights.map(item => (
              <li key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
