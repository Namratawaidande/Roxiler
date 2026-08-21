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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <KeyRound size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Change Password</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: 0 }}>
                Update your account password securely
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Current Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Current Password</label>
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
                style={{ paddingRight: '2.5rem' }}
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
                  color: 'var(--text-subtle)',
                  cursor: 'pointer'
                }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>New Password</label>
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
                style={{ paddingRight: '2.5rem' }}
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
                  color: 'var(--text-subtle)',
                  cursor: 'pointer'
                }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Confirm New Password</label>
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
                style={{ paddingRight: '2.5rem' }}
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
                  color: 'var(--text-subtle)',
                  cursor: 'pointer'
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Real-time Requirement Checklist */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '2px' }}>
              Password Security Rules:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLengthValid ? '#34d399' : 'var(--text-muted)' }}>
              {isLengthValid ? <Check size={13} color="#34d399" /> : <X size={13} />}
              8 to 16 characters in length
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUppercase ? '#34d399' : 'var(--text-muted)' }}>
              {hasUppercase ? <Check size={13} color="#34d399" /> : <X size={13} />}
              At least one uppercase letter (A–Z)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasSpecial ? '#34d399' : 'var(--text-muted)' }}>
              {hasSpecial ? <Check size={13} color="#34d399" /> : <X size={13} />}
              At least one special character (!@#$%^&*...)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isMatching ? '#34d399' : 'var(--text-muted)' }}>
              {isMatching ? <Check size={13} color="#34d399" /> : <X size={13} />}
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
