import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  MapPin,
  Shield,
  Calendar,
  Store,
  Star,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Activity
} from 'lucide-react';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import api from '../../services/api';

export const UserDetailsModal = ({ user: initialUser, isOpen, onClose }) => {
  if (!isOpen || !initialUser) return null;

  const [detailedUser, setDetailedUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/users/${initialUser.id}`);
        if (res?.data?.user) {
          setDetailedUser(res.data.user);
        }
      } catch (err) {
        setError(err.message || 'Failed to load complete user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [initialUser.id]);

  const user = detailedUser || initialUser;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return <span className="badge badge-primary">SYSTEM_ADMIN</span>;
      case 'STORE_OWNER':
        return <span className="badge badge-warning">STORE_OWNER</span>;
      case 'NORMAL_USER':
      default:
        return <span className="badge badge-success">NORMAL_USER</span>;
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <User size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>User Profile Details</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: 0 }}>Account ID #{user.id} — Role: {user.role}</p>
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

        {/* Basic Account Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>FULL NAME</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>{user.name}</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>EMAIL ADDRESS</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>{user.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>ACCOUNT ROLE</div>
              <div>{getRoleBadge(user.role)}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} /> REGISTERED PHYSICAL ADDRESS
            </div>
            <div style={{ fontSize: '0.9rem', color: user.address ? '#f8fafc' : 'var(--text-subtle)' }}>
              {user.address || 'No physical address provided.'}
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: '0.75rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={12} /> REGISTRATION DATE
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={12} color="#34d399" /> SECURITY & CREDENTIALS
              </div>
              <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
                Bcrypt Hashed (Zero Leakage)
              </div>
            </div>
          </div>
        </div>

        {/* ----------------- ROLE-SPECIFIC SECTIONS ----------------- */}

        {/* 1. STORE_OWNER: Associated Stores & Rating Performance */}
        {user.role === 'STORE_OWNER' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Store size={16} /> Associated Store(s) & Rating Metrics ({user.stores?.length || 0})
              </div>
            </div>

            {loading ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', textAlign: 'center', padding: '1rem' }}>
                Loading store rating metrics...
              </div>
            ) : user.stores && user.stores.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {user.stores.map((store) => (
                  <div
                    key={store.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{store.name}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>{store.email}</div>
                      </div>
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: '#fbbf24',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        <Star size={13} fill="#fbbf24" />
                        {Number(store.averageRating || 0).toFixed(1)} / 5.0
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-subtle)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={11} /> {store.address}
                      </div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                        {store.ratingCount || 0} Total Reviews Received
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', textAlign: 'center', padding: '1rem' }}>
                No active store listings currently assigned to this merchant.
              </div>
            )}
          </div>
        )}

        {/* 2. NORMAL_USER: Rating & Review Activity */}
        {user.role === 'NORMAL_USER' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <Activity size={16} /> Customer Review Activity
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-subtle)' }}>Total Store Ratings Submitted:</span>
              <strong style={{ color: '#34d399', fontSize: '1.1rem' }}>
                {user.totalRatingsSubmitted ?? (user.submittedRatings?.length || 0)} Reviews
              </strong>
            </div>
          </div>
        )}

        {/* 3. SYSTEM_ADMIN: Administrative Privileges */}
        {user.role === 'SYSTEM_ADMIN' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Shield size={16} /> System Governance Privileges
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              This account holds unrestricted administrative access to manage users, verified stores, system settings, and platform statistics.
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button variant="secondary" onClick={onClose}>
            Close Profile
          </Button>
        </div>
      </div>
    </div>
  );
};
