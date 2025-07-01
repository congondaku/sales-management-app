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

  // Créer un commercial
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

  // ✅ NEW: Obtenir l'historique des objectifs
  async getTargetsHistory(id) {
    try {
      const response = await apiClient.get(`/admin/sales-people/${id}/targets-history`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l\'historique des objectifs');
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

  // ✅ NEW: Activer un commercial
  async activateSalesPerson(id) {
    try {
      const response = await apiClient.put(`/admin/sales-people/${id}/activate`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'activation');
    }
  },

  // ✅ NEW: Désactiver un commercial
  async deactivateSalesPerson(id, reason = '') {
    try {
      const response = await apiClient.put(`/admin/sales-people/${id}/deactivate`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la désactivation');
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
  // ANALYTICS & REPORTING (UPDATED)
  // ================================

  // Obtenir les analytics des ventes (primary endpoint)
  async getSalesAnalytics(params = {}) {
    try {
      const response = await apiClient.get('/admin/analytics/sales-performance', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des analytics');
    }
  },

  // ✅ NEW: Obtenir les analytics des ventes (alternative endpoint)
  async getSalesAnalyticsAlt(params = {}) {
    try {
      const response = await apiClient.get('/sales/admin/analytics', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des analytics alternatives');
    }
  },

  // ✅ NEW: Obtenir les commissions des ventes (admin view)
  async getSalesCommissions(params = {}) {
    try {
      const response = await apiClient.get('/sales/admin/commissions', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des commissions');
    }
  },

  // ✅ NEW: Traiter un paiement de commission
  async processCommissionPayout(commissionId, payoutNotes = '') {
    try {
      const response = await apiClient.post(`/sales/admin/payout/${commissionId}`, {
        payoutNotes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du traitement du paiement');
    }
  },

  // ================================
  // TARGET MANAGEMENT (ENHANCED)
  // ================================

  // ✅ NEW: Valider les objectifs
  validateTargets(targets) {
    const errors = {};

    if (targets.weeklyRegistrations !== undefined) {
      if (isNaN(targets.weeklyRegistrations) || targets.weeklyRegistrations < 0) {
        errors.weeklyRegistrations = 'L\'objectif hebdomadaire doit être un nombre positif';
      }
    }

    if (targets.monthlyRegistrations !== undefined) {
      if (isNaN(targets.monthlyRegistrations) || targets.monthlyRegistrations < 0) {
        errors.monthlyRegistrations = 'L\'objectif mensuel doit être un nombre positif';
      }
    }

    if (targets.weeklyEarnings !== undefined) {
      if (isNaN(targets.weeklyEarnings) || targets.weeklyEarnings < 0) {
        errors.weeklyEarnings = 'L\'objectif de revenus hebdomadaire doit être un nombre positif';
      }
    }

    if (targets.monthlyEarnings !== undefined) {
      if (isNaN(targets.monthlyEarnings) || targets.monthlyEarnings < 0) {
        errors.monthlyEarnings = 'L\'objectif de revenus mensuel doit être un nombre positif';
      }
    }

    // Validation logique: mensuel >= hebdomadaire
    if (targets.weeklyRegistrations && targets.monthlyRegistrations) {
      if (targets.monthlyRegistrations < targets.weeklyRegistrations) {
        errors.monthlyRegistrations = 'L\'objectif mensuel doit être supérieur ou égal à l\'objectif hebdomadaire';
      }
    }

    if (targets.weeklyEarnings && targets.monthlyEarnings) {
      if (targets.monthlyEarnings < targets.weeklyEarnings) {
        errors.monthlyEarnings = 'L\'objectif de revenus mensuel doit être supérieur ou égal à l\'objectif hebdomadaire';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // ✅ NEW: Mise à jour en masse des objectifs
  async bulkUpdateTargets(salesPeopleIds, targets, reason = '') {
    try {
      const promises = salesPeopleIds.map(id => 
        this.setSalesTargets(id, targets, reason)
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: `${successful} objectifs mis à jour, ${failed} échecs`,
        successful,
        failed,
        details: results
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la mise à jour en masse des objectifs');
    }
  },

  // ================================
  // VALIDATION & HELPER METHODS (NEW)
  // ================================

  // Valider les données de création d'un commercial
  validateSalesPersonData(salesData) {
    const errors = {};

    if (!salesData.firstName || salesData.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!salesData.lastName || salesData.lastName.trim().length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!salesData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(salesData.email)) {
      errors.email = 'Email invalide';
    }

    if (!salesData.phoneNumber || salesData.phoneNumber.trim().length < 10) {
      errors.phoneNumber = 'Le numéro de téléphone doit contenir au moins 10 caractères';
    }

    if (!salesData.password || salesData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!salesData.territory || salesData.territory.trim().length < 2) {
      errors.territory = 'Le territoire est requis';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // ✅ NEW: Calculer le pourcentage d'atteinte des objectifs
  calculateTargetAchievement(actual, target) {
    if (!target || target === 0) return 0;
    return Math.round((actual / target) * 100);
  },

  // ✅ NEW: Formatter les statistiques de performance
  formatPerformanceStats(performance) {
    return {
      weekly: {
        registrations: performance.weekly?.registrations || 0,
        target: performance.weekly?.target || 0,
        achievement: this.calculateTargetAchievement(
          performance.weekly?.registrations || 0,
          performance.weekly?.target || 0
        ),
        status: (performance.weekly?.registrations || 0) >= (performance.weekly?.target || 0) 
          ? 'achieved' : 'in_progress'
      },
      monthly: {
        registrations: performance.monthly?.registrations || 0,
        target: performance.monthly?.target || 0,
        achievement: this.calculateTargetAchievement(
          performance.monthly?.registrations || 0,
          performance.monthly?.target || 0
        ),
        status: (performance.monthly?.registrations || 0) >= (performance.monthly?.target || 0) 
          ? 'achieved' : 'in_progress'
      }
    };
  },

  // ================================
  // BATCH OPERATIONS (NEW)
  // ================================

  // ✅ NEW: Opérations en masse sur les commerciaux
  async batchToggleStatus(salesPeopleIds, isActive, reason = '') {
    try {
      const promises = salesPeopleIds.map(id => 
        this.toggleSalesPersonStatus(id, isActive, reason)
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: `${successful} commerciaux ${isActive ? 'activés' : 'désactivés'}, ${failed} échecs`,
        successful,
        failed,
        details: results
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de l\'opération en masse');
    }
  },

  // ================================
  // TERRITORY & TEAM MANAGEMENT (NEW)
  // ================================

  // ✅ NEW: Obtenir les territoires disponibles
  async getAvailableTerritories() {
    try {
      const response = await apiClient.get('/admin/territories');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des territoires');
    }
  },

  // ✅ NEW: Obtenir les commerciaux par territoire
  async getSalesPeopleByTerritory(territory) {
    try {
      const response = await this.getSalesPeople({ territory });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors du chargement des commerciaux par territoire');
    }
  },

  // ✅ NEW: Obtenir les statistiques par territoire
  async getTerritoryStats() {
    try {
      const response = await apiClient.get('/admin/analytics/territory-comparison');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des statistiques territoriales');
    }
  }
};
//salesService