import axios from 'axios';

// Get API base URL from Vite environment variables with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('store_rating_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global API Errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'Network communication error',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || null,
      raw: error
    };

    // If unauthorized, optional token clearing
    if (error.response?.status === 401) {
      // Don't auto-redirect immediately during health checks
    }

    return Promise.reject(customError);
  }
);

export default api;
