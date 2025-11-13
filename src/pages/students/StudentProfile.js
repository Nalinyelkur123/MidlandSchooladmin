import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SkeletonProfile } from '../../components/SkeletonLoader';
import { FiEdit2, FiArrowLeft, FiPhone, FiMail, FiHome, FiCalendar, FiTag, FiHash, FiUser, FiBookOpen, FiPhoneCall, FiUsers } from 'react-icons/fi';
import StatusBadge from '../../components/StatusBadge';
import './StudentProfile.css';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    let isMounted = true;
    async function fetchStudent() {
      setLoading(true);
      setError('');
      try {
        let studentData = null;
        
        try {
          const admissionUrl = getApiUrl(`/midland/admin/students/admission/${id}`);
          const admissionRes = await fetch(admissionUrl, { 
            headers: getAuthHeaders(token)
          });
          if (admissionRes.ok) {
            studentData = await admissionRes.json();
          }
        } catch (err) {
          // Fall through to fallback
        }
        
        if (!studentData) {
          const allUrl = getApiUrl('/midland/admin/students/all');
          const allRes = await fetch(allUrl, { 
            headers: getAuthHeaders(token)
          });
          
          if (!allRes.ok) {
            throw new Error('Failed to load student');
          }
          
          const data = await allRes.json();
          const list = Array.isArray(data) ? data : [];
          
          const match = list.find(s => 
            String(s.studentUid) === id || 
            String(s.admissionNumber) === id || 
            String(s.rollNo) === id ||
            String(s.schoolEmail) === id ||
            String(s.personalEmail) === id
          );
          studentData = match || null;
        }
        
        if (isMounted) {
          setStudent(studentData);
          if (!studentData) {
            setError('Student not found');
            toast.error('Student not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load student';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchStudent();
    return () => { isMounted = false; };
  }, [id, token, toast]);

  const initials = useMemo(() => {
    const name = (student?.fullName || '').trim();
    if (!name) return '??';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [student]);

  const profileImageUrl = student?.profileImage || student?.profile_image || null;
  const [imageError, setImageError] = useState(false);

  // Reset image error when student changes
  useEffect(() => {
    setImageError(false);
  }, [student?.profileImage, student?.profile_image]);

  if (loading) return <div className="page"><SkeletonProfile /></div>;
  if (error || !student) return <div className="page"><div className="alert alert-error">{error || 'Student not found'}</div></div>;

  const primaryPhone = student.phoneNumber || '';
  const primaryEmail = student.schoolEmail || student.personalEmail || '';
  const phoneHref = primaryPhone ? `tel:${String(primaryPhone).replace(/\s+/g, '')}` : null;
  const emailHref = primaryEmail ? `mailto:${primaryEmail}` : null;

  const tabs = [
    { id: 'basic', label: 'Basic', icon: FiUser },
    { id: 'academic', label: 'Academic', icon: FiBookOpen },
    { id: 'contact', label: 'Contact', icon: FiPhoneCall },
    { id: 'guardian', label: 'Guardian', icon: FiUsers },
  ];

  return (
    <div className="page student-profile-page">
      <div className="profile-header-section">
        <div className="profile-header-left">
          <button className="back-button" onClick={() => navigate('/students')}>
            <FiArrowLeft size={20} />
          </button>
          <h1>Student Profile</h1>
        </div>
        <button className="btn-secondary" onClick={() => navigate(`/students/${id}/edit`)}>
          <FiEdit2 size={16} style={{ marginRight: 8 }} />
          Edit Profile
        </button>
      </div>

      <div className="profile-top-card">
        <div className="profile-avatar-large">
          {profileImageUrl && !imageError ? (
            <img 
              src={profileImageUrl} 
              alt={student.fullName || 'Student'}
              onError={() => setImageError(true)}
            />
          ) : (
            <div>{initials}</div>
          )}
        </div>
        <div className="profile-info-main">
          <h2 className="profile-name">{student.fullName || '-'}</h2>
          <div className="profile-badges">
            <div className="info-badge purple">
              <FiCalendar size={14} />
              <span>Class {student.gradeLevel || '-'} • Sec {student.section || '-'}</span>
            </div>
            <StatusBadge status={student.status || 'Active'} />
            <div className="info-badge orange">
              <FiHash size={14} />
              <span># {student.admissionNumber || student.rollNo || '-'}</span>
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
              <span>{student.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FiCalendar size={20} />
          </div>
          <div className="metric-label">CLASS</div>
          <div className="metric-value">{student.gradeLevel || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiCalendar size={20} />
          </div>
          <div className="metric-label">SECTION</div>
          <div className="metric-value">{student.section || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiCalendar size={20} />
          </div>
          <div className="metric-label">ACADEMIC YEAR</div>
          <div className="metric-value">{student.academicYear || '-'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiTag size={20} />
          </div>
          <div className="metric-label">STATUS</div>
          <div className="metric-value">{student.status || 'Active'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiCalendar size={20} />
          </div>
          <div className="metric-label">ATTENDANCE</div>
          <div className="metric-value">86%</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FiTag size={20} />
          </div>
          <div className="metric-label">FEES DUE</div>
          <div className="metric-value">₹ 0</div>
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
                  <div className="field-value">{student.fullName || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Gender</label>
                  <div className="field-value">{student.gender || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Date of Birth</label>
                  <div className="field-value">{student.dateOfBirth || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Blood Group</label>
                  <div className="field-value">{student.bloodGroup || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Nationality</label>
                  <div className="field-value">{student.nationality || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Mother Tongue</label>
                  <div className="field-value">{student.motherTongue || '-'}</div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="tab-panel">
                <div className="form-field-display">
                  <label>Admission Number</label>
                  <div className="field-value">{student.admissionNumber || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Roll No</label>
                  <div className="field-value">{student.rollNo || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Class</label>
                  <div className="field-value">{student.gradeLevel || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Section</label>
                  <div className="field-value">{student.section || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Academic Year</label>
                  <div className="field-value">{student.academicYear || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Admission Date</label>
                  <div className="field-value">{student.admissionDate || '-'}</div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="tab-panel">
                <div className="form-field-display">
                  <label>Phone Number</label>
                  <div className="field-value">{student.phoneNumber || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>School Email</label>
                  <div className="field-value">{student.schoolEmail || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Personal Email</label>
                  <div className="field-value">{student.personalEmail || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Address</label>
                  <div className="field-value">{student.address || '-'}</div>
                </div>
              </div>
            )}

            {activeTab === 'guardian' && (
              <div className="tab-panel">
                <div className="form-field-display">
                  <label>Guardian Name</label>
                  <div className="field-value">{student.guardianName || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Relation</label>
                  <div className="field-value">{student.guardianRelation || '-'}</div>
                </div>
                <div className="form-field-display">
                  <label>Guardian Contact</label>
                  <div className="field-value">{student.guardianContact || '-'}</div>
                </div>
              </div>
            )}
            </div>
          </div>

        <div className="attendance-summary-card">
          <h3>Attendance Summary</h3>
          <div className="attendance-percentage">
            <strong>86%</strong>
            <span>Overall attendance</span>
          </div>
          <div className="attendance-bars">
            <div className="attendance-bar-item">
              <div className="bar-label">PRESENT</div>
              <div className="bar-container">
                <div className="bar-fill present" style={{ width: '86%' }}></div>
              </div>
            </div>
            <div className="attendance-bar-item">
              <div className="bar-label">ABSENT</div>
              <div className="bar-container">
                <div className="bar-fill absent" style={{ width: '14%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
