import apiClient from './api';

export const analyticsService = {
  // Obtenir vue d'ensemble des analytics
  async getAnalyticsOverview(period = 'month') {
    try {
      const response = await apiClient.get('/admin/analytics/overview', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des analytics');
    }
  },

  // Obtenir performance des ventes
  async getSalesPerformance(params = {}) {
    try {
      const response = await apiClient.get('/admin/analytics/sales-performance', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la performance des ventes');
    }
  },

  // Obtenir tendances des commissions
  async getCommissionTrends(period = 'month', days = 30) {
    try {
      const response = await apiClient.get('/admin/analytics/commission-trends', {
        params: { period, days }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des tendances');
    }
  },

  // Obtenir comparaison des territoires
  async getTerritoryComparison(period = 'month') {
    try {
      const response = await apiClient.get('/admin/analytics/territory-comparison', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la comparaison des territoires');
    }
  },

  // Obtenir taux de conversion
  async getConversionRates(params = {}) {
    try {
      const response = await apiClient.get('/admin/analytics/conversion-rates', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des taux de conversion');
    }
  }
};
