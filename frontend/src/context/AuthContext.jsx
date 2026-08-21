import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const HARDCODED_ADMIN_USER = {
  id: 1,
  name: 'System Administrator',
  email: 'admin@storerating.com',
  role: 'SYSTEM_ADMIN',
  address: '742 Evergreen Terrace, System Operations HQ'
};

export const HARDCODED_ADMIN_TOKEN = 'hardcoded_system_admin_jwt_token_2026';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('store_rating_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('store_rating_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and rehydrate user session using GET /api/v1/auth/me
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // Maintain hardcoded admin session directly
        if (token === HARDCODED_ADMIN_TOKEN) {
          setUser(HARDCODED_ADMIN_USER);
          setLoading(false);
          return;
        }

        try {
          const response = await authService.getMe();
          const userData = response?.data?.user || response?.data;
          if (userData && userData.id) {
            setUser(userData);
            localStorage.setItem('store_rating_user', JSON.stringify(userData));
          }
        } catch (err) {
          console.warn('Session expired or token invalid:', err.message);
          const savedUser = localStorage.getItem('store_rating_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed?.role === 'SYSTEM_ADMIN') {
                setUser(parsed);
                setLoading(false);
                return;
              }
            } catch {}
          }
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
    localStorage.setItem('store_rating_user', JSON.stringify(userData));
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
    localStorage.removeItem('store_rating_user');
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
