import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Building,
  Star,
  BarChart3,
  RefreshCw,
  UserCheck,
  Store,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { ParticleCard } from '../components/common/MagicBento';
import api from '../services/api';

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'stores'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/admin');
      if (response?.data) {
        setDashboardData(response.data);
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

  const stats = dashboardData?.stats;
  const recentUsers = dashboardData?.recentUsers || [];
  const recentStores = dashboardData?.recentStores || [];

  const totalRatings = stats?.totalRatings || 0;
  const ratingDist = stats?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  const getPercentage = (count) => {
    if (!totalRatings || totalRatings === 0) return 0;
    return Math.round((count / totalRatings) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} /> SYSTEM_ADMIN AREA
            </span>
            <span className="badge badge-success">Admin: {user?.name}</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>System Administrator Dashboard</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={fetchAdminStats}>
            Refresh Analytics
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Primary KPI Statistics Grid */}
      <div className="grid grid-4">
        {/* Total Users */}
        <ParticleCard
          className="glass-card"
          glowColor="99, 102, 241"
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          enableBorderGlow={true}
          style={{ borderLeft: '4px solid #6366f1' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL USERS
            </span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <Users size={18} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc' }}>
            {loading ? '...' : stats?.totalUsers ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Across all 3 registered roles
          </div>
        </ParticleCard>

        {/* Total Stores */}
        <ParticleCard
          className="glass-card"
          glowColor="6, 182, 212"
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          enableBorderGlow={true}
          style={{ borderLeft: '4px solid #06b6d4' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL STORES
            </span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <Building size={18} color="#06b6d4" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc' }}>
            {loading ? '...' : stats?.totalStores ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Verified merchant store listings
          </div>
        </ParticleCard>

        {/* Total Ratings */}
        <ParticleCard
          className="glass-card"
          glowColor="16, 185, 129"
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          enableBorderGlow={true}
          style={{ borderLeft: '4px solid #10b981' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.05em' }}>
              SUBMITTED RATINGS
            </span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <Star size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc' }}>
            {loading ? '...' : stats?.totalRatings ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Submitted by verified normal users
          </div>
        </ParticleCard>

        {/* Average Platform Score */}
        <ParticleCard
          className="glass-card"
          glowColor="245, 158, 11"
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          enableBorderGlow={true}
          style={{ borderLeft: '4px solid #f59e0b' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 700, letterSpacing: '0.05em' }}>
              AVG PLATFORM SCORE
            </span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <BarChart3 size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Star size={24} fill="#fbbf24" />
            <span>{loading ? '...' : stats?.averagePlatformRating ? Number(stats.averagePlatformRating).toFixed(1) : '0.0'}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Platform customer satisfaction index
          </div>
        </ParticleCard>
      </div>

      {/* Admin Sub-Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        gap: '0.5rem',
        paddingBottom: '0.5rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Activity size={14} /> Analytics Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={14} /> User Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          className={`btn btn-sm ${activeTab === 'stores' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Store size={14} /> Store Management
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DISTRIBUTIONS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="grid grid-2">
            {/* Rating Distribution Breakdown */}
            <ParticleCard className="glass-card" glowColor="16, 185, 129" enableTilt={true} enableBorderGlow={true}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#10b981" /> Rating Distribution Breakdown
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDist[star] || 0;
                  const pct = getPercentage(count);
                  return (
                    <div key={star}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          {star} <Star size={12} fill="#fbbf24" color="#fbbf24" /> Stars
                        </span>
                        <span style={{ color: 'var(--text-subtle)' }}>
                          <strong>{count}</strong> ({pct}%)
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: star >= 4 ? 'linear-gradient(90deg, #10b981, #06b6d4)' : star === 3 ? '#f59e0b' : '#ef4444',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ParticleCard>

            {/* Role Breakdown Distribution */}
            <ParticleCard className="glass-card" glowColor="99, 102, 241" enableTilt={true} enableBorderGlow={true}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#818cf8" /> Platform Roles Breakdown
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span className="badge badge-primary">SYSTEM_ADMIN</span>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>System Administrators</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Platform configuration & user oversight</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>
                    {stats?.roleDistribution?.SYSTEM_ADMIN ?? 0}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span className="badge badge-warning">STORE_OWNER</span>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Store Merchants</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Store managers tracking reviews & ratings</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                    {stats?.roleDistribution?.STORE_OWNER ?? 0}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '0.9rem 1.1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span className="badge badge-success">NORMAL_USER</span>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Customer Accounts</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Active users browsing & rating stores</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                    {stats?.roleDistribution?.NORMAL_USER ?? 0}
                  </div>
                </div>
              </div>
            </ParticleCard>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT DIRECTORY */}
      {activeTab === 'users' && (
        <ParticleCard className="glass-card" glowColor="99, 102, 241" enableTilt={false} enableBorderGlow={true}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Users size={18} color="#818cf8" /> Recent Registered Platform Users
            </h2>
            <Link to="/admin/users" className="btn btn-primary btn-sm">
              <Users size={14} /> Open Full User Management & Filters
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-subtle)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Address</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#f8fafc' }}>{u.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-color)' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${
                        u.role === 'SYSTEM_ADMIN' ? 'badge-primary' : u.role === 'STORE_OWNER' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-subtle)' }}>{u.address || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-subtle)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ParticleCard>
      )}

      {/* TAB 3: STORE MANAGEMENT OVERSIGHT */}
      {activeTab === 'stores' && (
        <ParticleCard className="glass-card" glowColor="6, 182, 212" enableTilt={false} enableBorderGlow={true}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Store size={18} color="#06b6d4" /> Store Catalog Oversight ({recentStores.length})
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/admin/stores" className="btn btn-primary btn-sm">
                <Store size={14} /> Open Full Store Management
              </Link>
              <Link to="/stores" className="btn btn-secondary btn-sm">
                View Public Catalog
              </Link>
            </div>
          </div>

          <div className="grid grid-3">
            {recentStores.map((s) => (
              <ParticleCard
                key={s.id}
                glowColor="6, 182, 212"
                enableTilt={true}
                enableMagnetism={true}
                clickEffect={true}
                enableBorderGlow={true}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>{s.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                      <Star size={13} fill="#fbbf24" /> {s.averageRating ? Number(s.averageRating).toFixed(1) : 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-subtle)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <MapPin size={12} /> {s.address}
                  </div>
                  {s.owner_name && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Merchant: <strong style={{ color: '#e2e8f0' }}>{s.owner_name}</strong>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  Total Ratings: <strong>{s.ratingCount || 0}</strong>
                </div>
              </ParticleCard>
            ))}
          </div>
        </ParticleCard>
      )}
    </div>
  );
};
