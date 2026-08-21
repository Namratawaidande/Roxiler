import React, { useState, useEffect } from 'react';
import { X, Store, Building, Mail, MapPin, User, Sparkles } from 'lucide-react';
import { InputField } from '../forms/InputField';
import { TextareaField } from '../forms/TextareaField';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import api from '../../services/api';

export const AddStoreModal = ({ isOpen, onClose, onStoreCreated }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    owner_id: ''
  });

  const [storeOwners, setStoreOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch verified STORE_OWNER accounts for selection
  useEffect(() => {
    const fetchOwners = async () => {
      setLoadingOwners(true);
      try {
        const res = await api.get('/users', { params: { role: 'STORE_OWNER', limit: 50 } });
        if (res?.data?.users) {
          setStoreOwners(res.data.users);
          if (res.data.users.length > 0) {
            setFormData((prev) => ({ ...prev, owner_id: String(res.data.users[0].id) }));
          }
        }
      } catch (err) {
        // Fallback default owners
        setStoreOwners([
          { id: 2, name: 'Alice Storekeeper', email: 'owner1@storerating.com' },
          { id: 3, name: 'Marcus Vance', email: 'owner2@storerating.com' }
        ]);
        setFormData((prev) => ({ ...prev, owner_id: '2' }));
      } finally {
        setLoadingOwners(false);
      }
    };

    fetchOwners();
  }, []);

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

  const handleFillSample = () => {
    const randId = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: `Quantum Tech Innovations & Electronics ${randId}`,
      email: `contact.quantum${randId}@quantumtech.com`,
      address: '880 Innovation Parkway, Silicon Bay District Suite 400',
      owner_id: storeOwners.length > 0 ? String(storeOwners[0].id) : '2'
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isNameValid) {
      setError(`Store Name must be between 20 and 60 characters long (currently ${nameLength} chars).`);
      return;
    }

    if (!formData.owner_id) {
      setError('Please select a verified Store Owner to manage this store listing.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        address: formData.address.trim(),
        owner_id: parseInt(formData.owner_id, 10)
      };

      const response = await api.post('/stores', payload);
      if (response?.data?.store) {
        setSuccessMsg(`Store "${response.data.store.name}" registered successfully!`);
        setTimeout(() => {
          onStoreCreated(response.data.store);
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Failed to create store. Please check your inputs.');
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <Store size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Add New Store</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: 0 }}>Register a verified merchant store on the platform</p>
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

        {/* 1-Click Fast Fill Button */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--border-color)',
          borderRadius: '10px',
          padding: '0.65rem 0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={12} color="#06b6d4" /> Auto-fill with compliant sample store data
          </div>
          <button
            type="button"
            onClick={handleFillSample}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            Fill Sample Store
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMsg && <Alert type="success" message={successMsg} />}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <InputField
            label="Store Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Apex Digital & Electronics Flagship"
            icon={Building}
            minLength={20}
            maxLength={60}
            showCharCount={true}
            hint="Must be between 20 and 60 characters long."
            required
          />

          <InputField
            label="Store Contact Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contact@storedomain.com"
            icon={Mail}
            required
          />

          {/* Store Owner Selection Dropdown */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={14} /> Assigned Store Owner <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              name="owner_id"
              className="form-input"
              value={formData.owner_id}
              onChange={handleChange}
              required
              style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)' }}
              disabled={loadingOwners}
            >
              {storeOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.email}) — [STORE_OWNER #{owner.id}]
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
              Only verified users with role STORE_OWNER are permitted to manage store listings.
            </div>
          </div>

          <TextareaField
            label="Store Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 101 Tech Avenue, Silicon Bay, CA 94025"
            icon={MapPin}
            maxLength={400}
            rows={2}
            required
          />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} style={{ flex: 2 }}>
              Create Store Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
