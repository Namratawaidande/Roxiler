import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Protected Route Wrapper Component
 * Enforces JWT authentication and Role-Based Access Control (RBAC) on frontend routes
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if permitted
 * @param {Array<string>} props.allowedRoles - Optional list of allowed roles (e.g. ['SYSTEM_ADMIN'])
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="badge badge-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
          <span className="status-dot connecting" style={{ marginRight: '8px' }}></span>
          Verifying session credentials...
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Redirect to unified login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated, but role is restricted
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ maxWidth: '520px', margin: '3rem auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid #ef4444' }}>
          <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#f8fafc' }}>Access Restricted</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Your account role <span className="badge badge-warning">{user?.role}</span> is not authorized to access this page.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/dashboard-preview" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Go to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
