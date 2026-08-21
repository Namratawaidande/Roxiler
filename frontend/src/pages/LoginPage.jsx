import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Shield, Store, User, AlertCircle, CheckCircle, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successUser, setSuccessUser] = useState(null);

  // Redirection destination after login (default to role dashboard)
  const from = location.state?.from?.pathname || '/dashboard-preview';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessUser(null);
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (response?.data?.token && response?.data?.user) {
        const authenticatedUser = response.data.user;
        login(authenticatedUser, response.data.token);
        setSuccessUser(authenticatedUser);

        // Redirect after brief visual feedback
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 700);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoRole, specificEmail = '') => {
    switch (demoRole) {
      case 'SYSTEM_ADMIN':
        setEmail('admin@storerating.com');
        setPassword('Admin@123456');
        break;
      case 'STORE_OWNER_1':
        setEmail('owner1@storerating.com');
        setPassword('Owner@123456');
        break;
      case 'STORE_OWNER_2':
        setEmail('owner2@storerating.com');
        setPassword('Owner@123456');
        break;
      case 'NORMAL_USER':
      default:
        setEmail(specificEmail || 'john.doe@example.com');
        setPassword('User@123456');
        break;
    }
    setError(null);
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <div className="glass-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.45)'
          }}>
            <LogIn size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Unified Portal Login</h1>
          <p style={{ fontSize: '0.875rem' }}>Single sign-in for Administrators, Store Owners & Users</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#fb7185',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert with Role Identification */}
        {successUser && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#34d399',
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} />
              <span>Welcome, <strong>{successUser.name}</strong>!</span>
            </div>
            <span className="badge badge-primary">{successUser.role}</span>
          </div>
        )}

        {/* 1-Click Fast Test Credential Switcher */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-subtle)',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            ⚡ 1-Click Role Login Fill:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => fillQuickDemo('SYSTEM_ADMIN')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Shield size={12} color="#818cf8" /> Admin (System Admin)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('STORE_OWNER_1')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Store size={12} color="#06b6d4" /> Owner (Alice Storekeeper)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('STORE_OWNER_2')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Store size={12} color="#06b6d4" /> Owner (Marcus Vance)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('NORMAL_USER')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <User size={12} color="#10b981" /> User (John Doe)
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? 'Verifying Credentials...' : 'Sign In with JWT'}
          </button>
        </form>

        {/* Footer Registration Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Need a customer account?{' '}
          <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>
            Register as Normal User
          </Link>
        </div>
      </div>
    </div>
  );
};
