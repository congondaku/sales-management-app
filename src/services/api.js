import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;

// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ ENHANCED: Support for both admin and sales person tokens
apiClient.interceptors.request.use(
  (config) => {
    // Check for admin token first
    const adminToken = localStorage.getItem('admin_token');
    const salesToken = localStorage.getItem('sales_token');
    
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (salesToken) {
      config.headers.Authorization = `Bearer ${salesToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ ENHANCED: Better error handling for different user types
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Determine which type of token expired
      const adminToken = localStorage.getItem('admin_token');
      const salesToken = localStorage.getItem('sales_token');
      
      if (adminToken) {
        // Admin token expired
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        
        // Only redirect if we're not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else if (salesToken) {
        // Sales person token expired
        localStorage.removeItem('sales_token');
        localStorage.removeItem('sales_person');
        
        // Redirect to sales login
        if (!window.location.pathname.includes('/sales-login')) {
          window.location.href = '/sales-login';
        }
      }
    }
    
    // ✅ ENHANCED: Better error messages
    if (error.response?.status === 403) {
      console.warn('Access denied:', error.response.data.message);
    }
    
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export const apiHelpers = {
  // Check if current user is admin
  isAdmin() {
    return !!localStorage.getItem('admin_token');
  },
  
  // Check if current user is sales person
  isSalesPerson() {
    return !!localStorage.getItem('sales_token');
  },
  
  // Get current user type
  getCurrentUserType() {
    if (this.isAdmin()) return 'admin';
    if (this.isSalesPerson()) return 'sales_person';
    return null;
  },
  
  // Clear all auth data
  clearAllAuth() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('sales_token');
    localStorage.removeItem('sales_person');
  }
};

export default apiClient;
