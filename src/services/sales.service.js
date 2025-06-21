import apiClient from './api';

export const salesService = {
  // ================================
  // SALES PEOPLE MANAGEMENT (ADMIN)
  // ================================

  // Obtenir tous les commerciaux
  async getSalesPeople(params = {}) {
    try {
      const response = await apiClient.get('/admin/sales-people', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des commerciaux');
    }
  },

  // Obtenir un commercial par ID
  async getSalesPerson(id) {
    try {
      const response = await apiClient.get(`/admin/sales-people/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du commercial');
    }
  },

  // ✅ FIXED: Correct endpoint for creating sales person
  async createSalesPerson(salesData) {
    try {
      const response = await apiClient.post('/admin/sales-people', salesData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du commercial');
    }
  },

  // Mettre à jour un commercial
  async updateSalesPerson(id, updateData) {
    try {
      const response = await apiClient.put(`/admin/sales-people/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  },

  // Définir les objectifs d'un commercial
  async setSalesTargets(id, targets, reason = '') {
    try {
      const response = await apiClient.put(`/admin/sales-people/${id}/set-targets`, {
        targets,
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la définition des objectifs');
    }
  },

  // Obtenir la performance d'un commercial
  async getSalesPersonPerformance(id, period = 'month') {
    try {
      const response = await apiClient.get(`/admin/sales-people/${id}/performance`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la performance');
    }
  },

  // Activer/Désactiver un commercial
  async toggleSalesPersonStatus(id, isActive, reason = '') {
    try {
      const endpoint = isActive ? 'activate' : 'deactivate';
      const response = await apiClient.put(`/admin/sales-people/${id}/${endpoint}`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  },

  // Supprimer un commercial
  async deleteSalesPerson(id, reassignTo = null) {
    try {
      const response = await apiClient.delete(`/admin/sales-people/${id}`, {
        data: { reassignTo }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  },

  // Obtenir les utilisateurs d'un commercial
  async getSalesPersonUsers(id, params = {}) {
    try {
      const response = await apiClient.get(`/admin/sales-people/${id}/users`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    }
  },

  // ================================
  // NEW: ADDITIONAL ENDPOINTS
  // ================================

  // Obtenir l'historique des objectifs
  async getTargetsHistory(id) {
    try {
      const response = await apiClient.get(`/admin/sales-people/${id}/targets-history`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur historique des objectifs');
    }
  },

  // Obtenir les analytics des ventes (from sales routes)
  async getSalesAnalytics(params = {}) {
    try {
      const response = await apiClient.get('/sales/admin/analytics', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur analytics des ventes');
    }
  }
};
