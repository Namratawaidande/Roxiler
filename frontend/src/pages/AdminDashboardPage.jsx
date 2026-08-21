import React, { useState, useEffect } from 'react';
import { Shield, Users, Building, Star, BarChart3, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import api from '../services/api';

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/admin');
      if (response?.data?.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrator statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-primary">
              <Shield size={12} style={{ marginRight: '4px' }} /> SYSTEM_ADMIN AREA
            </span>
            <span className="badge badge-success">Active Session: {user?.name}</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>System Administrator Dashboard</h1>
          <p style={{ fontSize: '0.95rem' }}>Platform governance, analytics, and operational metrics.</p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchAdminStats}>
          Refresh Analytics
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Metrics Grid */}
      <div className="grid grid-4">
        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 600 }}>TOTAL USERS</span>
            <Users size={20} color="#818cf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.totalUsers ?? '...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Across all 3 system roles
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 600 }}>REGISTERED STORES</span>
            <Building size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.totalStores ?? '...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Verified merchant listings
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 600 }}>TOTAL RATINGS</span>
            <Star size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {stats?.totalRatings ?? '...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Submitted by verified Normal Users
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 600 }}>AVG PLATFORM SCORE</span>
            <BarChart3 size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            ⭐ {stats?.averagePlatformRating ? Number(stats.averagePlatformRating).toFixed(1) : '...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Global customer satisfaction
          </div>
        </div>
      </div>

      {/* Role Distribution Card */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>User Role Distribution</h2>
        <div className="grid grid-3">
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>SYSTEM_ADMIN</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#818cf8' }}>
              {stats?.roleDistribution?.SYSTEM_ADMIN ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Platform Administrators</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>STORE_OWNER</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>
              {stats?.roleDistribution?.STORE_OWNER ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Business Store Merchants</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>NORMAL_USER</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
              {stats?.roleDistribution?.NORMAL_USER ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Registered Customers & Reviewers</div>
          </div>
        </div>
      </div>
    </div>
  );
};
