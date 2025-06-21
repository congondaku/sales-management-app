import apiClient from './api';

export const salesService = {
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

  // Créer un nouveau commercial
  async createSalesPerson(salesData) {
    try {
      const response = await apiClient.post('/sales/admin/create-sales-person', salesData);
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
  }
};