import apiClient from './api';

export const analyticsService = {
  // ✅ FIXED: Use correct backend endpoint and data mapping
  async getAnalyticsOverview(period = 'month') {
    try {
      const response = await apiClient.get('/admin/analytics/overview', {
        params: { period }
      });
      
      if (response.data.success) {
        // ✅ FIXED: Map backend data correctly to frontend format
        const backendData = response.data.analytics;
        
        // Calculate conversion rate safely
        const conversionRate = backendData.overview?.totalUsers > 0 
          ? Math.round((backendData.overview.totalCommissionCount / backendData.overview.totalUsers) * 100)
          : 0;

        // Map commissions by status for easier access
        const commissionsByStatus = {};
        if (Array.isArray(backendData.commissionsByStatus)) {
          backendData.commissionsByStatus.forEach(status => {
            commissionsByStatus[status._id] = {
              total: typeof status.total === 'number' ? status.total : 0,
              count: status.count || 0
            };
          });
        }

        // ✅ FIXED: Handle commission rates visibility correctly
        const formatTopPerformers = (performers) => {
          if (!Array.isArray(performers)) return [];
          
          return performers.map(performer => ({
            salesPersonId: performer.salesPersonId,
            name: performer.name || 'Nom non disponible',
            territory: performer.territory || 'Territoire non défini',
            salesId: performer.salesId || 'ID non défini',
            totalEarnings: performer.totalEarnings,
            totalCommissions: performer.totalCommissions || 0,
            revenue: typeof performer.totalEarnings === 'number' ? performer.totalEarnings : 0
          }));
        };

        // Map territory stats to territory performance
        const territoryPerformance = Array.isArray(backendData.territoryStats) 
          ? backendData.territoryStats.map(territory => ({
              name: territory._id || 'Territoire inconnu',
              salesPeople: territory.salesPeopleCount || 0,
              activeSalesPeople: territory.activeCount || 0,
              revenue: 0, // This would need additional calculation
              conversionRate: 0 // This would need additional calculation
            }))
          : [];

        // ✅ FIXED: Create proper mapped data structure
        const mappedData = {
          // Main overview metrics
          overview: {
            totalSalesPeople: backendData.overview?.totalSalesPeople || 0,
            totalUsers: backendData.overview?.totalUsers || 0,
            totalCommissionAmount: backendData.overview?.totalCommissionAmount || 0,
            totalCommissionCount: backendData.overview?.totalCommissionCount || 0,
            conversionRate: conversionRate
          },

          // Main metrics for dashboard compatibility
          totalRevenue: backendData.overview?.totalCommissionAmount || 0,
          newCustomers: backendData.overview?.totalUsers || 0,
          conversionRate: conversionRate,
          totalCommissions: backendData.overview?.totalCommissionAmount || 0,
          
          // Performance data
          salesPerformance: formatTopPerformers(backendData.topPerformers),
          topPerformers: formatTopPerformers(backendData.topPerformers),
          territoryPerformance: territoryPerformance,
          
          // Commission data
          commissionsByStatus: backendData.commissionsByStatus || [],
          commissionsSummary: {
            pending: commissionsByStatus.pending?.total || 0,
            confirmed: commissionsByStatus.confirmed?.total || 0,
            paid: commissionsByStatus.paid_out?.total || 0,
            cancelled: commissionsByStatus.cancelled?.total || 0
          },

          // Registration trend
          registrationTrend: Array.isArray(backendData.registrationTrend) 
            ? backendData.registrationTrend 
            : [],
          userRegistrationTrend: Array.isArray(backendData.registrationTrend) 
            ? backendData.registrationTrend 
            : [],
          
          // Territory stats
          territoryStats: backendData.territoryStats || [],
          
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
          
          // Trends (placeholder - these would need trend calculation)
          revenueTrend: null,
          customersTrend: null,
          conversionTrend: null,
          commissionsTrend: null,

          // Period and visibility flags
          period: period,
          hideDetailedEarnings: backendData.hideDetailedEarnings || false
        };

        return {
          success: true,
          analytics: mappedData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Analytics overview error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des analytics');
    }
  },

  // ✅ FIXED: Use correct dashboard endpoint mapping
  async getDashboardStats(period = 'month') {
    try {
      // Use the overview endpoint for dashboard stats
      const overviewResponse = await this.getAnalyticsOverview(period);
      
      if (overviewResponse.success) {
        const analyticsData = overviewResponse.analytics;
        
        // Map analytics data to dashboard format
        const dashboardData = {
          salesPeople: analyticsData.overview?.totalSalesPeople || 0,
          totalUsers: analyticsData.overview?.totalUsers || 0,
          totalCommissions: analyticsData.overview?.totalCommissionAmount || 0,
          conversionRate: analyticsData.overview?.conversionRate || 0,
          
          // Commission stats
          commissionStats: analyticsData.commissionsByStatus || [],
          
          // Top performers
          topPerformers: analyticsData.topPerformers || [],
          
          // User registration trend
          userRegistrationTrend: analyticsData.registrationTrend || [],
          
          // Trend placeholders (to be calculated with historical data)
          salesPeopleTrend: null,
          usersTrend: null,
          commissionsTrend: null,
          conversionTrend: null,

          // Visibility flags
          hideDetailedEarnings: analyticsData.hideDetailedEarnings || false
        };
        
        return {
          success: true,
          dashboard: dashboardData
        };
      }
      
      return overviewResponse;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du tableau de bord');
    }
  },

  // ✅ FIXED: Sales performance endpoint
  async getSalesPerformance(params = {}) {
    try {
      const response = await apiClient.get('/admin/analytics/sales-performance', { params });
      
      if (response.data.success) {
        // Map the response data properly
        const salesPerformanceData = {
          salesPeople: Array.isArray(response.data.analytics?.salesPeople) 
            ? response.data.analytics.salesPeople 
            : [],
          summary: response.data.analytics?.summary || {
            totalRegistrations: 0,
            totalCommissions: 0,
            averagePerformance: 0
          },
          period: params.period || 'month',
          hideEarnings: response.data.analytics?.hideEarnings || false
        };

        return {
          success: true,
          analytics: salesPerformanceData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Sales performance error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la performance des ventes');
    }
  },

  // ✅ FIXED: Commission trends endpoint
  async getCommissionTrends(period = 'month', days = 30) {
    try {
      const response = await apiClient.get('/admin/analytics/commission-trends', {
        params: { period, days }
      });
      
      if (response.data.success) {
        return {
          success: true,
          trends: response.data.trends || [],
          period: period,
          days: parseInt(days),
          hideAmounts: response.data.hideAmounts || false
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Commission trends error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des tendances');
    }
  },

  // ✅ FIXED: Territory comparison endpoint
  async getTerritoryComparison(period = 'month') {
    try {
      const response = await apiClient.get('/admin/analytics/territory-comparison', {
        params: { period }
      });
      
      if (response.data.success) {
        return {
          success: true,
          territoryComparison: response.data.territoryComparison || [],
          period: period,
          hideEarnings: response.data.hideEarnings || false
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Territory comparison error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la comparaison des territoires');
    }
  },

  // ✅ FIXED: Conversion rates endpoint
  async getConversionRates(params = {}) {
    try {
      const response = await apiClient.get('/admin/analytics/conversion-rates', { params });
      
      if (response.data.success) {
        return {
          success: true,
          conversionRates: response.data.conversionRates || [],
          summary: response.data.summary || {
            totalRegistrations: 0,
            totalConversions: 0,
            overallRate: 0
          },
          period: params.period || 'month'
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Conversion rates error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des taux de conversion');
    }
  },

  // ✅ NEW: Test analytics connectivity
  async testAnalytics() {
    try {
      const response = await apiClient.get('/admin/analytics/test');
      return response.data;
    } catch (error) {
      console.error('Analytics test error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du test des analytics');
    }
  },

  // ✅ NEW: Get analytics status
  async getAnalyticsStatus() {
    try {
      const testResult = await this.testAnalytics();
      return {
        success: true,
        status: 'operational',
        message: 'Analytics service is working',
        timestamp: new Date().toISOString(),
        details: testResult
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default analyticsService;
