import api from './api';

export const adminService = {
  // Sales People Management - FIXED: Add /api prefix
  async createSalesPerson(data) {
    try {
      const response = await api.post('/api/sales/admin/create-sales-person', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create sales person');
    }
  },

  async getSalesPeople(params = {}) {
    try {
      const response = await api.get('/api/sales/admin/sales-people', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sales people');
    }
  },

  async updateSalesPersonStatus(id, isActive) {
    try {
      const response = await api.put(`/api/sales/admin/sales-person/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update status');
    }
  },

  // Analytics - FIXED: Add /api prefix
  async getSalesAnalytics(params = {}) {
    try {
      const response = await api.get('/api/sales/admin/analytics', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
    }
  },

  // Commissions - FIXED: Add /api prefix
  async getCommissions(params = {}) {
    try {
      const response = await api.get('/api/sales/admin/commissions', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch commissions');
    }
  },

  async markCommissionAsPaid(commissionId, notes) {
    try {
      const response = await api.post(`/api/sales/admin/payout/${commissionId}`, {
        payoutNotes: notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark commission as paid');
    }
  },

  // Dashboard stats - FIXED: Add /api prefix
  async getDashboardStats() {
    try {
      const response = await api.get('/api/sales/admin/analytics?period=month');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  },

  // Regular Admin Functions (existing routes)
  async getAllUsers(params = {}) {
    try {
      const response = await api.get('/api/admin/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  async getAllListings(params = {}) {
    try {
      const response = await api.get('/api/admin/listings', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch listings');
    }
  },

  async deleteUser(userId) {
    try {
      const response = await api.delete(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  async deleteListing(listingId) {
    try {
      const response = await api.delete(`/api/admin/listings/${listingId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete listing');
    }
  },
  async getCommissions(params = {}) {
  try {
    console.log('🔍 Fetching commissions with params:', params);
    const response = await api.get('/api/admin/commissions', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching commissions:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch commissions');
  }
},

async getCommissionStats() {
  try {
    const response = await api.get('/api/admin/commissions/stats');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching commission stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch commission statistics');
  }
},

async markCommissionAsPaid(commissionId, notes = '') {
  try {
    console.log('💰 Marking commission as paid:', commissionId);
    const response = await api.put(`/api/admin/commissions/${commissionId}/mark-paid`, { notes });
    return response.data;
  } catch (error) {
    console.error('❌ Error marking commission as paid:', error);
    throw new Error(error.response?.data?.message || 'Failed to mark commission as paid');
  }
},

async batchPayoutCommissions(commissionIds, notes = '') {
  try {
    console.log('💰 Processing batch payout for:', commissionIds.length, 'commissions');
    const response = await api.post('/api/admin/commissions/batch-payout', { 
      commissionIds, 
      notes 
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error processing batch payout:', error);
    throw new Error(error.response?.data?.message || 'Failed to process batch payout');
  }
},
};

