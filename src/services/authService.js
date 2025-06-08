import api from './api';

export const authService = {
  // Admin login
  async adminLogin(credentials) {
    try {
      console.log('🔐 Attempting admin login:', credentials.email);

      const response = await api.post('/admin/login', {
        email: credentials.email.trim(),
        password: credentials.password
      });

      console.log('✅ Admin login response:', response.data);

      const { token, admin } = response.data;

      if (!token) {
        throw new Error('No token received from server');
      }

      // Store token and user type
      localStorage.setItem('adminToken', token);
      localStorage.setItem('userType', 'admin');

      return {
        token,
        user: admin,
        type: 'admin'
      };

    } catch (error) {
      console.error('❌ Admin login error:', error.response?.data || error.message);

      // Extract error message
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Login failed';

      throw new Error(errorMessage);
    }
  },

  // Sales person login
  async salesLogin(credentials) {
    try {
      console.log('🔐 Attempting sales login:', credentials.email);

      const response = await api.post('/api/sales/login', {
        email: credentials.email.trim(),
        password: credentials.password
      });

      console.log('✅ Sales login response:', response.data);

      const { token, salesPerson, user } = response.data;

      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('salesToken', token);
      localStorage.setItem('userType', 'sales');

      return {
        token,
        user: salesPerson || user,
        type: 'sales'
      };

    } catch (error) {
      console.error('❌ Sales login error:', error.response?.data || error.message);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Login failed';

      throw new Error(errorMessage);
    }
  },

  // Logout
  logout() {
    console.log('🚪 authService.logout() called');
    console.log('🔍 Before clearing - tokens exist:', {
      adminToken: !!localStorage.getItem('adminToken'),
      salesToken: !!localStorage.getItem('salesToken')
    });

    localStorage.removeItem('adminToken');
    localStorage.removeItem('salesToken');
    localStorage.removeItem('userType');

    console.log('🔍 After clearing - tokens should be gone');
  },

  // Get current user type
  getUserType() {
    return localStorage.getItem('userType');
  },

  // Check if user is authenticated
  isAuthenticated() {
    const adminToken = localStorage.getItem('adminToken');
    const salesToken = localStorage.getItem('salesToken');
    return !!(adminToken || salesToken);
  },

  // Get current token
  getToken() {
    return localStorage.getItem('adminToken') || localStorage.getItem('salesToken');
  }
};
