import apiClient from './api';

export const promotionService = {
  // ================================
  // ORGANIZATIONAL HIERARCHY
  // ================================

  // Get complete organizational hierarchy
  async getOrganizationHierarchy() {
    try {
      const response = await apiClient.get('/org/hierarchy');
      return response.data;
    } catch (error) {
      console.log('🔄 Organization endpoint not available, using fallback...');
      
      // Fallback: use existing admin/sales endpoints to build hierarchy
      try {
        // Get all admins and sales people
        const [adminsResponse, salesResponse] = await Promise.all([
          apiClient.get('/admin/admins', { params: { limit: 100 } }),
          apiClient.get('/admin/sales-people', { params: { limit: 100 } })
        ]);

        // Build hierarchy from existing data
        const admins = adminsResponse.data.admins || [];
        const salesPeople = salesResponse.data.salesPeople || [];

        // Simple hierarchy builder
        const hierarchy = this.buildHierarchyFromData(admins, salesPeople);
        
        return {
          success: true,
          hierarchy,
          stats: {
            totalAdmins: admins.length,
            totalSalesPeople: salesPeople.length,
            totalPeople: admins.length + salesPeople.length
          }
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error('Impossible de charger la structure organisationnelle');
      }
    }
  },

  // Build hierarchy from admin and sales data
  buildHierarchyFromData(admins, salesPeople) {
    const allPeople = new Map();
    
    // Convert admins to hierarchy format
    admins.forEach(admin => {
      allPeople.set(admin._id, {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        role: admin.role,
        territory: admin.territory,
        teamName: admin.teamName,
        type: 'Admin',
        managedBy: admin.managedBy?._id || null,
        manager: admin.managedBy ? {
          name: `${admin.managedBy.firstName} ${admin.managedBy.lastName}`,
          role: admin.managedBy.role
        } : null,
        isActive: admin.isActive,
        children: [],
        directReportsCount: 0
      });
    });

    // Convert sales people to hierarchy format
    salesPeople.forEach(sales => {
      allPeople.set(sales._id, {
        id: sales._id,
        name: `${sales.firstName} ${sales.lastName}`,
        email: sales.email,
        role: 'Sales Person',
        salesId: sales.salesId,
        territory: sales.territory,
        teamName: sales.teamName,
        type: 'SalesPerson',
        managedBy: sales.managedBy?._id || null,
        manager: sales.managedBy ? {
          name: `${sales.managedBy.firstName} ${sales.managedBy.lastName}`,
          role: sales.managedBy.role
        } : null,
        isActive: sales.isActive,
        children: [],
        directReportsCount: 0
      });
    });

    // Build tree structure
    const tree = [];
    
    // Build parent-child relationships
    allPeople.forEach(person => {
      if (person.managedBy) {
        const manager = allPeople.get(person.managedBy);
        if (manager) {
          manager.children.push(person);
          manager.directReportsCount++;
        }
      } else {
        // Top level (CEO or no manager)
        tree.push(person);
      }
    });

    // Sort children at each level by role hierarchy then name
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          const roleOrder = { 
            'ceo': 1, 
            'regional_manager': 2, 
            'sales_manager': 3, 
            'team_leader': 4, 
            'admin': 5, 
            'Sales Person': 6 
          };
          const aRole = roleOrder[a.role] || 10;
          const bRole = roleOrder[b.role] || 10;
          
          if (aRole !== bRole) {
            return aRole - bRole;
          }
          return a.name.localeCompare(b.name);
        });

        // Recursively sort children's children
        node.children.forEach(child => sortChildren(child));
      }
    };

    tree.forEach(rootNode => sortChildren(rootNode));
    
    return tree;
  },

  // Get specific person's hierarchy context
  async getPersonHierarchyContext(personId) {
    try {
      const response = await apiClient.get(`/org/hierarchy/${personId}`);
      return response.data;
    } catch (error) {
      console.log('🔄 Person hierarchy endpoint not available, using fallback...');
      
      // Fallback: build context from individual requests
      try {
        // Try to find the person in both admin and sales collections
        let person = null;
        let personType = null;

        try {
          const adminResponse = await apiClient.get(`/admin/admins/${personId}`);
          if (adminResponse.data.success) {
            person = adminResponse.data.admin;
            personType = 'Admin';
          }
        } catch (adminError) {
          // Person not found in admins, try sales people
          try {
            const salesResponse = await apiClient.get(`/admin/sales-people/${personId}`);
            if (salesResponse.data.success) {
              person = salesResponse.data.salesPerson;
              personType = 'SalesPerson';
            }
          } catch (salesError) {
            throw new Error('Person not found');
          }
        }

        if (!person) {
          throw new Error('Person not found');
        }

        // Get their direct reports (simplified)
        const [adminsResponse, salesResponse] = await Promise.all([
          apiClient.get('/admin/admins', { params: { managedBy: personId } }),
          apiClient.get('/admin/sales-people', { params: { managedBy: personId } })
        ]);

        const directReports = [
          ...(adminsResponse.data.admins || []).map(admin => ({
            id: admin._id,
            name: `${admin.firstName} ${admin.lastName}`,
            email: admin.email,
            role: admin.role,
            territory: admin.territory,
            teamName: admin.teamName,
            type: 'Admin',
            isActive: admin.isActive,
            directReportsCount: 0 // Would need additional queries to get this
          })),
          ...(salesResponse.data.salesPeople || []).map(sales => ({
            id: sales._id,
            name: `${sales.firstName} ${sales.lastName}`,
            email: sales.email,
            role: 'Sales Person',
            salesId: sales.salesId,
            territory: sales.territory,
            teamName: sales.teamName,
            type: 'SalesPerson',
            isActive: sales.isActive,
            directReportsCount: 0
          }))
        ];

        const personData = {
          id: person._id,
          name: `${person.firstName} ${person.lastName}`,
          email: person.email,
          role: personType === 'Admin' ? person.role : 'Sales Person',
          salesId: person.salesId || null,
          territory: person.territory,
          teamName: person.teamName,
          type: personType,
          isActive: person.isActive,
          manager: person.managedBy ? {
            id: person.managedBy._id,
            name: `${person.managedBy.firstName} ${person.managedBy.lastName}`,
            role: person.managedBy.role
          } : null,
          directReports: directReports,
          directReportsCount: directReports.length
        };

        return {
          success: true,
          person: personData
        };
      } catch (fallbackError) {
        throw new Error('Erreur lors du chargement du contexte hiérarchique');
      }
    }
  },

  // Search people in organization
  async searchPeople(query, type = null) {
    try {
      const params = { q: query };
      if (type) params.type = type;
      
      const response = await apiClient.get('/org/search', { params });
      return response.data;
    } catch (error) {
      console.log('🔄 Search endpoint not available, using fallback...');
      
      // Fallback: search in both admin and sales endpoints
      try {
        const searchPromises = [];
        
        // Search admins if not filtering for sales only
        if (!type || type === 'admin') {
          searchPromises.push(
            apiClient.get('/admin/admins', { params: { search: query, limit: 10 } })
              .then(response => ({ type: 'admins', data: response.data.admins || [] }))
              .catch(() => ({ type: 'admins', data: [] }))
          );
        }

        // Search sales people if not filtering for admin only
        if (!type || type === 'sales') {
          searchPromises.push(
            apiClient.get('/admin/sales-people', { params: { search: query, limit: 10 } })
              .then(response => ({ type: 'sales', data: response.data.salesPeople || [] }))
              .catch(() => ({ type: 'sales', data: [] }))
          );
        }

        const searchResults = await Promise.all(searchPromises);
        const results = [];
        
        // Process admin results
        const adminResults = searchResults.find(r => r.type === 'admins');
        if (adminResults) {
          adminResults.data.forEach(admin => {
            if (admin.firstName.toLowerCase().includes(query.toLowerCase()) ||
                admin.lastName.toLowerCase().includes(query.toLowerCase()) ||
                admin.email.toLowerCase().includes(query.toLowerCase()) ||
                (admin.territory && admin.territory.toLowerCase().includes(query.toLowerCase()))) {
              results.push({
                id: admin._id,
                name: `${admin.firstName} ${admin.lastName}`,
                email: admin.email,
                role: admin.role,
                territory: admin.territory,
                teamName: admin.teamName,
                type: 'Admin',
                manager: admin.managedBy ? {
                  name: `${admin.managedBy.firstName} ${admin.managedBy.lastName}`,
                  role: admin.managedBy.role
                } : null
              });
            }
          });
        }

        // Process sales results
        const salesResults = searchResults.find(r => r.type === 'sales');
        if (salesResults) {
          salesResults.data.forEach(sales => {
            if (sales.firstName.toLowerCase().includes(query.toLowerCase()) ||
                sales.lastName.toLowerCase().includes(query.toLowerCase()) ||
                sales.email.toLowerCase().includes(query.toLowerCase()) ||
                (sales.salesId && sales.salesId.toLowerCase().includes(query.toLowerCase())) ||
                (sales.territory && sales.territory.toLowerCase().includes(query.toLowerCase()))) {
              results.push({
                id: sales._id,
                name: `${sales.firstName} ${sales.lastName}`,
                email: sales.email,
                role: 'Sales Person',
                salesId: sales.salesId,
                territory: sales.territory,
                teamName: sales.teamName,
                type: 'SalesPerson',
                manager: sales.managedBy ? {
                  name: `${sales.managedBy.firstName} ${sales.managedBy.lastName}`,
                  role: sales.managedBy.role
                } : null
              });
            }
          });
        }

        // Sort results by name and limit to 20
        results.sort((a, b) => a.name.localeCompare(b.name));

        return {
          success: true,
          results: results.slice(0, 20),
          query,
          count: results.length
        };
      } catch (fallbackError) {
        throw new Error('Erreur lors de la recherche');
      }
    }
  },

  // ================================
  // PROMOTION OPERATIONS
  // ================================

  // Promote sales person to admin
  async promoteSalesPersonToAdmin(salesPersonId, promotionData) {
    try {
      const response = await apiClient.post(`/admin/promote-sales-person/${salesPersonId}`, promotionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la promotion du commercial');
    }
  },

  // Promote admin to higher role
  async promoteAdmin(adminId, promotionData) {
    try {
      const response = await apiClient.post(`/admin/promote-admin/${adminId}`, promotionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la promotion de l\'administrateur');
    }
  },

  // Demote admin to lower role or sales person
  async demoteAdmin(adminId, demotionData) {
    try {
      const response = await apiClient.post(`/admin/demote-admin/${adminId}`, demotionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la rétrogradation de l\'administrateur');
    }
  },

  // Get promotion/demotion history
  async getPromotionHistory(personId) {
    try {
      const response = await apiClient.get(`/admin/promotion-history/${personId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l\'historique des promotions');
    }
  },

  // ================================
  // VALIDATION HELPERS
  // ================================

  // Validate promotion data for sales person to admin
  validateSalesPersonPromotion(data) {
    const errors = {};

    if (!data.newRole) {
      errors.newRole = 'Le nouveau rôle est requis';
    }

    const validAdminRoles = ['admin', 'team_leader', 'sales_manager', 'regional_manager'];
    if (data.newRole && !validAdminRoles.includes(data.newRole)) {
      errors.newRole = 'Rôle administrateur invalide';
    }

    if (!data.territory || data.territory.trim().length < 2) {
      errors.territory = 'Le territoire est requis';
    }

    if (!data.reason || data.reason.trim().length < 10) {
      errors.reason = 'Une raison détaillée est requise (minimum 10 caractères)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validate admin promotion data
  validateAdminPromotion(data, currentRole) {
    const errors = {};

    if (!data.newRole) {
      errors.newRole = 'Le nouveau rôle est requis';
    }

    // Define valid promotion paths
    const promotionPaths = {
      'admin': ['team_leader'],
      'team_leader': ['sales_manager'],
      'sales_manager': ['regional_manager'],
      'regional_manager': [] // Cannot promote regional manager further
    };

    const validPromotions = promotionPaths[currentRole] || [];
    if (data.newRole && !validPromotions.includes(data.newRole)) {
      errors.newRole = `Impossible de promouvoir ${currentRole} vers ${data.newRole}`;
    }

    if (!data.reason || data.reason.trim().length < 10) {
      errors.reason = 'Une raison détaillée est requise (minimum 10 caractères)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validate demotion data
  validateDemotion(data, currentRole) {
    const errors = {};

    if (data.demoteToSalesPerson) {
      if (!data.territory || data.territory.trim().length < 2) {
        errors.territory = 'Le territoire est requis pour la rétrogradation vers commercial';
      }
    } else {
      if (!data.newRole) {
        errors.newRole = 'Le nouveau rôle est requis';
      }

      // Define valid demotion paths
      const demotionPaths = {
        'regional_manager': ['sales_manager'],
        'sales_manager': ['team_leader'],
        'team_leader': ['admin'],
        'admin': [] // Admin can only be demoted to sales person
      };

      const validDemotions = demotionPaths[currentRole] || [];
      if (data.newRole && !validDemotions.includes(data.newRole)) {
        errors.newRole = `Impossible de rétrograder ${currentRole} vers ${data.newRole}`;
      }
    }

    if (!data.reason || data.reason.trim().length < 10) {
      errors.reason = 'Une raison détaillée est requise (minimum 10 caractères)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // ================================
  // ROLE UTILITIES
  // ================================

  // Get available promotion options for a role
  getPromotionOptions(currentRole, userRole) {
    const promotionPaths = {
      'admin': ['team_leader'],
      'team_leader': ['sales_manager'],
      'sales_manager': ['regional_manager'],
      'regional_manager': []
    };

    let availablePromotions = promotionPaths[currentRole] || [];

    // Filter based on user's own role (can't promote above themselves except CEO)
    if (userRole !== 'ceo') {
      const userLevel = this.getRoleLevel(userRole);
      availablePromotions = availablePromotions.filter(role => 
        this.getRoleLevel(role) <= userLevel
      );
    }

    return availablePromotions;
  },

  // Get available demotion options for a role
  getDemotionOptions(currentRole) {
    const demotionPaths = {
      'regional_manager': ['sales_manager'],
      'sales_manager': ['team_leader'],
      'team_leader': ['admin'],
      'admin': ['sales_person'] // Special case
    };

    return demotionPaths[currentRole] || [];
  },

  // Get role hierarchy level (lower number = higher authority)
  getRoleLevel(role) {
    const levels = {
      'ceo': 1,
      'regional_manager': 2,
      'sales_manager': 3,
      'team_leader': 4,
      'admin': 5,
      'sales_person': 6
    };
    return levels[role] || 10;
  },

  // Check if user can promote/demote target person
  canManagePerson(userRole, targetRole, action = 'promote') {
    if (userRole === 'ceo') return true;

    const userLevel = this.getRoleLevel(userRole);
    const targetLevel = this.getRoleLevel(targetRole);

    // Can only manage people at lower levels
    if (action === 'promote') {
      // Can promote if target is at lower level and promotion wouldn't exceed user's level
      return targetLevel > userLevel;
    } else if (action === 'demote') {
      // Can demote if target is at same or lower level (but not equal to user)
      return targetLevel >= userLevel && targetRole !== userRole;
    }

    return false;
  },

  // ================================
  // DISPLAY HELPERS
  // ================================

  // Get role display name in French
  getRoleDisplayName(role) {
    const roleNames = {
      'ceo': 'PDG',
      'regional_manager': 'Directeur Régional',
      'sales_manager': 'Directeur des Ventes',
      'team_leader': 'Chef d\'Équipe',
      'admin': 'Administrateur',
      'sales_person': 'Commercial',
      'Sales Person': 'Commercial'
    };
    return roleNames[role] || role;
  },

  // Get role color for UI
  getRoleColor(role) {
    const colors = {
      'ceo': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
      'regional_manager': 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
      'sales_manager': 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
      'team_leader': 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      'admin': 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400',
      'sales_person': 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400',
      'Sales Person': 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400'
    };
    return colors[role] || colors.admin;
  },

  // Get promotion eligibility status
  getPromotionEligibility(person, userRole) {
    const currentRole = person.role;
    const availablePromotions = this.getPromotionOptions(currentRole, userRole);
    
    if (availablePromotions.length === 0) {
      return {
        eligible: false,
        reason: 'Aucune promotion disponible pour ce rôle'
      };
    }

    if (!this.canManagePerson(userRole, currentRole, 'promote')) {
      return {
        eligible: false,
        reason: 'Vous ne pouvez pas promouvoir cette personne'
      };
    }

    // Check person status
    if (!person.isActive || person.isSuspended) {
      return {
        eligible: false,
        reason: 'La personne doit être active pour être promue'
      };
    }

    return {
      eligible: true,
      reason: `Promotion possible vers: ${availablePromotions.map(r => this.getRoleDisplayName(r)).join(', ')}`
    };
  },

  // ================================
  // BULK OPERATIONS
  // ================================

  // Bulk promotion operations
  async bulkPromotions(operations) {
    try {
      const results = [];

      for (const operation of operations) {
        try {
          let result;
          
          if (operation.type === 'sales_to_admin') {
            result = await this.promoteSalesPersonToAdmin(operation.personId, operation.data);
          } else if (operation.type === 'admin_promotion') {
            result = await this.promoteAdmin(operation.personId, operation.data);
          } else if (operation.type === 'admin_demotion') {
            result = await this.demoteAdmin(operation.personId, operation.data);
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

  // ================================
  // ANALYTICS & REPORTING
  // ================================

  // Get promotion statistics
  async getPromotionStats(period = 'year') {
    try {
      // This would be a new endpoint to implement
      const response = await apiClient.get('/admin/promotion-stats', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      // Return empty stats if endpoint doesn't exist yet
      return {
        success: true,
        stats: {
          totalPromotions: 0,
          totalDemotions: 0,
          salesPersonPromotions: 0,
          adminPromotions: 0,
          byRole: {}
        }
      };
    }
  },

  // Generate promotion report
  async generatePromotionReport(filters = {}) {
    try {
      const response = await apiClient.get('/admin/promotion-report', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la génération du rapport');
    }
  }
};

export default promotionService;
