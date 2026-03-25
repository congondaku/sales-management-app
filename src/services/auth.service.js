import apiClient from './api';

export const authService = {
  // ================================
  // BASIC AUTHENTICATION
  // ================================
  
  // Connexion
  async login(email, password) {
    try {
      const response = await apiClient.post('/admin/login', {
        email,
        password
      });
      
      if (response.data.success) {
        // Sauvegarder les données d'authentification
        this.saveAuthData(response.data);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  },

  // Inscription (pour premier admin/CEO)
  async register(adminData) {
    try {
      const response = await apiClient.post('/admin/register', adminData);
      
      if (response.data.success) {
        // Sauvegarder les données d'authentification
        this.saveAuthData(response.data);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur d\'inscription');
    }
  },

  // Déconnexion
  logout() {
    console.log('🚪 Logging out admin user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    return !!(token && user);
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  // Obtenir le token
  getToken() {
    return localStorage.getItem('admin_token');
  },

  // ================================
  // ADMIN MANAGEMENT (FIXED ENDPOINTS)
  // ================================

  // Create admin using correct endpoint
  async createAdmin(adminData) {
    try {
      const response = await apiClient.post('/permissions/admin/create', adminData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de l\'administrateur');
    }
  },

  // Get all admins from correct endpoint
  async getAllAdmins(params = {}) {
    try {
      const response = await apiClient.get('/admin/admins', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des administrateurs');
    }
  },

  // Suspend admin using correct endpoint
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

  // Unsuspend admin using correct endpoint
  async unsuspendAdmin(adminId) {
    try {
      const response = await apiClient.put(`/permissions/admin/${adminId}/unsuspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation');
    }
  },

  // Obtenir un administrateur par ID
  async getAdminById(adminId) {
    try {
      const response = await apiClient.get(`/admin/admins/${adminId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l\'administrateur');
    }
  },

  // Mettre à jour un administrateur
  async updateAdmin(adminId, updateData) {
    try {
      const response = await apiClient.put(`/admin/profile/${adminId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  },

  // Supprimer un administrateur
  async deleteAdmin(adminId) {
    try {
      const response = await apiClient.delete(`/admin/admins/${adminId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  },

  // ================================
  // HIERARCHY MANAGEMENT (FIXED)
  // ================================

  // Use correct endpoint for hierarchy
  async getHierarchy() {
    try {
      const response = await apiClient.get('/permissions/hierarchy');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la hiérarchie');
    }
  },

  // Obtenir les territoires
  async getTerritories() {
    try {
      // This endpoint might not exist in your backend - will return empty for now
      return { success: true, territories: [] };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des territoires');
    }
  },

  // ================================
  // PROFILE MANAGEMENT
  // ================================

  // Obtenir le profil de l'admin connecté
  async getProfile() {
    try {
      const response = await apiClient.get('/admin/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du profil');
    }
  },

  // Use correct endpoint for profile update
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/admin/profile', profileData);
      
      if (response.data.success) {
        // Mettre à jour les données locales
        this.updateLocalUser(response.data.admin);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  },

  // ================================
  // DASHBOARD (FIXED)
  // ================================

  // Use correct endpoint for dashboard
  async getDashboard(period = 'month') {
    try {
      const response = await apiClient.get('/admin/dashboard', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du dashboard');
    }
  },

  // ================================
  // USER MANAGEMENT (FIXED)
  // ================================

  // Use correct endpoint for users
  async getAllUsers(params = {}) {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    }
  },

  // Obtenir les détails d'un utilisateur
  async getUserDetails(userId) {
    try {
      const response = await apiClient.get(`/admin/users/${userId}/details`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des détails utilisateur');
    }
  },

  // Supprimer un utilisateur
  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  },

  // ================================
  // VALIDATION HELPERS
  // ================================

  // Vérifier si l'email est disponible
  async checkEmailAvailability(email) {
    try {
      // This endpoint might not exist - return available for now
      return { available: true };
    } catch (error) {
      return { available: true };
    }
  },

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

    if (adminData.password && adminData.confirmPassword && adminData.password !== adminData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!adminData.role) {
      errors.role = 'Le rôle est requis';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Valider les permissions
  validatePermissions(permissions) {
    const errors = {};
    const validPermissions = [
      'canCreateSalesPeople', 'canEditSalesPeople', 'canDeleteSalesPeople', 'canViewAllSalesPeople',
      'canViewCommissions', 'canSetCommissionRates', 'canProcessPayouts', 'canSeeCommissionRates',
      'canCreateAdmins', 'canEditAdmins', 'canDeleteAdmins',
      'canViewAnalytics', 'canViewAllData',
      'canManageSystem', 'canManagePermissions'
    ];

    Object.keys(permissions).forEach(permission => {
      if (!validPermissions.includes(permission)) {
        errors[permission] = 'Permission invalide';
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // ================================
  // TOKEN MANAGEMENT
  // ================================

  // Vérifier la validité du token
  async verifyToken() {
    try {
      const response = await apiClient.get('/admin/verify-token');
      return response.data;
    } catch (error) {
      // Token invalide, déconnecter l'utilisateur
      this.logout();
      throw new Error('Session expirée');
    }
  },

  // Rafraîchir le token
  async refreshToken() {
    try {
      const response = await apiClient.post('/admin/refresh-token');
      if (response.data.token) {
        localStorage.setItem('admin_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      this.logout();
      throw new Error('Impossible de rafraîchir la session');
    }
  },

  // ================================
  // UTILITY METHODS (ENHANCED)
  // ================================

  // Sauvegarder l'utilisateur et le token
  saveAuthData(authData) {
    console.log('💾 Saving auth data for admin');
    if (authData.token) {
      localStorage.setItem('admin_token', authData.token);
    }
    if (authData.admin) {
      localStorage.setItem('admin_user', JSON.stringify(authData.admin));
    }
  },

  // Mettre à jour les données utilisateur en local
  updateLocalUser(userData) {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    }
  },

  // Obtenir les permissions de l'utilisateur actuel
  getCurrentUserPermissions() {
    const user = this.getCurrentUser();
    return user?.permissions || {};
  },

  // Vérifier si l'utilisateur actuel a une permission
  hasPermission(permission) {
    const user = this.getCurrentUser();
    const permissions = this.getCurrentUserPermissions();
    
    // CEO et Super Admin ont toutes les permissions
    if (user?.role === 'ceo' || user?.role === 'super_admin') return true;
    
    return permissions[permission] === true;
  },

  // Obtenir le rôle de l'utilisateur actuel
  getCurrentUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  },

  // Vérifier si l'utilisateur est CEO ou Super Admin
  isFullAccess() {
    const role = this.getCurrentUserRole();
    return role === 'ceo' || role === 'super_admin';
  },

  // Vérifier si l'utilisateur est CEO
  isCEO() {
    return this.getCurrentUserRole() === 'ceo';
  },

  // Vérifier si l'utilisateur est Super Admin
  isSuperAdmin() {
    return this.getCurrentUserRole() === 'super_admin';
  },

  // Vérifier si l'utilisateur peut gérer un autre utilisateur
  canManageUser(targetUserId, targetUserRole = null) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    // CEO et Super Admin peuvent gérer tout le monde
    if (currentUser.role === 'ceo' || currentUser.role === 'super_admin') return true;
    
    // Ne peut pas se gérer soi-même (sauf pour le profil)
    if (targetUserId === currentUser.id) return false;
    
    // Vérification de la hiérarchie (à implémenter selon la logique métier)
    return this.hasPermission('canEditAdmins');
  },

  // Obtenir le nom complet de l'utilisateur
  getCurrentUserFullName() {
    const user = this.getCurrentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  },

  // Obtenir les données d'affichage de l'utilisateur
  getCurrentUserDisplayData() {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      territory: user.territory,
      teamName: user.teamName,
      permissions: user.permissions || {},
      isCEO: user.role === 'ceo',
      isSuperAdmin: user.role === 'super_admin',
      isFullAccess: user.role === 'ceo' || user.role === 'super_admin'
    };
  },

  // Obtenir le libellé du rôle
  getRoleLabel(role = null) {
    const userRole = role || this.getCurrentUserRole();
    const roles = {
      'ceo': 'PDG',
      'super_admin': 'Super Administrateur',
      'regional_manager': 'Directeur Régional',
      'sales_manager': 'Directeur des Ventes',
      'team_leader': 'Chef d\'Équipe',
      'admin': 'Administrateur'
    };
    return roles[userRole] || userRole || 'Utilisateur';
  },

  // Vérifier l'état de la session
  async checkSession() {
    if (!this.isAuthenticated()) {
      return { valid: false, reason: 'No authentication data' };
    }

    try {
      await this.verifyToken();
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  },

  // Nettoyer toutes les données d'authentification
  clearAllAuthData() {
    console.log('🧹 Clearing all admin auth data');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  // Auto-refresh token avant expiration
  setupTokenRefresh(tokenExpiryTime) {
    // Refresh token 5 minutes before expiry
    const refreshTime = tokenExpiryTime - (5 * 60 * 1000);
    const timeUntilRefresh = refreshTime - Date.now();

    if (timeUntilRefresh > 0) {
      setTimeout(async () => {
        try {
          await this.refreshToken();
          console.log('🔄 Token refreshed automatically');
        } catch (error) {
          console.error('❌ Auto token refresh failed:', error);
          this.logout();
        }
      }, timeUntilRefresh);
    }
  },

  // Obtenir les statistiques de session
  getSessionStats() {
    const user = this.getCurrentUser();
    const token = this.getToken();
    
    if (!user || !token) return null;

    return {
      isAuthenticated: this.isAuthenticated(),
      userRole: user.role,
      loginTime: user.lastLogin || 'Unknown',
      territory: user.territory,
      permissionsCount: Object.keys(user.permissions || {}).length,
      isCEO: this.isCEO(),
      isSuperAdmin: this.isSuperAdmin(),
      isFullAccess: this.isFullAccess()
    };
  },

  // ✅ NEW: Vérifier si l'utilisateur peut accéder à une page
  canAccessPage(pageId) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // CEO et Super Admin ont accès à toutes les pages
    if (user.role === 'ceo' || user.role === 'super_admin') return true;
    
    // Page-specific permissions logic
    const pagePermissions = {
      'sales-people': 'canViewAllSalesPeople',
      'commissions': 'canViewCommissions',
      'analytics': 'canViewAnalytics',
      'users': 'canViewAllData',
      'permissions': 'canManagePermissions',
      'settings': 'canViewAllData',
      'dashboard': null, // Dashboard accessible to all admins
      'ads': null, // Ads accessible to all admins
      'freelistings': null, // Free listings accessible to all admins
      'hotel-kyc': null, // Hotel KYC accessible to all admins
      'property-requests': null, // Property requests accessible to all admins
      'communes': null // Communes accessible to all admins
    };
    
    const requiredPermission = pagePermissions[pageId];
    if (!requiredPermission) return true; // No permission required
    
    return this.hasPermission(requiredPermission);
  }
};

export default authService;
