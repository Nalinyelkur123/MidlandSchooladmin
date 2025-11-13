import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FiArrowLeft } from 'react-icons/fi';
import { SkeletonForm } from '../../components/SkeletonLoader';

export default function StudentEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchStudent() {
      setLoading(true);
      setError('');
      try {
        const url = getApiUrl('/midland/admin/students/all');
        const res = await fetch(url, { 
          headers: getAuthHeaders(token)
        });
        
        if (!res.ok) {
          throw new Error('Failed to load student');
        }
        
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const match = list.find(s => 
          String(s.schoolEmail) === id || 
          String(s.personalEmail) === id ||
          String(s.admissionNumber) === id ||
          String(s.rollNo) === id
        );
        
        if (isMounted) {
          if (match) {
            setForm(match);
          } else {
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

  if (loading) return <div className="page"><SkeletonForm /></div>;
  if (error && !form.schoolEmail) return <div className="page"><div className="alert alert-error">{error}</div></div>;

  const emailKey = form.schoolEmail || form.personalEmail || id;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Edit Student</h2>
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
          setSubmitting(true);
          try {
            const payload = { ...form };
            const url = getApiUrl(`/midland/admin/students/update/${encodeURIComponent(emailKey)}`);
            const res = await fetch(url, {
              method: 'PUT',
              headers: getAuthHeaders(token),
              body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
              const errorText = await res.text().catch(() => '');
              throw new Error(errorText || `Failed to update: ${res.status}`);
            }
            
            toast.success('Student updated successfully');
            navigate('/students', { replace: true });
          } catch (err) {
            const errorMsg = err.message || 'Failed to update student';
            setError(errorMsg);
            toast.error(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="form-section">
          <h3>Account</h3>
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
          <h3>Personal Info</h3>
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
              Date of Birth *
              <input type="date" value={form.dateOfBirth || ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
            </label>
            <label>
              Blood Group
              <input value={form.bloodGroup || ''} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
            </label>
            <label>
              Nationality
              <input value={form.nationality || ''} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
            </label>
            <label>
              Mother Tongue
              <input value={form.motherTongue || ''} onChange={(e) => setForm({ ...form, motherTongue: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Academic Info</h3>
          <div className="form-grid">
            <label>
              School Code *
              <input value={form.schoolCode || ''} onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} required />
            </label>
            <label>
              Class *
              <input value={form.gradeLevel || ''} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} required />
            </label>
            <label>
              Section *
              <input value={form.section || ''} onChange={(e) => setForm({ ...form, section: e.target.value })} required />
            </label>
            <label>
              Academic Year *
              <input value={form.academicYear || ''} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required />
            </label>
            <label>
              Admission Date *
              <input type="date" value={form.admissionDate || ''} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} required />
            </label>
            <label>
              Status
              <select value={form.status || 'Active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label>
              Admission No *
              <input value={form.admissionNumber || ''} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} required />
            </label>
            <label>
              Roll No *
              <input value={form.rollNo || ''} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} required />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Details</h3>
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

        <div className="form-section">
          <h3>Guardian Info</h3>
          <div className="form-grid">
            <label>
              Guardian Name
              <input value={form.guardianName || ''} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            </label>
            <label>
              Guardian Relation
              <input value={form.guardianRelation || ''} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })} />
            </label>
            <label>
              Guardian Contact
              <input value={form.guardianContact || ''} onChange={(e) => setForm({ ...form, guardianContact: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/students')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
