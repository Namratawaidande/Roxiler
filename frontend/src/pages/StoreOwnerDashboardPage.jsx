import React, { useState, useEffect } from 'react';
import { Store, Star, MapPin, MessageSquare, PlusCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import api from '../services/api';

export const StoreOwnerDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ myStores: [], recentReviews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOwnerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/owner');
      if (response?.data) {
        setData({
          myStores: response.data.myStores || [],
          recentReviews: response.data.recentReviews || []
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load merchant data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-warning">
              <Store size={12} style={{ marginRight: '4px' }} /> STORE_OWNER AREA
            </span>
            <span className="badge badge-success">Merchant: {user?.name}</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Store Merchant Dashboard</h1>
          <p style={{ fontSize: '0.95rem' }}>Manage your stores, monitor customer feedback, and analyze average ratings.</p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchOwnerData}>
          Refresh Merchant Data
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Owned Stores List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem' }}>My Stores ({data.myStores.length})</h2>
        </div>

        <div className="grid grid-2">
          {data.myStores.map((store) => (
            <div key={store.id} className="glass-card" style={{ borderLeft: '4px solid #06b6d4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{store.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245, 158, 11, 0.15)', padding: '0.3rem 0.6rem', borderRadius: '8px', color: '#fbbf24', fontWeight: 700 }}>
                  <Star size={14} fill="#fbbf24" />
                  <span>{store.averageRating ? Number(store.averageRating).toFixed(1) : 'N/A'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-subtle)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <MapPin size={14} />
                <span>{store.address}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                <span>Total Reviews: <strong>{store.ratingCount || 0}</strong></span>
                <span>Contact: <strong>{store.email}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Feedback Feed */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="#818cf8" /> Recent Customer Reviews Received
        </h2>

        {data.recentReviews.length === 0 ? (
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.9rem' }}>No customer reviews recorded yet for your stores.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.recentReviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{rev.userName || 'Customer'}</span>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>reviewed {rev.storeName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Star size={13} fill="#fbbf24" /> {rev.rating} / 5
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-color)', margin: 0 }}>"{rev.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
