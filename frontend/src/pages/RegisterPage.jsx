import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, AlertCircle, CheckCircle, Lock, Mail, MapPin, Check, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Live password validation rules
  const passwordLengthValid = formData.password.length >= 8 && formData.password.length <= 16;
  const passwordUpperValid = /[A-Z]/.test(formData.password);
  const passwordSpecialValid = /[!@#$%^&*(),.?":{}|<>_]/.test(formData.password);
  const isPasswordFullyValid = passwordLengthValid && passwordUpperValid && passwordSpecialValid;

  // Live name validation
  const nameLength = formData.name.trim().length;
  const isNameValid = nameLength >= 20 && nameLength <= 60;

  // Live address validation
  const addressLength = formData.address.trim().length;
  const isAddressValid = addressLength <= 400;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleFillSample = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: 'Alexander Montgomery Wright', // 27 characters (satisfies 20-60)
      email: `alex.wright${randomSuffix}@example.com`,
      password: 'SecureUser@123', // 14 chars, 2 uppercase, 1 special
      address: '742 Evergreen Terrace, Sector 4, Springfield'
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Client-side pre-validation
    if (!isNameValid) {
      setError(`Full Name must be between 20 and 60 characters (currently ${nameLength} chars).`);
      return;
    }

    if (!isPasswordFullyValid) {
      setError('Password must be 8-16 characters with at least one uppercase letter and one special character.');
      return;
    }

    if (!isAddressValid) {
      setError('Address cannot exceed 400 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(formData);
      if (response?.data?.token && response?.data?.user) {
        login(response.data.user, response.data.token);
        setSuccessMsg('Account registered successfully as Normal User! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard-preview');
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div className="glass-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <UserPlus size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Create User Account</h1>
          <p style={{ fontSize: '0.85rem' }}>
            Register as a <strong>Normal User</strong> to rate stores, submit reviews, and track feedback.
          </p>
        </div>

        {/* 1-Click Fast Fill Helper */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={handleFillSample}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Sparkles size={13} color="#f59e0b" /> Auto-Fill Valid Sample User
          </button>
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
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#34d399',
            fontSize: '0.85rem'
          }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                <User size={14} /> Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{
                fontSize: '0.75rem',
                color: nameLength === 0 ? 'var(--text-subtle)' : isNameValid ? '#34d399' : '#fb7185'
              }}>
                {nameLength}/60 chars {nameLength < 20 && nameLength > 0 && '(min 20)'}
              </span>
            </div>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Alexander Montgomery Wright"
              value={formData.name}
              onChange={handleChange}
              minLength={20}
              maxLength={60}
              required
            />
            <small style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem', display: 'block' }}>
              Must be between 20 and 60 characters long.
            </small>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password Field & Live Meter */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} /> Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="8 to 16 characters"
              value={formData.password}
              onChange={handleChange}
              maxLength={16}
              required
            />

            {/* Password Validation Checklist */}
            <div style={{
              marginTop: '0.5rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: passwordLengthValid ? '#34d399' : 'var(--text-subtle)' }}>
                {passwordLengthValid ? <Check size={13} color="#34d399" /> : <X size={13} color="#94a3b8" />}
                <span>8 to 16 characters ({formData.password.length}/16)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: passwordUpperValid ? '#34d399' : 'var(--text-subtle)' }}>
                {passwordUpperValid ? <Check size={13} color="#34d399" /> : <X size={13} color="#94a3b8" />}
                <span>At least 1 uppercase letter (A-Z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: passwordSpecialValid ? '#34d399' : 'var(--text-subtle)' }}>
                {passwordSpecialValid ? <Check size={13} color="#34d399" /> : <X size={13} color="#94a3b8" />}
                <span>At least 1 special character (!@#$%^&*...)</span>
              </div>
            </div>
          </div>

          {/* Address Field */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                <MapPin size={14} /> Address (Optional)
              </label>
              <span style={{ fontSize: '0.75rem', color: isAddressValid ? 'var(--text-subtle)' : '#fb7185' }}>
                {addressLength}/400 chars
              </span>
            </div>
            <textarea
              name="address"
              className="form-input"
              rows={2}
              placeholder="e.g. 742 Evergreen Terrace, Springfield"
              value={formData.address}
              onChange={handleChange}
              maxLength={400}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Normal User Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>
            Sign In with Existing Account
          </Link>
        </div>
      </div>
    </div>
  );
};
