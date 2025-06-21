import apiClient from './api';

export const authService = {
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
  }
};
