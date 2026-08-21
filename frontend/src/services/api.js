import axios from 'axios';

// Get API base URL from Vite environment variables with production fallback
const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '/api/v1'
    : 'http://localhost:5000/api/v1');

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

    // Handle 401 Unauthorized token expiry
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
      
      if (!isAuthAttempt && typeof window !== 'undefined') {
        const currentToken = localStorage.getItem('store_rating_token');
        if (currentToken) {
          localStorage.removeItem('store_rating_token');
          // If on a protected page, navigate to login with session expired notice
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login?expired=true';
          }
        }
      }
    }

    return Promise.reject(customError);
  }
);

export default api;
