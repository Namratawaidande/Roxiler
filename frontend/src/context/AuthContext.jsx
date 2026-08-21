import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('store_rating_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and rehydrate user session using GET /api/v1/auth/me
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authService.getMe();
          const userData = response?.data?.user || response?.data;
          if (userData && userData.id) {
            setUser(userData);
          }
        } catch (err) {
          console.warn('Session expired or token invalid. Clearing session:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('store_rating_token', authToken);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('store_rating_token');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'SYSTEM_ADMIN',
    isStoreOwner: user?.role === 'STORE_OWNER',
    isNormalUser: user?.role === 'NORMAL_USER',
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
