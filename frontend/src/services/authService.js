import api from './api';

export const authService = {
  /**
   * Unified login for SYSTEM_ADMIN, STORE_OWNER, and NORMAL_USER
   */
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  /**
   * Register a new user account
   */
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  /**
   * Get current authenticated user profile
   */
  getMe: async () => {
    return await api.get('/auth/me');
  },

  /**
   * Logout session
   */
  logout: async () => {
    try {
      return await api.post('/auth/logout');
    } catch {
      // Allow local logout even if network request fails
      return { success: true };
    }
  },

  /**
   * Update authenticated user's password
   */
  updatePassword: async (passwordData) => {
    return await api.put('/auth/password', passwordData);
  },

  /**
   * Get supported system roles
   */
  getRoles: async () => {
    return await api.get('/auth/roles');
  }
};
