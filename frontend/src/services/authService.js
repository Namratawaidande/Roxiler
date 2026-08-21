import api from './api';

export const authService = {
  /**
   * Log in user
   */
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  /**
   * Register new user
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
   * Get supported system roles
   */
  getRoles: async () => {
    return await api.get('/auth/roles');
  }
};
