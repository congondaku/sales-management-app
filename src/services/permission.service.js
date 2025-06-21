import apiClient from './api';

export const permissionService = {
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

  // Créer un nouvel admin
  async createAdmin(adminData) {
    try {
      const response = await apiClient.post('/permissions/admin/create', adminData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de l\'administrateur');
    }
  },

  // Suspendre un admin
  async suspendAdmin(adminId, reason = '') {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/suspend`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suspension');
    }
  },

  // Réactiver un admin
  async unsuspendAdmin(adminId) {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/unsuspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation');
    }
  },

  // Assigner un manager à un admin
  async assignManagerToAdmin(adminId, managerId) {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/assign-manager`, {
        managerId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'assignation du manager');
    }
  },

  // Suspendre un commercial
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

  // Réactiver un commercial
  async unsuspendSalesPerson(salesPersonId) {
    try {
      const response = await apiClient.put(`/permissions/sales-person/${salesPersonId}/unsuspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation du commercial');
    }
  },

  // Définir le taux de commission (CEO seulement)
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

  // Assigner un manager à un commercial
  async assignManagerToSalesPerson(salesPersonId, managerId) {
    try {
      const response = await apiClient.put(`/permissions/sales-person/${salesPersonId}/assign-manager`, {
        managerId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'assignation du manager');
    }
  },

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
  }
};
