import axios from 'axios';


const API_BASE_URL = 'https://nd-ca63c97939154afda89f1e74f48e5d0d.ecs.us-east-1.on.aws/api';
// const API_BASE_URL = 'http://localhost:5003/api';
const API_TIMEOUT = 15000;

console.log('🔧 API Configuration:', {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  environment: process.env.NODE_ENV
});


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

apiClient.interceptors.request.use(
  (config) => {
    const startTime = Date.now();
    config.metadata = { startTime };
    
    const isFormData = config.data instanceof FormData;
    
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: config.baseURL + config.url,
      timestamp: new Date().toISOString(),
      hasFiles: isFormData,
      dataType: isFormData ? 'FormData' : typeof config.data
    });
    
    if (isFormData) {
      // For FormData, DON'T set Content-Type
      // Browser will automatically set: multipart/form-data; boundary=...
      console.log('📦 Uploading files - Content-Type will be auto-set by browser');
      
      // Remove Content-Type if it was accidentally set
      delete config.headers['Content-Type'];
    } else {
      // For regular JSON requests
      config.headers['Content-Type'] = 'application/json';
      console.log('📝 Content-Type: application/json');
    }
    
    // Token management with priority order
    const adminToken = localStorage.getItem('admin_token');
    const salesToken = localStorage.getItem('sales_token');
    
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (salesToken) {
      config.headers.Authorization = `Bearer ${salesToken}`;
    } else {
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const endTime = Date.now();
    const duration = endTime - (response.config.metadata?.startTime || endTime);
    
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(response.data).length
    });
    
    // Log slow requests
    if (duration > 3000) {
      console.warn('🐌 Slow API response:', {
        url: response.config.url,
        duration: `${duration}ms`
      });
    }
    
    return response;
  },
  (error) => {
    const endTime = Date.now();
    const duration = endTime - (error.config?.metadata?.startTime || endTime);
    
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      duration: `${duration}ms`,
      fullUrl: error.config ? error.config.baseURL + error.config.url : 'Unknown URL'
    });
    
    // Handle different error types
    if (error.response?.status === 401) {
      handleAuthError();
    } else if (error.response?.status === 403) {
      console.warn('Forbidden - Insufficient permissions');
    } else if (error.response?.status === 429) {
      console.warn('Rate limited - Too many requests');
    } else if (error.response?.status >= 500) {
      console.error('Server error - Backend issue');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Check internet connection');
    }
    
    return Promise.reject(error);
  }
);

function handleAuthError() {
  console.log('🔓 Authentication error - cleaning up tokens');
  
  // Determine which type of token expired
  const adminToken = localStorage.getItem('admin_token');
  const salesToken = localStorage.getItem('sales_token');
  
  if (adminToken) {
    // Admin token expired
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Only redirect if we're not already on login page
    if (!window.location.pathname.includes('/login')) {
      console.log('Redirecting to admin login');
      window.location.href = '/login';
    }
  } else if (salesToken) {
    // Sales person token expired
    localStorage.removeItem('sales_token');
    localStorage.removeItem('sales_person');
    
    // Redirect to sales login
    if (!window.location.pathname.includes('/sales-login')) {
      console.log('Redirecting to sales login');
      window.location.href = '/sales-login';
    }
  }
}

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
    console.log('🧹 Clearing all authentication data');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('sales_token');
    localStorage.removeItem('sales_person');
  },
  
  async testConnection() {
    try {
      console.log('Testing API connection to:', API_BASE_URL);
      const response = await apiClient.get('/health', { timeout: 5000 });
      console.log('API Connection successful:', response.status);
      return { success: true, status: response.status };
    } catch (error) {
      console.error('API Connection failed:', error.message);
      return { 
        success: false, 
        error: error.message,
        code: error.code,
        status: error.response?.status 
      };
    }
  },


  async checkHealth() {
    try {
      const response = await apiClient.get('/admin/analytics/test');
      return {
        success: true,
        message: 'API is healthy',
        data: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'API health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  getCurrentUser() {
    if (this.isAdmin()) {
      const user = localStorage.getItem('admin_user');
      return user ? JSON.parse(user) : null;
    } else if (this.isSalesPerson()) {
      const user = localStorage.getItem('sales_person');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  updateCurrentUser(userData) {
    if (this.isAdmin()) {
      const currentUser = localStorage.getItem('admin_user');
      if (currentUser) {
        const updatedUser = { ...JSON.parse(currentUser), ...userData };
        localStorage.setItem('admin_user', JSON.stringify(updatedUser));
      }
    } else if (this.isSalesPerson()) {
      const currentUser = localStorage.getItem('sales_person');
      if (currentUser) {
        const updatedUser = { ...JSON.parse(currentUser), ...userData };
        localStorage.setItem('sales_person', JSON.stringify(updatedUser));
      }
    }
  },

  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // CEO has all permissions
    if (user.role === 'ceo') return true;
    
    return user.permissions?.[permission] === true;
  },

  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  },

  formatError(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    switch (error.code) {
      case 'ECONNABORTED':
        return 'La requête a pris trop de temps. Veuillez réessayer.';
      case 'ERR_NETWORK':
        return 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      default:
        return error.message || 'Une erreur inattendue s\'est produite.';
    }
  },

  async retryRequest(originalRequest, maxRetries = 3) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`Retrying request (${retries + 1}/${maxRetries}):`, originalRequest.url);
        const response = await apiClient(originalRequest);
        return response;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },


  async isApiAvailable() {
    try {
      await this.testConnection();
      return true;
    } catch {
      return false;
    }
  },


  async getApiStatus() {
    try {
      const healthCheck = await this.checkHealth();
      const connectionTest = await this.testConnection();
      
      return {
        available: true,
        health: healthCheck,
        connection: connectionTest,
        baseURL: API_BASE_URL,
        userType: this.getCurrentUserType(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        error: this.formatError(error),
        baseURL: API_BASE_URL,
        userType: this.getCurrentUserType(),
        timestamp: new Date().toISOString()
      };
    }
  }
};


export default apiClient;
