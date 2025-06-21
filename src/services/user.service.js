import apiClient from './api';

export const userService = {
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

  // Obtenir les territoires
  async getTerritories() {
    try {
      const response = await apiClient.get('/admin/territories');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des territoires');
    }
  },

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
  }
};
