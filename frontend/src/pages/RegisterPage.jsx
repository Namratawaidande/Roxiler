import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Mail, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { InputField } from '../components/forms/InputField';
import { TextareaField } from '../components/forms/TextareaField';
import { PasswordStrengthMeter } from '../components/forms/PasswordStrengthMeter';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { ParticleCard } from '../components/common/MagicBento';

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

  // Live password validation
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
      name: 'Alexander Montgomery Wright',
      email: `alex.wright${randomSuffix}@example.com`,
      password: 'SecureUser@123',
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
      setError(`Full Name must be between 20 and 60 characters long (currently ${nameLength} characters).`);
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
        setSuccessMsg('Normal User account registered successfully! Redirecting...');
        setTimeout(() => {
          navigate('/user', { replace: true });
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
      <ParticleCard
        className="glass-card"
        glowColor="16, 185, 129"
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        enableBorderGlow={true}
      >
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
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* Success Alert */}
        {successMsg && <Alert type="success" message={successMsg} />}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <InputField
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Alexander Montgomery Wright"
            icon={User}
            required
            autoComplete="name"
            helperText={`${nameLength}/60 characters (Minimum 20 characters required)`}
            hasError={nameLength > 0 && !isNameValid}
          />

          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="alex.wright@example.com"
            icon={Mail}
            required
            autoComplete="email"
          />

          <div>
            <InputField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              icon={Lock}
              required
              autoComplete="new-password"
              hasError={formData.password.length > 0 && !isPasswordFullyValid}
            />

            {/* Visual Password Strength & Constraint Checklist */}
            <div style={{ marginTop: '0.5rem' }}>
              <PasswordStrengthMeter password={formData.password} />
            </div>
          </div>

          <TextareaField
            label="Physical Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 742 Evergreen Terrace, Sector 4, Springfield"
            icon={MapPin}
            maxLength={400}
            rows={2}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            Complete Registration
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>
            Sign In with Existing Account
          </Link>
        </div>
      </ParticleCard>
    </div>
  );
};
