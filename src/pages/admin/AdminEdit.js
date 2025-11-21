import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchAllPaginatedItems } from '../../utils/api';
import { useSearch } from '../../context/SearchContext';
import { FiArrowLeft, FiUser, FiMail, FiSearch } from 'react-icons/fi';
import { SkeletonForm } from '../../components/SkeletonLoader';

export default function AdminEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const { searchQuery, setSearchQuery } = useSearch();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        const decodedId = decodeURIComponent(id || '');
        
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
          const list = await fetchAllPaginatedItems(
            '/midland/admin/all',
            token,
            getApiUrl,
            getAuthHeaders
          );
          
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
        }
        
        if (isMounted) {
          if (adminData) {
            setForm(adminData);
          } else {
            setError('Admin not found');
            toast.error('Admin not found');
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to load admin';
        if (isMounted) setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAdmin();
    return () => { isMounted = false; };
  }, [id, token, toast]);

  if (loading) return <div className="page"><SkeletonForm /></div>;
  if (error && !form.email && !form.schoolEmail && !form.personalEmail) {
    return <div className="page"><div className="alert alert-error">{error}</div></div>;
  }

  // Use the email ID from URL parameter for the API endpoint
  const emailId = decodeURIComponent(id || '');

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <h2>Edit Administrator</h2>
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
          
          // Check if token exists before submitting
          if (!token) {
            setError('Authentication required. Please log in again.');
            toast.error('Authentication required. Please log in again.');
            return;
          }
          
          setSubmitting(true);
          try {
            const payload = { ...form };
            // Use email ID from URL parameter (last part of endpoint)
            const url = getApiUrl(`/midland/admin/update/${encodeURIComponent(emailId)}`);
            const res = await fetch(url, {
              method: 'PUT',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              const errorText = await res.text().catch(() => '');
              throw new Error(errorText || `Failed to update: ${res.status}`);
            }
            
            toast.success('Administrator updated successfully');
            navigate('/admin', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to update admin';
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
              <input value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current password" />
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
              <input value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </label>
            <label>
              Gender *
              <select value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Designation *
              <input value={form.designation || ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
            </label>
            <label>
              School Code *
              <input value={form.schoolCode || ''} onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} required />
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
              <input value={form.phoneNumber || ''} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </label>
            <label>
              School Email *
              <input type="email" value={form.schoolEmail || ''} onChange={(e) => setForm({ ...form, schoolEmail: e.target.value })} required />
            </label>
            <label>
              Personal Email
              <input type="email" value={form.personalEmail || ''} onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Administrator'}
          </button>
        </div>
      </form>
    </div>
  );
}
