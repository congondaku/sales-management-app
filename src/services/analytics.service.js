import apiClient from './api';

export const analyticsService = {
  // Obtenir vue d'ensemble des analytics
  async getAnalyticsOverview(period = 'month') {
    try {
      const response = await apiClient.get('/admin/analytics/overview', {
        params: { period }
      });
      
      if (response.data.success) {
        // Map backend data to frontend expected format
        const backendData = response.data.analytics;
        
        // Calculate conversion rate
        const conversionRate = backendData.overview?.totalUsers > 0 
          ? (backendData.overview.totalCommissionCount / backendData.overview.totalUsers) * 100 
          : 0;

        // Map commissions by status for easier access
        const commissionsByStatus = {};
        backendData.commissionsByStatus?.forEach(status => {
          commissionsByStatus[status._id] = status.total || 0;
        });

        // Map top performers to sales performance format
        const salesPerformance = backendData.topPerformers?.map(performer => ({
          salesPersonId: performer.salesPersonId,
          name: performer.name,
          territory: performer.territory,
          revenue: typeof performer.totalEarnings === 'number' ? performer.totalEarnings : 0,
          customers: performer.totalCommissions || 0
        })) || [];

        // Map territory stats to territory performance
        const territoryPerformance = backendData.territoryStats?.map(territory => ({
          name: territory._id,
          salesPeople: territory.salesPeopleCount || 0,
          customers: territory.activeCount || 0,
          revenue: 0, // This would need to be calculated from commissions
          conversionRate: 0 // This would need to be calculated
        })) || [];

        const mappedData = {
          // Main metrics
          totalRevenue: backendData.overview?.totalCommissionAmount || 0,
          newCustomers: backendData.overview?.totalUsers || 0,
          conversionRate: conversionRate,
          totalCommissions: backendData.overview?.totalCommissionAmount || 0,
          
          // Performance data
          salesPerformance: salesPerformance,
          territoryPerformance: territoryPerformance,
          
          // Growth data (placeholder - would need historical data)
          monthlyGrowth: {
            revenue: 0,
            customers: 0,
            commissions: 0
          },
          
          // Target completion (placeholder - would need target data)
          targetCompletion: {
            revenue: 0.75, // Example: 75% of target
            customers: 0.65 // Example: 65% of target
          },
          
          // Commissions summary
          commissionsSummary: {
            pending: commissionsByStatus.pending || 0,
            confirmed: commissionsByStatus.confirmed || 0,
            paid: commissionsByStatus.paid_out || 0
          },
          
          // Trends (placeholder - these would need trend calculation)
          revenueTrend: null,
          customersTrend: null,
          conversionTrend: null,
          commissionsTrend: null
        };

        return {
          success: true,
          analytics: mappedData
        };
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des analytics');
    }
  },

  // Obtenir les statistiques du dashboard (use overview endpoint)
  async getDashboardStats(period = 'month') {
    try {
      const response = await apiClient.get('/admin/analytics/overview', {
        params: { period }
      });
      
      if (response.data.success) {
        const backendData = response.data.analytics;
        
        // Calculate conversion rate
        const conversionRate = backendData.overview?.totalUsers > 0 
          ? (backendData.overview.totalCommissionCount / backendData.overview.totalUsers) * 100 
          : 0;

        const dashboardData = {
          salesPeople: backendData.overview?.totalSalesPeople || 0,
          totalUsers: backendData.overview?.totalUsers || 0,
          totalCommissions: backendData.overview?.totalCommissionAmount || 0,
          conversionRate: conversionRate,
          
          // Map other data
          commissionStats: backendData.commissionsByStatus || [],
          topPerformers: backendData.topPerformers || [],
          userRegistrationTrend: backendData.registrationTrend || [],
          
          // Add some trend calculations (placeholder)
          salesPeopleTrend: null,
          usersTrend: null,
          commissionsTrend: null,
          conversionTrend: null
        };
        
        return {
          success: true,
          dashboard: dashboardData
        };
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du tableau de bord');
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
