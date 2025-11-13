import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicAsset } from '../config';
import { FiUser, FiLock, FiMail } from 'react-icons/fi';

function IconUser() { return <FiUser className="icon-left" />; }
function IconLock() { return <FiLock className="icon-left" />; }
function IconMail() { return <FiMail className="icon-left" />; }

export default function Register() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      await auth.register(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-layout">
      <div
        className="login-hero"
        style={{ backgroundImage: `url(${publicAsset('Images/home.jpg')})` }}
      />
      <div className="auth-container register-page">
        <div className="auth-card wide">
          <div className="logo-container">
            <img src={publicAsset('Images/logo.png')} alt="Logo" />
          </div>
          {error ? <div className="auth-error">{error}</div> : null}
          <h2 className="login-title">Create Account</h2>
          <form onSubmit={handleSubmit} className="auth-form register-form-grid">
            <div className="col-12">
            <label>
              Username
              <div className="input-group">
                <IconUser />
                <input
                  className="with-icon"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin_username"
                />
              </div>
            </label>
            </div>
            
            <div className="col-12">
            <label>
              Email
              <div className="input-group">
                <IconMail />
                <input
                  className="with-icon"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@school.com"
                />
              </div>
            </label>
            </div>
            
            
            <div className="col-12">
            <label>
              Password
              <div className="input-group">
                <IconLock />
                <input
                  className="with-icon"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </label>
            </div>
            
            <div className="col-12">
            <label>
              Confirm Password
              <div className="input-group">
                <IconLock />
                <input
                  className="with-icon"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </label>
            </div>
            
            <div className="col-12">
              <button type="submit" className="auth-button" disabled={submitting}>
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

