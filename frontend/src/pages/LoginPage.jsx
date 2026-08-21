import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Shield, Store, User, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { InputField } from '../components/forms/InputField';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { ParticleCard } from '../components/common/MagicBento';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successUser, setSuccessUser] = useState(null);

  const getDestinationForRole = (role) => {
    // If a specific redirect was requested in location state (and not generic /login or /)
    if (location.state?.from?.pathname && location.state.from.pathname !== '/login' && location.state.from.pathname !== '/') {
      return location.state.from.pathname;
    }

    switch (role) {
      case 'SYSTEM_ADMIN':
        return '/admin';
      case 'STORE_OWNER':
        return '/owner';
      case 'NORMAL_USER':
      default:
        return '/stores';
    }
  };

  // If already authenticated, redirect to role destination
  React.useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getDestinationForRole(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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

        const targetDestination = getDestinationForRole(authenticatedUser.role);

        // Redirect after brief visual feedback
        setTimeout(() => {
          navigate(targetDestination, { replace: true });
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoRole) => {
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
        setEmail('john.doe@example.com');
        setPassword('User@123456');
        break;
    }
    setError(null);
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <ParticleCard
        className="glass-card"
        glowColor="99, 102, 241"
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        enableBorderGlow={true}
      >
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
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* Success Alert with Role Identification */}
        {successUser && (
          <Alert
            type="success"
            title={`Welcome back, ${successUser.name}!`}
            message={`Authenticating as ${successUser.role}. Redirecting to your dashboard...`}
          />
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
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Sparkles size={13} color="#818cf8" /> Fast Role-Login Switcher
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => fillQuickDemo('SYSTEM_ADMIN')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.2rem', justifyContent: 'center' }}
            >
              <Shield size={12} color="#818cf8" /> Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('STORE_OWNER_1')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.2rem', justifyContent: 'center' }}
            >
              <Store size={12} color="#f59e0b" /> Store 1
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('NORMAL_USER')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.35rem 0.2rem', justifyContent: 'center' }}
            >
              <User size={12} color="#10b981" /> User
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            icon={Mail}
            required
            autoComplete="email"
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            Sign In
          </Button>
        </form>

        {/* Footer Registration Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Need a customer account?{' '}
          <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>
            Register as Normal User
          </Link>
        </div>
      </ParticleCard>
    </div>
  );
};
