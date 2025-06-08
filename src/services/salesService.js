import api from './api';

export const salesService = {
  // Authentication
  async login(credentials) {
    try {
      const response = await api.post('/api/sales/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Dashboard with cache busting
  async getDashboard(cacheBuster = '') {
    try {
      const response = await api.get(`/api/sales/dashboard${cacheBuster}`);
      console.log('🔄 Fresh dashboard data from API:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  },

  // Customer Management - FIXED: Added registerCustomer function
  async registerCustomer(userData) {
    try {
      const response = await api.post('/api/sales/register-user', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to register customer');
    }
  },

  // Customers with cache busting
  async getMyCustomers(params = {}) {
    try {
      // Add timestamp to force fresh data
      const freshParams = { ...params, _t: Date.now() };
      console.log('🔄 Fetching fresh customer data...');
      
      const response = await api.get('/api/sales/my-users', { params: freshParams });
      console.log('📊 Fresh customer data received:', {
        count: response.data.users?.length,
        customers: response.data.users?.slice(0, 3).map(u => ({
          name: `${u.firstName} ${u.lastName}`,
          hasCommission: u.hasCommission,
          commissionAmount: u.commissionAmount
        }))
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch customers');
    }
  },

  // Commissions with cache busting
  async getMyCommissions(params = {}) {
    try {
      // Add timestamp to force fresh data
      const freshParams = { ...params, _t: Date.now() };
      console.log('🔄 Fetching fresh commission data...');
      
      const response = await api.get('/api/sales/my-commissions', { params: freshParams });
      console.log('💰 Fresh commission data received:', {
        count: response.data.commissions?.length,
        totalAmount: response.data.commissions?.reduce((sum, c) => sum + c.commissionAmount, 0)
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch commissions');
    }
  },

  // Performance
  async getWeeklyPerformance(params = {}) {
    try {
      const response = await api.get('/api/sales/weekly-performance', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch performance data');
    }
  },

  // Profile Management
  async getProfile() {
    try {
      const response = await api.get('/api/sales/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/api/sales/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await api.put('/api/sales/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }
};
