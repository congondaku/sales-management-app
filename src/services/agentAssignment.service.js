import apiClient from './api';

const agentAssignmentService = {
  async assignAgent(clientId, agentId, notes) {
    const res = await apiClient.post('/agent-assignments/assign', { clientId, agentId, notes: notes || undefined });
    return res.data;
  },

  async unassignAgent(clientId) {
    const res = await apiClient.post('/agent-assignments/unassign', { clientId });
    return res.data;
  },

  async getClientAssignment(clientId) {
    const res = await apiClient.get(`/agent-assignments/client/${clientId}`);
    return res.data;
  },

  async getAssignmentHistory(clientId) {
    const res = await apiClient.get(`/agent-assignments/client/${clientId}/history`);
    return res.data;
  },

  async getAgentClients(agentId) {
    const res = await apiClient.get(`/agent-assignments/agent/${agentId}/clients`);
    return res.data;
  },
};

export default agentAssignmentService;
