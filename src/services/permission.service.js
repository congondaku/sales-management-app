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
  // ADMIN MANAGEMENT (FIXED ENDPOINTS)
  // ================================

  // ✅ FIXED: Create admin using correct endpoint
  async createAdmin(adminData) {
    try {
      const response = await apiClient.post('/permissions/admin/create', adminData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de l\'administrateur');
    }
  },

  // ✅ FIXED: Suspend admin using correct endpoint
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

  // ✅ FIXED: Unsuspend admin using correct endpoint
  async unsuspendAdmin(adminId) {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/unsuspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation de l\'administrateur');
    }
  },

  // ✅ FIXED: Assign manager to admin using correct endpoint
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
  // SALES PERSON MANAGEMENT (FIXED ENDPOINTS)
  // ================================

  // ✅ FIXED: Suspend sales person using correct endpoint
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

  // ✅ FIXED: Unsuspend sales person using correct endpoint
  async unsuspendSalesPerson(salesPersonId) {
    try {
      const response = await apiClient.put(`/permissions/sales-person/${salesPersonId}/unsuspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation du commercial');
    }
  },

  // ✅ FIXED: Set commission rate using correct endpoint (CEO only)
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

  // ✅ FIXED: Assign manager to sales person using correct endpoint
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
  // UTILITY METHODS (FIXED)
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

  // ✅ FIXED: Get manageable users using correct endpoint
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
  // VALIDATION & HELPER METHODS (ENHANCED)
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
  // BATCH OPERATIONS (ENHANCED)
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
  },

  // ================================
  // NEW: ENHANCED ADMIN OPERATIONS
  // ================================

  // ✅ NEW: Get admin details with hierarchy
  async getAdminDetails(adminId) {
    try {
      const [permissionsResponse, hierarchyResponse] = await Promise.all([
        this.getUserPermissions(adminId, 'Admin'),
        this.getHierarchy()
      ]);

      return {
        success: true,
        admin: {
          permissions: permissionsResponse.permissions || {},
          hierarchy: hierarchyResponse.hierarchy || null
        }
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des détails admin');
    }
  },

  // ✅ NEW: Get permission statistics
  async getPermissionStats() {
    try {
      const [availableResponse, myPermissionsResponse] = await Promise.all([
        this.getAvailablePermissions(),
        this.getMyPermissions()
      ]);

      const available = availableResponse.permissions || {};
      const myPermissions = myPermissionsResponse.permissions || {};

      const stats = {
        totalAvailable: Object.keys(available).reduce((count, category) => {
          return count + (available[category]?.length || 0);
        }, 0),
        myGranted: Object.values(myPermissions).filter(p => p === true).length,
        myTotal: Object.keys(myPermissions).length,
        categories: Object.keys(available).length
      };

      return {
        success: true,
        stats,
        breakdown: {
          available,
          myPermissions
        }
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des statistiques');
    }
  },

  // ✅ NEW: Bulk permission management
  async bulkPermissionUpdate(operations) {
    try {
      const results = [];

      for (const operation of operations) {
        try {
          let result;
          
          if (operation.action === 'grant') {
            result = await this.grantPermission(
              operation.targetId,
              operation.targetType,
              operation.permission,
              operation.reason
            );
          } else if (operation.action === 'revoke') {
            result = await this.revokePermission(
              operation.targetId,
              operation.targetType,
              operation.permission,
              operation.reason
            );
          }

          results.push({
            ...operation,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            ...operation,
            success: false,
            error: error.message
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: true,
        message: `Opérations terminées: ${successful} réussies, ${failed} échouées`,
        results,
        summary: { successful, failed, total: results.length }
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors des opérations en masse');
    }
  },

  // ✅ NEW: Check if current user can perform action
  async canPerformAction(action, targetId, targetType) {
    try {
      const myPermissions = await this.getMyPermissions();
      
      const requiredPermissions = {
        'suspend_admin': ['canEditAdmins'],
        'create_admin': ['canCreateAdmins'],
        'manage_permissions': ['canManagePermissions'],
        'set_commission_rate': ['canSetCommissionRates'],
        'suspend_sales_person': ['canEditSalesPeople']
      };

      const required = requiredPermissions[action];
      if (!required) return { canPerform: false, reason: 'Action non reconnue' };

      const hasPermission = required.some(perm => 
        myPermissions.permissions?.[perm] === true
      );

      return {
        canPerform: hasPermission,
        reason: hasPermission ? null : `Permission requise: ${required.join(' ou ')}`
      };
    } catch (error) {
      return {
        canPerform: false,
        reason: 'Erreur lors de la vérification des permissions'
      };
    }
  },

  // ✅ NEW: Get user hierarchy path
  async getUserHierarchyPath(userId, userType) {
    try {
      const hierarchy = await this.getHierarchy();
      
      // This would need to traverse the hierarchy to build the path
      // For now, return basic info
      return {
        success: true,
        path: [], // Would contain hierarchy path from root to user
        directManager: hierarchy.admin?.managedBy || null,
        subordinates: hierarchy.subordinates || { admins: [], salesPeople: [] }
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du chemin hiérarchique');
    }
  }
};

export default permissionService;
