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
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  },

  // Inscription (pour premier admin/CEO)
  async register(adminData) {
    try {
      const response = await apiClient.post('/admin/register', adminData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur d\'inscription');
    }
  },

  // Déconnexion
  logout() {
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
  // ADMIN MANAGEMENT (NEW)
  // ================================

  // Créer un nouvel administrateur
  async createAdmin(adminData) {
    try {
      const response = await apiClient.post('/admin/register', {
        ...adminData,
        // Force non-CEO creation (will require authentication)
        forceAdminCreation: true
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de l\'administrateur');
    }
  },

  // Obtenir tous les administrateurs
  async getAllAdmins(params = {}) {
    try {
      const response = await apiClient.get('/admin/admins', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des administrateurs');
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
      const response = await apiClient.put(`/admin/admins/${adminId}`, updateData);
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

  // Suspendre un administrateur
  async suspendAdmin(adminId, reason = '') {
    try {
      const response = await apiClient.put(`/admin/admins/${adminId}/suspend`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suspension');
    }
  },

  // Réactiver un administrateur
  async unsuspendAdmin(adminId) {
    try {
      const response = await apiClient.put(`/admin/admins/${adminId}/unsuspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation');
    }
  },

  // ================================
  // HIERARCHY MANAGEMENT (NEW)
  // ================================

  // Obtenir la hiérarchie complète
  async getHierarchy() {
    try {
      const response = await apiClient.get('/admin/hierarchy');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la hiérarchie');
    }
  },

  // Assigner un manager à un administrateur
  async assignManagerToAdmin(adminId, managerId) {
    try {
      const response = await apiClient.put(`/admin/admins/${adminId}/assign-manager`, {
        managerId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'assignation du manager');
    }
  },

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
  // PROFILE MANAGEMENT (NEW)
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

  // Mettre à jour le profil
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/admin/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  },

  // ================================
  // DASHBOARD (NEW)
  // ================================

  // Obtenir les données du dashboard
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
  // USER MANAGEMENT (NEW)
  // ================================

  // Obtenir tous les utilisateurs
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
  // VALIDATION HELPERS (NEW)
  // ================================

  // Vérifier si l'email est disponible
  async checkEmailAvailability(email) {
    try {
      const response = await apiClient.post('/admin/check-email', { email });
      return response.data;
    } catch (error) {
      // Si l'endpoint n'existe pas, on assume que l'email est disponible
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

    if (!adminData.role) {
      errors.role = 'Le rôle est requis';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // ================================
  // TOKEN MANAGEMENT (ENHANCED)
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
  // UTILITY METHODS (NEW)
  // ================================

  // Sauvegarder l'utilisateur et le token
  saveAuthData(authData) {
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
    const permissions = this.getCurrentUserPermissions();
    const user = this.getCurrentUser();
    
    // CEO a toutes les permissions
    if (user?.role === 'ceo') return true;
    
    return permissions[permission] === true;
  },

  // Obtenir le rôle de l'utilisateur actuel
  getCurrentUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  },

  // Vérifier si l'utilisateur est CEO
  isCEO() {
    return this.getCurrentUserRole() === 'ceo';
  },

  // Vérifier si l'utilisateur peut gérer un autre utilisateur
  canManageUser(targetUserId, targetUserRole = null) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    // CEO peut gérer tout le monde
    if (currentUser.role === 'ceo') return true;
    
    // Ne peut pas se gérer soi-même (sauf pour le profil)
    if (targetUserId === currentUser.id) return false;
    
    // Vérification de la hiérarchie (à implémenter selon la logique métier)
    return this.hasPermission('canEditAdmins');
  }
};

export default authService;
