import apiClient from './api';

export const commissionService = {
  // Obtenir toutes les commissions
  async getCommissions(params = {}) {
    try {
      const response = await apiClient.get('/admin/commissions', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des commissions');
    }
  },

  // Obtenir les statistiques des commissions
  async getCommissionStats() {
    try {
      const response = await apiClient.get('/admin/commissions/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des statistiques');
    }
  },

  // Obtenir une commission par ID
  async getCommission(id) {
    try {
      const response = await apiClient.get(`/admin/commissions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la commission');
    }
  },

  // Marquer une commission comme payée
  async markCommissionPaid(id, notes = '') {
    try {
      const response = await apiClient.put(`/admin/commissions/${id}/mark-paid`, {
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du marquage comme payée');
    }
  },

  // Paiement groupé de commissions
  async batchPayoutCommissions(commissionIds, notes = '') {
    try {
      const response = await apiClient.post('/admin/commissions/batch-payout', {
        commissionIds,
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du paiement groupé');
    }
  },

  // Annuler une commission
  async cancelCommission(id, reason = '') {
    try {
      const response = await apiClient.put(`/admin/commissions/${id}/cancel`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  }
};