import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Server,
  Database,
  Shield,
  Key,
  Users,
  Store,
  Star,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Code,
  Layers,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { healthService } from '../services/healthService';
import api from '../services/api';

export const HomePage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pingLatency, setPingLatency] = useState(null);

  // API Explorer State
  const [activeEndpoint, setActiveEndpoint] = useState('/health');
  const [endpointMethod, setEndpointMethod] = useState('GET');
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const data = await healthService.checkHealth();
      const end = performance.now();
      setPingLatency(Math.round(end - start));
      setHealth(data?.data);
      if (!apiResponse) {
        setApiResponse(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to reach Express backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const testEndpoint = async (url, method = 'GET') => {
    setActiveEndpoint(url);
    setEndpointMethod(method);
    setApiLoading(true);
    try {
      const res = await api({ url, method });
      setApiResponse(res);
    } catch (err) {
      setApiResponse(err);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero Section */}
      <section className="glass-card" style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 27, 75, 0.5) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '3rem 2.5rem'
      }}>
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="badge badge-primary">
              <Code size={12} /> Foundation Phase Active
            </span>
            <span className="badge badge-cyan">
              <Layers size={12} /> Full-Stack Architecture
            </span>
          </div>

          <h1 style={{
            fontSize: '2.75rem',
            lineHeight: 1.15,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Store Rating Platform Foundation
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            A production-ready full-stack foundation built with <strong style={{ color: '#fff' }}>React.js</strong>, <strong style={{ color: '#fff' }}>Express.js</strong>, <strong style={{ color: '#fff' }}>PostgreSQL</strong>, and <strong style={{ color: '#fff' }}>JWT Authentication</strong> with Role-Based Access Control.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={fetchHealth} className="btn btn-primary" disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              {loading ? 'Testing Connection...' : 'Re-test Backend Connection'}
            </button>
            <Link to="/dashboard-preview" className="btn btn-secondary">
              View Role Previews <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Real-time System Connectivity Status Grid */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>Live System Diagnostics</h2>
            <p style={{ fontSize: '0.9rem' }}>Real-time communication status between React client and Express API server.</p>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
            Client: {window.location.origin}
          </span>
        </div>

        <div className="grid-4">
          {/* Card 1: Express Server Status */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Backend Server</span>
              <Server size={18} color="#818cf8" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className={`status-dot ${health?.status === 'ONLINE' ? 'online' : 'offline'}`}></span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {health?.status || (loading ? 'Checking...' : 'OFFLINE')}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              Port: 5000 | Latency: {pingLatency ? `${pingLatency}ms` : '--'}
            </div>
          </div>

          {/* Card 2: Database Status */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Database Layer</span>
              <Database size={18} color="#06b6d4" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className={`status-dot ${health?.database?.connected ? 'online' : 'connecting'}`}></span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                {health?.database?.connected ? 'Connected' : 'Configured'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              PostgreSQL | Pool Ready
            </div>
          </div>

          {/* Card 3: Auth Security */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Auth & Cryptography</span>
              <Shield size={18} color="#10b981" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="status-dot online"></span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                JWT + Bcrypt
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              10 Salt Rounds | 7-day Token
            </div>
          </div>

          {/* Card 4: Architecture Mode */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Environment</span>
              <Activity size={18} color="#f59e0b" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                {health?.environment || 'development'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              Uptime: {health?.uptime || 'N/A'}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive API Explorer & Endpoint Tester */}
      <section className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={20} color="#818cf8" />
              <h2 style={{ fontSize: '1.35rem' }}>Interactive API Explorer</h2>
            </div>
            <p style={{ fontSize: '0.875rem' }}>Click any endpoint below to verify live React-to-Express HTTP communication.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => testEndpoint('/health')}
              className={`btn btn-sm ${activeEndpoint === '/health' ? 'btn-primary' : 'btn-secondary'}`}
            >
              GET /health
            </button>
            <button
              onClick={() => testEndpoint('/auth/roles')}
              className={`btn btn-sm ${activeEndpoint === '/auth/roles' ? 'btn-primary' : 'btn-secondary'}`}
            >
              GET /auth/roles
            </button>
            <button
              onClick={() => testEndpoint('/stores')}
              className={`btn btn-sm ${activeEndpoint === '/stores' ? 'btn-primary' : 'btn-secondary'}`}
            >
              GET /stores
            </button>
            <button
              onClick={() => testEndpoint('/ratings/store/1')}
              className={`btn btn-sm ${activeEndpoint === '/ratings/store/1' ? 'btn-primary' : 'btn-secondary'}`}
            >
              GET /ratings/store/1
            </button>
          </div>
        </div>

        {/* Console Display */}
        <div style={{ background: '#05070f', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{endpointMethod}</span>
              <span style={{ color: '#e2e8f0' }}>http://localhost:5000/api/v1{activeEndpoint}</span>
            </div>
            <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
              {apiLoading ? 'Fetching...' : 'HTTP 200 OK'}
            </span>
          </div>

          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.825rem',
            color: '#38bdf8',
            maxHeight: '260px',
            overflowY: 'auto',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      </section>

      {/* User Roles & Permissions Foundation Matrix */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>User Roles & Architecture Matrix</h2>
          <p style={{ fontSize: '0.9rem' }}>Three core roles designed with strict Role-Based Access Control (RBAC).</p>
        </div>

        <div className="grid-3">
          {/* Role 1: SYSTEM_ADMIN */}
          <div className="glass-card" style={{ borderTop: '3px solid #6366f1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                <Shield size={20} color="#818cf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>SYSTEM_ADMIN</h3>
                <span className="badge badge-primary">Platform Administrator</span>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              Full administrative privileges to monitor platform statistics, oversee all registered users, manage store listings, and enforce moderation.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> Total Users & Stores Analytics
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> User Account Management
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> System-wide Store Moderation
              </li>
            </ul>
          </div>

          {/* Role 2: STORE_OWNER */}
          <div className="glass-card" style={{ borderTop: '3px solid #06b6d4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                <Store size={20} color="#06b6d4" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>STORE_OWNER</h3>
                <span className="badge badge-cyan">Merchant / Partner</span>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              Store merchants can manage their store information, monitor customer reviews, track average ratings, and inspect feedback trends.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#06b6d4" /> Store Profile Management
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#06b6d4" /> Real-time Average Rating Score
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#06b6d4" /> Review Stream & Feedback Analysis
              </li>
            </ul>
          </div>

          {/* Role 3: NORMAL_USER */}
          <div className="glass-card" style={{ borderTop: '3px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                <Star size={20} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>NORMAL_USER</h3>
                <span className="badge badge-success">Customer</span>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              Registered customers can discover registered stores, search & sort listings, and submit or modify individual 1–5 star ratings and reviews.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> Explore & Filter Stores
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> Submit 1–5 Star Ratings
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#10b981" /> Modify Personal Ratings Anytime
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
