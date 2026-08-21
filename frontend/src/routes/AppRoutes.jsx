import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { RefreshCw } from 'lucide-react';

// Route-level code splitting for optimal bundle size and initial load performance
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const StoreListPage = lazy(() => import('../pages/StoreListPage').then((m) => ({ default: m.StoreListPage })));
const DashboardPreviewPage = lazy(() => import('../pages/DashboardPreviewPage').then((m) => ({ default: m.DashboardPreviewPage })));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminStoresPage = lazy(() => import('../pages/AdminStoresPage').then((m) => ({ default: m.AdminStoresPage })));
const StoreOwnerDashboardPage = lazy(() => import('../pages/StoreOwnerDashboardPage').then((m) => ({ default: m.StoreOwnerDashboardPage })));
const NormalUserDashboardPage = lazy(() => import('../pages/NormalUserDashboardPage').then((m) => ({ default: m.NormalUserDashboardPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Accessible loading fallback indicator
const RouteLoadingFallback = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#94A3B8'
  }}>
    <RefreshCw size={36} className="spin" style={{ color: '#6366F1' }} />
    <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading module...</span>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard-preview" element={<DashboardPreviewPage />} />

        {/* Authenticated Stores Route */}
        <Route
          path="/stores"
          element={
            <ProtectedRoute>
              <StoreListPage />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/stores"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
              <AdminStoresPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['STORE_OWNER']}>
              <StoreOwnerDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={['NORMAL_USER']}>
              <NormalUserDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
