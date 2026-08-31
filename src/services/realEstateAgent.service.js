import apiClient from './api';

const realEstateAgentService = {
  // List agents with optional filters: kycStatus, isActive, search, page, limit
  async listAgents(params = {}) {
    const query = new URLSearchParams();
    if (params.kycStatus) query.set('kycStatus', params.kycStatus);
    if (params.isActive !== undefined && params.isActive !== '') query.set('isActive', params.isActive);
    if (params.search) query.set('search', params.search);
    query.set('page', params.page || 1);
    query.set('limit', params.limit || 50);

    const res = await apiClient.get(`/real-estate-agents?${query.toString()}`);
    return res.data;
  },

  async getAgent(id) {
    const res = await apiClient.get(`/real-estate-agents/${id}`);
    return res.data;
  },

  async createAgent(data) {
    const res = await apiClient.post('/real-estate-agents', data);
    return res.data;
  },

  async updateAgent(id, data) {
    const res = await apiClient.patch(`/real-estate-agents/${id}`, data);
    return res.data;
  },

  async setKycStatus(id, status, notes) {
    const res = await apiClient.patch(`/real-estate-agents/${id}/kyc`, { status, notes });
    return res.data;
  },

  async linkUserAccount(id, userId) {
    const res = await apiClient.post(`/real-estate-agents/${id}/link-user`, { userId });
    return res.data;
  },

  async unlinkUserAccount(id) {
    const res = await apiClient.delete(`/real-estate-agents/${id}/link-user`);
    return res.data;
  },

  async deactivateAgent(id) {
    const res = await apiClient.patch(`/real-estate-agents/${id}/deactivate`);
    return res.data;
  },
};

export default realEstateAgentService;
