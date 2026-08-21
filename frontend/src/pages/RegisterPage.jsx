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
import { GlassIcon } from '../components/common/GlassIcons';

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
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      name: `Demo User ${randomNum} Platform`,
      email: `customer${randomNum}@example.com`,
      password: 'User@123456',
      address: '742 Evergreen Terrace, Sector 4, Silicon Valley'
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await authService.register(formData);
      if (response?.data?.token && response?.data?.user) {
        setSuccessMsg('Account registered successfully! Logging you in...');
        login(response.data.user, response.data.token);

        setTimeout(() => {
          navigate('/stores', { replace: true });
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <GlassIcon icon={<UserPlus size={22} />} color="green" size="lg" label="Register" />
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
            autoComplete="name"
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
            autoComplete="email"
          />

          <div style={{ marginBottom: '1.25rem' }}>
            <InputField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8 to 16 characters"
              icon={Lock}
              maxLength={16}
              required
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={formData.password} />
          </div>

          <TextareaField
            label="Address (Optional)"
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
      </div>
    </div>
  );
};
