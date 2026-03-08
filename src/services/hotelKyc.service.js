import apiClient from './api';

const BASE = '/admin/sales-people/hotel-kyc';

const hotelKycService = {
  // Queue
  getPending: (page = 1, limit = 20) =>
    apiClient.get(`${BASE}/pending`, { params: { page, limit } }).then(r => r.data),

  // Single account full details
  getAccount: (id) =>
    apiClient.get(`${BASE}/${id}`).then(r => r.data),

  // Approve
  approve: (id) =>
    apiClient.post(`${BASE}/${id}/approve`).then(r => r.data),

  // Reject
  reject: (id, reason) =>
    apiClient.post(`${BASE}/${id}/reject`, { reason }).then(r => r.data),

  // Suspend
  suspend: (id, reason) =>
    apiClient.post(`${BASE}/${id}/suspend`, { reason }).then(r => r.data),

  // Lock — called when reviewer opens detail page
  lock: (id) =>
    apiClient.post(`${BASE}/${id}/lock`).then(r => r.data),

  // Refresh lock — keepalive every 10 min
  refreshLock: (id) =>
    apiClient.post(`${BASE}/${id}/refresh-lock`).then(r => r.data),

  // Unlock — called on approve/reject/leave
  unlock: (id) =>
    apiClient.post(`${BASE}/${id}/unlock`).then(r => r.data),
};

export default hotelKycService;
