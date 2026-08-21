import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Lock, Check, X, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import api from '../../services/api';

export const ChangePasswordModal = ({ isOpen, onClose, onPasswordChanged }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
  };

  // Real-time validations
  const isLengthValid = formData.newPassword.length >= 8 && formData.newPassword.length <= 16;
  const hasUppercase = /[A-Z]/.test(formData.newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(formData.newPassword);
  const isMatching = formData.newPassword.length > 0 && formData.newPassword === formData.confirmNewPassword;
  const isDifferent = formData.currentPassword.length > 0 && formData.currentPassword !== formData.newPassword;

  const isFormValid = isLengthValid && hasUppercase && hasSpecial && isMatching && formData.currentPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!isLengthValid || !hasUppercase || !hasSpecial) {
      setError('New password does not meet the complexity requirements.');
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put('/auth/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword
      });

      setSuccess(response.message || 'Password changed successfully! Please remember your new password.');

      setTimeout(() => {
        if (onPasswordChanged) onPasswordChanged();
        onClose();
        setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(2, 6, 23, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.5rem',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '490px',
          background: '#0d1322',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '16px',
          padding: '1.75rem',
          position: 'relative',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 45px rgba(99, 102, 241, 0.20)',
          maxHeight: 'calc(100vh - 3rem)',
          overflowY: 'auto',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.10)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}>
              <KeyRound size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#f8fafc', fontWeight: 700 }}>Reset Password</h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Update your account password securely
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Current Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                placeholder="Enter current password"
                className="form-input"
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={loading}
                required
                style={{
                  background: '#070b16',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#f8fafc',
                  paddingRight: '2.5rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                placeholder="Enter 8–16 character password"
                className="form-input"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={loading}
                required
                style={{
                  background: '#070b16',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#f8fafc',
                  paddingRight: '2.5rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmNewPassword"
                placeholder="Re-enter new password"
                className="form-input"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                disabled={loading}
                required
                style={{
                  background: '#070b16',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#f8fafc',
                  paddingRight: '2.5rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Real-time Requirement Checklist */}
          <div style={{
            background: '#070b16',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            fontSize: '0.78rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: '2px', letterSpacing: '0.02em' }}>
              Password Security Rules:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLengthValid ? '#34d399' : '#64748b', fontWeight: isLengthValid ? 600 : 400 }}>
              {isLengthValid ? <Check size={14} color="#34d399" /> : <X size={14} />}
              8 to 16 characters in length
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasUppercase ? '#34d399' : '#64748b', fontWeight: hasUppercase ? 600 : 400 }}>
              {hasUppercase ? <Check size={14} color="#34d399" /> : <X size={14} />}
              At least one uppercase letter (A–Z)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasSpecial ? '#34d399' : '#64748b', fontWeight: hasSpecial ? 600 : 400 }}>
              {hasSpecial ? <Check size={14} color="#34d399" /> : <X size={14} />}
              At least one special character (!@#$%^&*...)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMatching ? '#34d399' : '#64748b', fontWeight: isMatching ? 600 : 400 }}>
              {isMatching ? <Check size={14} color="#34d399" /> : <X size={14} />}
              New password matches confirmation
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading} disabled={!isFormValid || loading} icon={ShieldCheck}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
