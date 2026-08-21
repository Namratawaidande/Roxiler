import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Star, Store, User, LogOut, LogIn, UserPlus, Shield, ShoppingBag, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { Button } from './Button';
import { GlassIcon } from './GlassIcons';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isStoreOwner, isNormalUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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

  // Determine home link based on authentication state
  const getHomeLink = () => {
    if (!isAuthenticated) return '/';
    if (isAdmin) return '/admin';
    if (isStoreOwner) return '/owner';
    return '/stores';
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
        <Link to={getHomeLink()} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <GlassIcon icon={<Star size={18} fill="#fff" />} color="indigo" size="sm" style={{ pointerEvents: 'none' }} />
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              Store<span style={{ color: '#818cf8' }}>Rating</span>
            </div>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Authenticated Navigation Items */}
          {isAuthenticated ? (
            <>
              {/* SYSTEM ADMIN LINKS */}
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

              {/* STORE OWNER LINKS */}
              {isStoreOwner && (
                <>
                  <Link
                    to="/owner"
                    className={`btn btn-sm ${location.pathname === '/owner' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ color: location.pathname === '/owner' ? '#fff' : '#fbbf24', fontWeight: 600 }}
                  >
                    <Store size={14} /> Merchant Area
                  </Link>
                  <Link
                    to="/stores"
                    className={`btn btn-sm ${location.pathname === '/stores' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ color: location.pathname === '/stores' ? '#fff' : 'var(--text-muted)' }}
                  >
                    <ShoppingBag size={14} /> Stores Directory
                  </Link>
                </>
              )}

              {/* NORMAL USER LINKS */}
              {isNormalUser && (
                <>
                  <Link
                    to="/stores"
                    className={`btn btn-sm ${location.pathname === '/stores' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ color: location.pathname === '/stores' ? '#fff' : 'var(--text-muted)' }}
                  >
                    <ShoppingBag size={14} /> Stores
                  </Link>
                  <Link
                    to="/user"
                    className={`btn btn-sm ${location.pathname === '/user' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ color: location.pathname === '/user' ? '#fff' : '#34d399', fontWeight: 600 }}
                  >
                    <User size={14} /> My Ratings
                  </Link>
                </>
              )}

              {/* User Profile Pill & Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginLeft: '0.4rem',
                borderLeft: '1px solid var(--border-color)',
                paddingLeft: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {getRoleBadge(user?.role)}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                    {user?.name?.split(' ')[0] || user?.email}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPasswordModalOpen(true)}
                  title="Change Password"
                  icon={KeyRound}
                  radius={8}
                  style={{ padding: '0.4rem 0.6rem' }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={logout}
                  title="Logout"
                  icon={LogOut}
                  radius={8}
                  style={{ padding: '0.4rem 0.6rem' }}
                />
              </div>
            </>
          ) : (
            /* Unauthenticated Navigation: Clean Login & Register only */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Button
                variant={location.pathname === '/login' || location.pathname === '/' ? 'primary' : 'secondary'}
                size="sm"
                icon={LogIn}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant={location.pathname === '/register' ? 'primary' : 'secondary'}
                size="sm"
                icon={UserPlus}
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </div>
          )}
        </nav>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
};
