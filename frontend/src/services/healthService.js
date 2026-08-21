import api from './api';

export const healthService = {
  /**
   * Fetch backend system and database health diagnostics
   */
  checkHealth: async () => {
    return await api.get('/health');
  }
};
