import apiClient from './api';

export const permissionService = {
  // ================================
  // BASIC PERMISSION MANAGEMENT
  // ================================

  // Obtenir mes permissions
  async getMyPermissions() {
    try {
      const response = await apiClient.get('/permissions/my-permissions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des permissions');
    }
  },

  // Obtenir la hiérarchie
  async getHierarchy() {
    try {
      const response = await apiClient.get('/permissions/hierarchy');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la hiérarchie');
    }
  },

  // Accorder une permission
  async grantPermission(targetId, targetType, permission, reason = '') {
    try {
      const response = await apiClient.post('/permissions/grant', {
        targetId,
        targetType,
        permission,
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'octroi de la permission');
    }
  },

  // Révoquer une permission
  async revokePermission(targetId, targetType, permission, reason = '') {
    try {
      const response = await apiClient.post('/permissions/revoke', {
        targetId,
        targetType,
        permission,
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la révocation de la permission');
    }
  },

  // Mise à jour en masse des permissions
  async bulkUpdatePermissions(targets, permissions, reason = '') {
    try {
      const response = await apiClient.post('/permissions/bulk-update', {
        targets,
        permissions,
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour en masse');
    }
  },

  // Obtenir l'historique d'audit
  async getAuditTrail(filters = {}) {
    try {
      const response = await apiClient.get('/permissions/audit-trail', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l\'historique');
    }
  },

  // Obtenir les permissions d'un utilisateur
  async getUserPermissions(userId, userType) {
    try {
      const response = await apiClient.get(`/permissions/user/${userId}/permissions`, {
        params: { type: userType }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des permissions utilisateur');
    }
  },

  // ================================
  // ADMIN MANAGEMENT (UPDATED)
  // ================================

  // Créer un nouvel admin
  async createAdmin(adminData) {
    try {
      const response = await apiClient.post('/permissions/admin/create', adminData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de l\'administrateur');
    }
  },

  // ✅ NEW: Suspendre un admin
  async suspendAdmin(adminId, reason = '') {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/suspend`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suspension de l\'administrateur');
    }
  },

  // ✅ NEW: Réactiver un admin
  async unsuspendAdmin(adminId) {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/unsuspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation de l\'administrateur');
    }
  },

  // ✅ NEW: Assigner un manager à un admin
  async assignManagerToAdmin(adminId, managerId) {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/assign-manager`, {
        managerId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'assignation du manager à l\'admin');
    }
  },

  // ================================
  // SALES PERSON MANAGEMENT (UPDATED)
  // ================================

  // ✅ NEW: Suspendre un commercial
  async suspendSalesPerson(salesPersonId, reason = '') {
    try {
      const response = await apiClient.put(`/permissions/sales-person/${salesPersonId}/suspend`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suspension du commercial');
    }
  },

  // ✅ NEW: Réactiver un commercial
  async unsuspendSalesPerson(salesPersonId) {
    try {
      const response = await apiClient.put(`/permissions/sales-person/${salesPersonId}/unsuspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation du commercial');
    }
  },

  // ✅ NEW: Définir le taux de commission (CEO seulement)
  async setCommissionRate(salesPersonId, commissionRate) {
    try {
      const response = await apiClient.put(`/permissions/sales-person/${salesPersonId}/set-commission-rate`, {
        commissionRate
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la définition du taux de commission');
    }
  },

  // ✅ NEW: Assigner un manager à un commercial
  async assignManagerToSalesPerson(salesPersonId, managerId) {
    try {
      const response = await apiClient.put(`/permissions/sales-person/${salesPersonId}/assign-manager`, {
        managerId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'assignation du manager au commercial');
    }
  },

  // ================================
  // UTILITY METHODS
  // ================================

  // Obtenir les permissions disponibles
  async getAvailablePermissions() {
    try {
      const response = await apiClient.get('/permissions/available-permissions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des permissions disponibles');
    }
  },

  // Obtenir les utilisateurs gérables
  async getManageableUsers(type = 'all') {
    try {
      const response = await apiClient.get('/permissions/manageable-users', {
        params: { type }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des utilisateurs gérables');
    }
  },

  // ================================
  // VALIDATION & HELPER METHODS (NEW)
  // ================================

  // Valider les données d'admin avant création
  validateAdminData(adminData) {
    const errors = {};

    if (!adminData.firstName || adminData.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!adminData.lastName || adminData.lastName.trim().length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!adminData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
      errors.email = 'Email invalide';
    }

    if (!adminData.password || adminData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!adminData.role) {
      errors.role = 'Le rôle est requis';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Valider le taux de commission
  validateCommissionRate(rate) {
    const numRate = parseFloat(rate);
    
    if (isNaN(numRate)) {
      return { isValid: false, error: 'Le taux doit être un nombre' };
    }
    
    if (numRate < 0 || numRate > 1) {
      return { isValid: false, error: 'Le taux doit être entre 0 et 1 (0% à 100%)' };
    }
    
    return { isValid: true };
  },

  // Formatter le taux de commission pour l'affichage
  formatCommissionRate(rate) {
    return `${(parseFloat(rate) * 100).toFixed(1)}%`;
  },

  // ================================
  // BATCH OPERATIONS (NEW)
  // ================================

  // Suspendre plusieurs utilisateurs
  async batchSuspendUsers(userIds, userType, reason = '') {
    try {
      const promises = userIds.map(userId => {
        if (userType === 'Admin') {
          return this.suspendAdmin(userId, reason);
        } else if (userType === 'SalesPerson') {
          return this.suspendSalesPerson(userId, reason);
        }
        throw new Error('Type d\'utilisateur invalide');
      });

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: `${successful} utilisateurs suspendus, ${failed} échecs`,
        successful,
        failed,
        details: results
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la suspension en masse');
    }
  },

  // Réactiver plusieurs utilisateurs
  async batchUnsuspendUsers(userIds, userType) {
    try {
      const promises = userIds.map(userId => {
        if (userType === 'Admin') {
          return this.unsuspendAdmin(userId);
        } else if (userType === 'SalesPerson') {
          return this.unsuspendSalesPerson(userId);
        }
        throw new Error('Type d\'utilisateur invalide');
      });

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: `${successful} utilisateurs réactivés, ${failed} échecs`,
        successful,
        failed,
        details: results
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la réactivation en masse');
    }
  }
};
