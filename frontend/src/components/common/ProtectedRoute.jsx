import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protected Route Wrapper Component
 * Enforces JWT authentication and seamlessly navigates users to their role-accessible area
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

  // 1. Unauthenticated -> Redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated, but accessing a route restricted to a different role -> Directly redirect to user's role-accessible area
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const roleDestination =
      user?.role === 'SYSTEM_ADMIN' ? '/admin' :
      user?.role === 'STORE_OWNER' ? '/owner' :
      '/stores';

    return <Navigate to={roleDestination} replace />;
  }

  return children;
};
