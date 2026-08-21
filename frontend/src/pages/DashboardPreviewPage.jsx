import React, { useState, useEffect } from 'react';
import { Shield, Store, User, Star, TrendingUp, Users, Building, CheckCircle, BarChart3, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPreviewPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedRoleTab, setSelectedRoleTab] = useState(user?.role || 'SYSTEM_ADMIN');

  useEffect(() => {
    if (user?.role) {
      setSelectedRoleTab(user.role);
    }
  }, [user?.role]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-primary">Role-Based Dashboard Scaffolding</span>
            {isAuthenticated && (
              <span className="badge badge-success">Logged in as: {user?.name} ({user?.role})</span>
            )}
          </div>
          <h1 style={{ fontSize: '2rem' }}>Role Dashboards Preview</h1>
          <p style={{ fontSize: '0.95rem' }}>Explore the targeted interface and functionality built for each specific user role.</p>
        </div>

        {/* Role Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.9)',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          gap: '0.35rem'
        }}>
          <button
            onClick={() => setSelectedRoleTab('SYSTEM_ADMIN')}
            className={`btn btn-sm ${selectedRoleTab === 'SYSTEM_ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Shield size={13} /> Admin View
          </button>
          <button
            onClick={() => setSelectedRoleTab('STORE_OWNER')}
            className={`btn btn-sm ${selectedRoleTab === 'STORE_OWNER' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Store size={13} /> Owner View
          </button>
          <button
            onClick={() => setSelectedRoleTab('NORMAL_USER')}
            className={`btn btn-sm ${selectedRoleTab === 'NORMAL_USER' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <User size={13} /> Normal User View
          </button>
        </div>
      </div>

      {/* SYSTEM_ADMIN TAB */}
      {selectedRoleTab === 'SYSTEM_ADMIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-3">
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem' }}>Total Registered Users</span>
                <Users size={18} color="#818cf8" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>154</div>
              <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.3rem' }}>
                +12% new users this week
              </div>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem' }}>Total Stores Listed</span>
                <Building size={18} color="#06b6d4" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>42</div>
              <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '0.3rem' }}>
                38 active storefronts
              </div>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem' }}>Total Ratings Submitted</span>
                <Star size={18} color="#f59e0b" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>820</div>
              <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '0.3rem' }}>
                Avg Platform Score: 4.4 / 5.0
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Platform Users Management Foundation</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>ID</th>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Address</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)' }}>#1</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>System Administrator</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>admin@storerating.com</td>
                    <td style={{ padding: '0.75rem' }}><span className="badge badge-primary">SYSTEM_ADMIN</span></td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-subtle)' }}>HQ Suite 100</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)' }}>#2</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>Alice Storekeeper</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>owner@storerating.com</td>
                    <td style={{ padding: '0.75rem' }}><span className="badge badge-cyan">STORE_OWNER</span></td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-subtle)' }}>456 Merchant Blvd</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)' }}>#3</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>John Customer</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>user@storerating.com</td>
                    <td style={{ padding: '0.75rem' }}><span className="badge badge-success">NORMAL_USER</span></td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-subtle)' }}>789 Residential Park</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STORE_OWNER TAB */}
      {selectedRoleTab === 'STORE_OWNER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2">
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Store size={28} color="#06b6d4" />
                <div>
                  <h3 style={{ fontSize: '1.35rem' }}>Apex Digital & Electronics</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>101 Tech Avenue, Silicon Bay</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '1.25rem' }}>
                <div style={{ fontSize: '2.75rem', fontWeight: 800, color: '#f8fafc' }}>4.8</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', color: '#f59e0b', gap: '2px' }}>
                    <Star size={16} fill="#f59e0b" />
                    <Star size={16} fill="#f59e0b" />
                    <Star size={16} fill="#f59e0b" />
                    <Star size={16} fill="#f59e0b" />
                    <Star size={16} fill="#f59e0b" />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Based on 142 customer ratings</span>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Merchant Action Center</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                Store owners can modify their storefront info, respond to customer inquiries, and track rating distribution.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm">Edit Store Profile</button>
                <button className="btn btn-secondary btn-sm">Export Feedback CSV</button>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Recent Customer Reviews Received</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>John Customer</span>
                  <div style={{ display: 'flex', color: '#f59e0b' }}>
                    <Star size={14} fill="#f59e0b" /><Star size={14} fill="#f59e0b" /><Star size={14} fill="#f59e0b" /><Star size={14} fill="#f59e0b" /><Star size={14} fill="#f59e0b" />
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem' }}>"Outstanding customer experience and quick delivery of electronics!"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NORMAL_USER TAB */}
      {selectedRoleTab === 'NORMAL_USER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Discover & Rate Stores</h3>
              <span className="badge badge-success">2 Sample Stores Available</span>
            </div>

            <div className="grid-2">
              <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>Apex Digital & Electronics</h4>
                  <span className="badge badge-warning">★ 4.8</span>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  101 Tech Avenue, Silicon Bay
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-primary btn-sm">Submit / Modify Rating</button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>142 reviews</span>
                </div>
              </div>

              <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>Urban Gourmet Market</h4>
                  <span className="badge badge-warning">★ 4.6</span>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  220 Culinary Lane, Downtown
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-primary btn-sm">Submit / Modify Rating</button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>89 reviews</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
