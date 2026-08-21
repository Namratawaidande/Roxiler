import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Star, Store, MapPin, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import api from '../services/api';

export const NormalUserDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ totalRatingsSubmitted: 0, myRatings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/user');
      if (response?.data) {
        setData({
          totalRatingsSubmitted: response.data.totalRatingsSubmitted || 0,
          myRatings: response.data.myRatings || []
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load user dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDashboard();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-success">
              <User size={12} style={{ marginRight: '4px' }} /> NORMAL_USER AREA
            </span>
            <span className="badge badge-primary">Customer Account: {user?.name}</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Customer Ratings & Feedback Hub</h1>
          <p style={{ fontSize: '0.95rem' }}>View your submitted store reviews, browse stores, and manage your ratings.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/stores" className="btn btn-primary btn-sm">
            <Store size={14} /> Explore Stores
          </Link>
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchUserDashboard}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Summary Cards */}
      <div className="grid grid-3">
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: '0.5rem' }}>
            REVIEWS SUBMITTED
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#34d399' }}>
            {data.totalRatingsSubmitted}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Stores you have evaluated
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: '0.5rem' }}>
            ACCOUNT EMAIL
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Registered Normal User Profile
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: '0.5rem' }}>
            MY REGISTERED ADDRESS
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
            {user?.address || 'No address provided'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Profile delivery & contact address
          </div>
        </div>
      </div>

      {/* My Submitted Reviews */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="#10b981" /> My Store Ratings History
        </h2>

        {data.myRatings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: 'var(--text-subtle)', marginBottom: '1rem' }}>
              You have not submitted any store ratings yet. Explore our verified stores and share your feedback!
            </p>
            <Link to="/stores" className="btn btn-primary btn-sm">
              <Store size={14} /> Browse Stores Catalog
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.myRatings.map((rating) => (
              <div
                key={rating.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>
                    {rating.storeName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontWeight: 700 }}>
                    <Star size={14} fill="#fbbf24" /> {rating.rating} / 5 Stars
                  </div>
                </div>
                {rating.storeAddress && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-subtle)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <MapPin size={12} /> {rating.storeAddress}
                  </div>
                )}
                {rating.comment && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-color)', margin: 0, fontStyle: 'italic' }}>
                    "{rating.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
