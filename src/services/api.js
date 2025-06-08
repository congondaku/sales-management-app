import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://evn92jcmry.us-east-1.awsapprunner.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    const salesToken = localStorage.getItem('salesToken');
    const token = adminToken || salesToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle actual authentication failures, not missing endpoints
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || '';

      // Only clear tokens if it's explicitly an auth/token error
      const isRealAuthError = errorMessage.toLowerCase().includes('token') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('authentication') ||
        error.response?.data?.error === 'TokenExpiredError';

      if (isRealAuthError) {
        console.log('🚪 Clearing tokens due to authentication error');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('salesToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');

        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
