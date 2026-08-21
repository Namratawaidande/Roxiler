import React, { useState } from 'react';
import { X, UserPlus, User, Mail, Lock, MapPin, Shield, Sparkles } from 'lucide-react';
import { InputField } from '../forms/InputField';
import { TextareaField } from '../forms/TextareaField';
import { PasswordStrengthMeter } from '../forms/PasswordStrengthMeter';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import api from '../../services/api';

export const AddUserModal = ({ isOpen, onClose, onUserCreated }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'NORMAL_USER'
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Live password validation
  const passwordLengthValid = formData.password.length >= 8 && formData.password.length <= 16;
  const passwordUpperValid = /[A-Z]/.test(formData.password);
  const passwordSpecialValid = /[!@#$%^&*(),.?":{}|<>_]/.test(formData.password);
  const isPasswordFullyValid = passwordLengthValid && passwordUpperValid && passwordSpecialValid;

  // Live name validation
  const nameLength = formData.name.trim().length;
  const isNameValid = nameLength >= 20 && nameLength <= 60;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleFillSample = (selectedRole) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const names = {
      NORMAL_USER: `Charles Xavier Montgomery ${randomSuffix}`,
      SYSTEM_ADMIN: `Eleanor Roosevelt Security ${randomSuffix}`,
      STORE_OWNER: `Arthur Merchant Pendelton ${randomSuffix}`
    };

    setFormData({
      name: names[selectedRole] || `Alexander Montgomery Wright ${randomSuffix}`,
      email: `user.${selectedRole.toLowerCase()}${randomSuffix}@example.com`,
      password: 'AdminSecurePass@12',
      address: '420 Commercial Avenue, Innovation Park, Metropolis',
      role: selectedRole
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isNameValid) {
      setError(`Full Name must be between 20 and 60 characters long (currently ${nameLength} chars).`);
      return;
    }

    if (!isPasswordFullyValid) {
      setError('Password must be 8-16 characters with at least one uppercase letter and one special character.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/users', formData);
      if (response?.data?.user) {
        setSuccessMsg(`User "${response.data.user.name}" (${response.data.user.role}) created successfully!`);
        setTimeout(() => {
          onUserCreated(response.data.user);
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Failed to create user. Please check your inputs.');
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
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <UserPlus size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Add New User</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: 0 }}>Create a new platform account with designated role</p>
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

        {/* 1-Click Fast Fill Role Buttons */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--border-color)',
          borderRadius: '10px',
          padding: '0.65rem 0.85rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={12} color="#f59e0b" /> Fast Auto-Fill by Role:
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleFillSample('NORMAL_USER')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              + Normal User
            </button>
            <button
              type="button"
              onClick={() => handleFillSample('SYSTEM_ADMIN')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              + System Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillSample('STORE_OWNER')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              + Store Owner
            </button>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMsg && <Alert type="success" message={successMsg} />}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <InputField
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Alexander Montgomery Wright"
            icon={User}
            minLength={20}
            maxLength={60}
            showCharCount={true}
            hint="Must be between 20 and 60 characters long."
            required
          />

          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            icon={Mail}
            required
          />

          {/* Role Selection Dropdown */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={14} /> Assigned Role <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              name="role"
              className="form-input"
              value={formData.role}
              onChange={handleChange}
              required
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)' }}
            >
              <option value="NORMAL_USER">NORMAL_USER (Standard Customer & Reviewer)</option>
              <option value="SYSTEM_ADMIN">SYSTEM_ADMIN (Platform Administrator)</option>
              <option value="STORE_OWNER">STORE_OWNER (Merchant Store Manager)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <InputField
              label="Temporary / Initial Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8 to 16 characters"
              icon={Lock}
              maxLength={16}
              required
            />
            <PasswordStrengthMeter password={formData.password} />
          </div>

          <TextareaField
            label="Address (Optional)"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 742 Evergreen Terrace, Springfield"
            icon={MapPin}
            maxLength={400}
            rows={2}
          />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} style={{ flex: 2 }}>
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
