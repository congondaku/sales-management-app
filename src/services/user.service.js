import apiClient from './api';

export const userService = {
  // ================================
  // USER MANAGEMENT
  // ================================

  // Obtenir tous les utilisateurs
  async getUsers(params = {}) {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    }
  },

  // Obtenir un utilisateur par ID
  async getUserById(id) {
    try {
      const response = await apiClient.get(`/admin/users/${id}/details`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l\'utilisateur');
    }
  },

  // Supprimer un utilisateur
  async deleteUser(id) {
    try {
      const response = await apiClient.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  },

  // ================================
  // ADMIN MANAGEMENT (ENHANCED)
  // ================================

  // Obtenir tous les admins
  async getAdmins(params = {}) {
    try {
      const response = await apiClient.get('/admin/admins', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des administrateurs');
    }
  },

  // Mettre à jour le profil admin
  async updateAdminProfile(id, profileData) {
    try {
      const response = await apiClient.put(`/admin/admins/${id}`, profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  },

  // Supprimer un admin
  async deleteAdmin(id) {
    try {
      const response = await apiClient.delete(`/admin/admins/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de l\'administrateur');
    }
  },

  // ✅ NEW: Promouvoir un admin en Super Admin (CEO seulement)
  async promoteToSuperAdmin(adminId, reason = '') {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/promote-to-super-admin`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la promotion en Super Admin');
    }
  },

  // ✅ NEW: Rétrograder un Super Admin (CEO seulement)
  async demoteFromSuperAdmin(adminId, reason = '') {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/demote-from-super-admin`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la rétrogradation de Super Admin');
    }
  },

  // ✅ NEW: Obtenir tous les Super Admins
  async getSuperAdmins() {
    try {
      const response = await apiClient.get('/permissions/super-admins');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des Super Admins');
    }
  },

  // ================================
  // TERRITORY MANAGEMENT
  // ================================

  // Obtenir les territoires
  async getTerritories() {
    try {
      const response = await apiClient.get('/admin/territories');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des territoires');
    }
  },

  // ================================
  // PROFILE MANAGEMENT
  // ================================

  // Obtenir le profil de l'utilisateur actuel
  async getCurrentProfile() {
    try {
      const response = await apiClient.get('/admin/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du profil');
    }
  },

  // Mettre à jour le profil actuel
  async updateCurrentProfile(profileData) {
    try {
      const response = await apiClient.put('/admin/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  },

  // ================================
  // ENHANCED USER OPERATIONS
  // ================================

  // Rechercher des utilisateurs
  async searchUsers(searchParams) {
    try {
      const params = {};

      if (searchParams.search) {
        params.search = searchParams.search;
      }

      if (searchParams.territory && searchParams.territory !== 'all') {
        params.territory = searchParams.territory;
      }

      if (searchParams.salesPersonId) {
        params.salesPersonId = searchParams.salesPersonId;
      }

      if (searchParams.status && searchParams.status !== 'all') {
        params.status = searchParams.status;
      }

      if (searchParams.dateFrom) {
        params.dateFrom = searchParams.dateFrom;
      }

      if (searchParams.dateTo) {
        params.dateTo = searchParams.dateTo;
      }

      return await this.getUsers(params);
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la recherche d\'utilisateurs');
    }
  },

  // Obtenir les utilisateurs par commercial
  async getUsersBySalesPerson(salesPersonId, params = {}) {
    try {
      const response = await this.getUsers({
        ...params,
        salesPersonId
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors du chargement des utilisateurs du commercial');
    }
  },

  // Obtenir les utilisateurs par territoire
  async getUsersByTerritory(territory, params = {}) {
    try {
      const response = await this.getUsers({
        ...params,
        territory
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors du chargement des utilisateurs du territoire');
    }
  },

  // Obtenir les statistiques des utilisateurs
  async getUserStats(params = {}) {
    try {
      const users = await this.getUsers({ limit: 1, ...params });
      
      // Calculer des statistiques basiques
      const stats = {
        total: users.total || 0,
        territories: new Set(),
        salesPeople: new Set()
      };

      // Si on veut des stats détaillées, faire une requête plus large
      if (params.detailed) {
        const allUsers = await this.getUsers({ limit: 1000, ...params });
        
        allUsers.users?.forEach(user => {
          if (user.salesPersonId?.territory) {
            stats.territories.add(user.salesPersonId.territory);
          }
          if (user.salesPersonId?.salesId) {
            stats.salesPeople.add(user.salesPersonId.salesId);
          }
        });
      }

      return {
        success: true,
        stats: {
          ...stats,
          territories: Array.from(stats.territories),
          salesPeople: Array.from(stats.salesPeople),
          uniqueTerritories: stats.territories.size,
          uniqueSalesPeople: stats.salesPeople.size
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors du calcul des statistiques');
    }
  },

  // ================================
  // VALIDATION & HELPER METHODS (ENHANCED)
  // ================================

  // Valider les données utilisateur
  validateUserData(userData) {
    const errors = {};

    if (!userData.firstName || userData.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!userData.lastName || userData.lastName.trim().length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Email invalide';
    }

    if (userData.phoneNumber && userData.phoneNumber.trim().length < 10) {
      errors.phoneNumber = 'Le numéro de téléphone doit contenir au moins 10 caractères';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Valider les données admin avec support Super Admin
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

    if (!adminData.role) {
      errors.role = 'Le rôle est requis';
    }

    const validRoles = ['ceo', 'super_admin', 'regional_manager', 'sales_manager', 'team_leader', 'admin'];
    if (adminData.role && !validRoles.includes(adminData.role)) {
      errors.role = 'Rôle invalide';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // ✅ NEW: Vérifier si un rôle a accès complet
  isFullAccessRole(role) {
    return role === 'ceo' || role === 'super_admin';
  },

  // Formatter le nom complet
  formatFullName(user) {
    if (!user) return 'N/A';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
  },

  // Formatter le statut utilisateur
  formatUserStatus(user) {
    if (!user) return 'unknown';
    
    if (user.accountStatus) {
      return user.accountStatus;
    }
    
    // Déterminer le statut basé sur les dates
    if (user.lastLogin) {
      const lastLogin = new Date(user.lastLogin);
      const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLogin > 30) {
        return 'inactive';
      } else if (daysSinceLogin > 7) {
        return 'dormant';
      } else {
        return 'active';
      }
    }
    
    return 'new';
  },

  // Obtenir la couleur du statut
  getStatusColor(status) {
    const colorMap = {
      'active': 'green',
      'inactive': 'red',
      'dormant': 'yellow',
      'new': 'blue',
      'suspended': 'red',
      'pending': 'orange'
    };
    
    return colorMap[status] || 'gray';
  },

  // Formatter la date de dernière connexion
  formatLastLogin(lastLogin) {
    if (!lastLogin) return 'Jamais connecté';
    
    const loginDate = new Date(lastLogin);
    const now = new Date();
    const diffInDays = Math.floor((now - loginDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else {
      return loginDate.toLocaleDateString('fr-FR');
    }
  },

  // ✅ NEW: Formatter le rôle pour affichage
  formatRole(role) {
    const roleMap = {
      'ceo': 'PDG',
      'super_admin': 'Super Administrateur',
      'regional_manager': 'Directeur Régional',
      'sales_manager': 'Directeur des Ventes',
      'team_leader': 'Chef d\'Équipe',
      'admin': 'Administrateur',
      'sales_person': 'Commercial'
    };
    return roleMap[role] || role || 'N/A';
  },

  // ✅ NEW: Obtenir la couleur du rôle
  getRoleColor(role) {
    const colorMap = {
      'ceo': 'yellow',
      'super_admin': 'purple',
      'regional_manager': 'purple',
      'sales_manager': 'blue',
      'team_leader': 'green',
      'admin': 'gray',
      'sales_person': 'green'
    };
    return colorMap[role] || 'gray';
  },

  // ================================
  // BATCH OPERATIONS
  // ================================

  // Supprimer plusieurs utilisateurs
  async batchDeleteUsers(userIds) {
    try {
      const promises = userIds.map(id => this.deleteUser(id));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: `${successful} utilisateurs supprimés, ${failed} échecs`,
        successful,
        failed,
        details: results
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la suppression en masse');
    }
  },

  // Exporter les utilisateurs
  async exportUsers(params = {}, format = 'csv') {
    try {
      // Obtenir tous les utilisateurs sans pagination
      const allUsers = await this.getUsers({
        ...params,
        limit: 10000 // Large limit to get all
      });

      const users = allUsers.users || [];
      
      if (format === 'csv') {
        return this.exportToCSV(users);
      } else if (format === 'json') {
        return this.exportToJSON(users);
      } else {
        throw new Error('Format d\'export non supporté');
      }
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de l\'export');
    }
  },

  // Exporter en CSV
  exportToCSV(users) {
    const headers = [
      'ID',
      'Prénom',
      'Nom',
      'Email',
      'Téléphone',
      'Commercial',
      'Territoire',
      'Date d\'inscription',
      'Dernière connexion',
      'Statut'
    ];

    const rows = users.map(user => [
      user._id,
      user.firstName || '',
      user.lastName || '',
      user.email || '',
      user.phoneNumber || '',
      user.salesPersonId ? `${user.salesPersonId.firstName} ${user.salesPersonId.lastName}` : 'N/A',
      user.salesPersonId?.territory || 'N/A',
      new Date(user.createdAt).toLocaleDateString('fr-FR'),
      this.formatLastLogin(user.lastLogin),
      this.formatUserStatus(user)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return {
      content: csvContent,
      filename: `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv'
    };
  },

  // Exporter en JSON
  exportToJSON(users) {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCount: users.length,
      users: users.map(user => ({
        id: user._id,
        name: this.formatFullName(user),
        email: user.email,
        phoneNumber: user.phoneNumber,
        salesPerson: user.salesPersonId ? {
          name: this.formatFullName(user.salesPersonId),
          salesId: user.salesPersonId.salesId,
          territory: user.salesPersonId.territory
        } : null,
        status: this.formatUserStatus(user),
        registrationDate: user.createdAt,
        lastLogin: user.lastLogin
      }))
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `utilisateurs_${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json'
    };
  },

  // ================================
  // REPORTING (ENHANCED)
  // ================================

  // Générer un rapport d'utilisateurs
  async generateUserReport(params = {}) {
    try {
      const [users, stats] = await Promise.all([
        this.getUsers(params),
        this.getUserStats({ ...params, detailed: true })
      ]);

      // Grouper par statut
      const usersByStatus = {};
      users.users?.forEach(user => {
        const status = this.formatUserStatus(user);
        if (!usersByStatus[status]) {
          usersByStatus[status] = [];
        }
        usersByStatus[status].push(user);
      });

      // Grouper par territoire
      const usersByTerritory = {};
      users.users?.forEach(user => {
        const territory = user.salesPersonId?.territory || 'Sans territoire';
        if (!usersByTerritory[territory]) {
          usersByTerritory[territory] = [];
        }
        usersByTerritory[territory].push(user);
      });

      return {
        success: true,
        report: {
          period: params.period || 'all',
          totalUsers: users.total || 0,
          stats: stats.stats,
          usersByStatus: Object.keys(usersByStatus).map(status => ({
            status,
            count: usersByStatus[status].length,
            users: usersByStatus[status]
          })),
          usersByTerritory: Object.keys(usersByTerritory).map(territory => ({
            territory,
            count: usersByTerritory[territory].length,
            users: usersByTerritory[territory]
          })),
          recentUsers: users.users?.slice(0, 10) || []
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la génération du rapport');
    }
  },

  // ✅ NEW: Générer un rapport des admins
  async generateAdminReport(params = {}) {
    try {
      const admins = await this.getAdmins(params);
      
      // Grouper par rôle
      const adminsByRole = {};
      admins.admins?.forEach(admin => {
        if (!adminsByRole[admin.role]) {
          adminsByRole[admin.role] = [];
        }
        adminsByRole[admin.role].push(admin);
      });

      // Compter les Super Admins
      const superAdmins = (admins.admins || []).filter(a => a.role === 'super_admin').length;
      const ceos = (admins.admins || []).filter(a => a.role === 'ceo').length;

      return {
        success: true,
        report: {
          totalAdmins: admins.total || 0,
          ceos,
          superAdmins,
          adminsByRole: Object.keys(adminsByRole).map(role => ({
            role,
            roleLabel: this.formatRole(role),
            count: adminsByRole[role].length,
            admins: adminsByRole[role]
          })),
          hierarchy: await this.getAdminHierarchy()
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la génération du rapport admin');
    }
  },

  // ✅ NEW: Obtenir la hiérarchie admin
  async getAdminHierarchy() {
    try {
      const response = await apiClient.get('/permissions/hierarchy');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la hiérarchie');
    }
  }
};
