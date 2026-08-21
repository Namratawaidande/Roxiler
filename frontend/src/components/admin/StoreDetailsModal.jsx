import React from 'react';
import { X, Store, Mail, MapPin, User, Star, Calendar, Award } from 'lucide-react';
import { Button } from '../common/Button';

export const StoreDetailsModal = ({ store, isOpen, onClose }) => {
  if (!isOpen || !store) return null;

  const avgRating = store.averageRating ?? store.overall_rating ?? 0.0;
  const ratingCount = store.ratingCount ?? 0;

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
        maxWidth: '520px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              padding: '8px',
              borderRadius: '10px'
            }}>
              <Store size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Store Profile Details</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: 0 }}>Store Listing #{store.id}</p>
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

        {/* Profile Attributes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>STORE NAME</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>{store.name}</div>
          </div>

          <div className="grid grid-2" style={{ gap: '0.75rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Mail size={12} /> STORE CONTACT EMAIL
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', wordBreak: 'break-all' }}>{store.email}</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={12} /> STORE OWNER
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8' }}>
                {store.owner_name || `Owner #${store.owner_id || 'N/A'}`}
              </div>
            </div>
          </div>

          {/* Rating Summary Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)',
            padding: '0.85rem 1.1rem',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Award size={14} /> DYNAMIC OVERALL RATING
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= Math.round(avgRating) ? '#fbbf24' : 'none'}
                      color="#fbbf24"
                    />
                  ))}
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                  {Number(avgRating).toFixed(1)}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                {ratingCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Total Reviews</div>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} /> STORE PHYSICAL LOCATION
            </div>
            <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
              {store.address}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={12} /> LISTING REGISTRATION DATE
            </div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
              {store.created_at ? new Date(store.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
