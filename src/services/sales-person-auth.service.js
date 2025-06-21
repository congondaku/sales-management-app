import apiClient from './api';

export const salesPersonAuthService = {
  // ================================
  // SALES PERSON AUTHENTICATION
  // ================================

  // Connexion commercial
  async login(email, password) {
    try {
      const response = await apiClient.post('/sales/login', {
        email,
        password
      });
      
      if (response.data.success) {
        // Sauvegarder le token et les données du commercial
        localStorage.setItem('sales_token', response.data.token);
        localStorage.setItem('sales_person', JSON.stringify(response.data.salesPerson));
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de connexion commercial');
    }
  },

  // Déconnexion
  logout() {
    localStorage.removeItem('sales_token');
    localStorage.removeItem('sales_person');
  },

  // Vérifier si connecté
  isAuthenticated() {
    const token = localStorage.getItem('sales_token');
    const salesPerson = localStorage.getItem('sales_person');
    return !!(token && salesPerson);
  },

  // Obtenir le commercial actuel
  getCurrentSalesPerson() {
    const salesPerson = localStorage.getItem('sales_person');
    return salesPerson ? JSON.parse(salesPerson) : null;
  },

  // Obtenir le token
  getToken() {
    return localStorage.getItem('sales_token');
  },

  // ================================
  // DASHBOARD & PROFILE
  // ================================

  // Obtenir le dashboard du commercial
  async getDashboard(period = 'month') {
    try {
      const response = await apiClient.get('/sales/dashboard', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur dashboard commercial');
    }
  },

  // Obtenir le profil
  async getProfile() {
    try {
      const response = await apiClient.get('/sales/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur profil commercial');
    }
  },

  // Mettre à jour le profil
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/sales/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur mise à jour profil');
    }
  },

  // Changer le mot de passe
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/sales/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur changement mot de passe');
    }
  },

  // ================================
  // USER REGISTRATION
  // ================================

  // Inscrire un nouvel utilisateur
  async registerUser(userData) {
    try {
      const response = await apiClient.post('/sales/register-user', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur inscription utilisateur');
    }
  },

  // Obtenir mes utilisateurs
  async getMyUsers(params = {}) {
    try {
      const response = await apiClient.get('/sales/my-users', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur chargement utilisateurs');
    }
  },

  // ================================
  // COMMISSIONS
  // ================================

  // Obtenir mes commissions
  async getMyCommissions(params = {}) {
    try {
      const response = await apiClient.get('/sales/my-commissions', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur chargement commissions');
    }
  },

  // ================================
  // PERFORMANCE
  // ================================

  // Obtenir mes performances
  async getPerformance(period = 'month') {
    try {
      const response = await apiClient.get('/sales/performance', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur performance');
    }
  },

  // ================================
  // UTILITY METHODS
  // ================================

  // Mettre à jour les données locales
  updateLocalSalesPerson(salesPersonData) {
    const current = this.getCurrentSalesPerson();
    if (current) {
      const updated = { ...current, ...salesPersonData };
      localStorage.setItem('sales_person', JSON.stringify(updated));
    }
  },

  // Obtenir le territoire du commercial
  getTerritory() {
    const salesPerson = this.getCurrentSalesPerson();
    return salesPerson?.territory || null;
  },

  // Obtenir le nom complet
  getFullName() {
    const salesPerson = this.getCurrentSalesPerson();
    return salesPerson ? `${salesPerson.firstName} ${salesPerson.lastName}` : '';
  },

  // Obtenir l'ID de vente
  getSalesId() {
    const salesPerson = this.getCurrentSalesPerson();
    return salesPerson?.salesId || null;
  }
};
