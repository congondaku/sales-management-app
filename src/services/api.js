// apiClient.js - Fixed version
import axios from 'axios';

// ✅ FORCE the deployed URL - don't rely on env variables that might not be set
const API_BASE_URL = 'https://evn92jcmry.us-east-1.awsapprunner.com/api';
const API_TIMEOUT = 10000;

console.log('🔧 API Base URL:', API_BASE_URL); // Debug log

// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add request interceptor to log requests for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    
    // Check for admin token first
    const adminToken = localStorage.getItem('admin_token');
    const salesToken = localStorage.getItem('sales_token');
    
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      console.log('🔑 Using admin token');
    } else if (salesToken) {
      config.headers.Authorization = `Bearer ${salesToken}`;
      console.log('🔑 Using sales token');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ Enhanced response interceptor with better logging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      fullUrl: error.config ? error.config.baseURL + error.config.url : 'Unknown URL'
    });
    
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
  },
  
  // ✅ Test API connectivity
  async testConnection() {
    try {
      console.log('🧪 Testing API connection to:', API_BASE_URL);
      const response = await apiClient.get('/health'); // or any basic endpoint
      console.log('✅ API Connection successful:', response.status);
      return true;
    } catch (error) {
      console.error('❌ API Connection failed:', error.message);
      return false;
    }
  }
};

export default apiClient;
