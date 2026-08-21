import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star, ShieldCheck, Store, User, LogOut, LayoutDashboard, LogIn, UserPlus, Shield, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { healthService } from '../../services/healthService';
import { StatusBadge } from './StatusBadge';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isStoreOwner, isNormalUser } = useAuth();
  const location = useLocation();

  const [healthStatus, setHealthStatus] = useState({
    isOnline: false,
    dbConnected: false,
    latency: null,
    isChecking: true
  });

  const checkStatus = async () => {
    const startTime = performance.now();
    try {
      const res = await healthService.checkHealth();
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      setHealthStatus({
        isOnline: res?.success === true,
        dbConnected: res?.data?.database?.connected || false,
        latency,
        isChecking: false
      });
    } catch {
      setHealthStatus({
        isOnline: false,
        dbConnected: false,
        latency: null,
        isChecking: false
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return (
          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} /> Admin
          </span>
        );
      case 'STORE_OWNER':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Store size={12} /> Owner
          </span>
        );
      case 'NORMAL_USER':
      default:
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} /> Customer
          </span>
        );
    }
  };

  return (
    <header style={{
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
          }}>
            <Star size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              Store<span style={{ color: '#818cf8' }}>Rating</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Full-Stack Platform v1.0
            </div>
          </div>
        </Link>

        {/* Live Backend Connection Indicator */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <StatusBadge
            isOnline={healthStatus.isOnline}
            latency={healthStatus.latency}
            dbConnected={healthStatus.dbConnected}
            isChecking={healthStatus.isChecking}
          />
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Link
            to="/stores"
            className={`btn btn-sm ${location.pathname === '/stores' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ color: location.pathname === '/stores' ? '#fff' : 'var(--text-muted)' }}
          >
            <ShoppingBag size={14} /> Stores
          </Link>

          <Link
            to="/dashboard-preview"
            className={`btn btn-sm ${location.pathname === '/dashboard-preview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ color: location.pathname === '/dashboard-preview' ? '#fff' : 'var(--text-muted)' }}
          >
            <LayoutDashboard size={14} /> Roles Overview
          </Link>

          {/* Role Dedicated Links */}
          {isAuthenticated && (
            <>
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className={`btn btn-sm ${location.pathname === '/admin' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ color: location.pathname === '/admin' ? '#fff' : '#818cf8', fontWeight: 600 }}
                  >
                    <Shield size={14} /> Admin Hub
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`btn btn-sm ${location.pathname === '/admin/users' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ color: location.pathname === '/admin/users' ? '#fff' : '#818cf8', fontWeight: 600 }}
                  >
                    <User size={14} /> Users
                  </Link>
                  <Link
                    to="/admin/stores"
                    className={`btn btn-sm ${location.pathname === '/admin/stores' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ color: location.pathname === '/admin/stores' ? '#fff' : '#818cf8', fontWeight: 600 }}
                  >
                    <Store size={14} /> Stores
                  </Link>
                </>
              )}

              {isStoreOwner && (
                <Link
                  to="/owner"
                  className={`btn btn-sm ${location.pathname === '/owner' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ color: location.pathname === '/owner' ? '#fff' : '#fbbf24', fontWeight: 600 }}
                >
                  <Store size={14} /> Merchant Area
                </Link>
              )}

              {isNormalUser && (
                <Link
                  to="/user"
                  className={`btn btn-sm ${location.pathname === '/user' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ color: location.pathname === '/user' ? '#fff' : '#34d399', fontWeight: 600 }}
                >
                  <User size={14} /> My Ratings
                </Link>
              )}
            </>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginLeft: '0.4rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {getRoleBadge(user?.role)}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  {user?.name?.split(' ')[0] || user?.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Logout"
                style={{ padding: '0.35rem 0.65rem' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.4rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={14} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={14} /> Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
