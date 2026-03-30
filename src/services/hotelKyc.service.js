import apiClient from './api';

const getBase = () =>
  localStorage.getItem('admin_token')
    ? '/admin/sales-people/hotel-kyc'
    : '/sales-people/hotel-kyc';

const buildPayload = (data) => {
  const fileKeys = ['rccmDoc', 'nationalIdDoc', 'nifDoc', 'hotelPhotos'];
  const hasFiles = fileKeys.some(k => data[k] instanceof File || Array.isArray(data[k]));
  if (!hasFiles) return [data, {}];
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'hotelPhotos' && Array.isArray(value)) {
      value.forEach(f => form.append('hotelPhotos', f));
    } else if (value instanceof File) {
      form.append(key, value);
    } else {
      form.append(key, String(value));
    }
  });
  return [form, { headers: { 'Content-Type': 'multipart/form-data' } }];
};

const hotelKycService = {
  getPending: (page = 1, limit = 20) =>
    apiClient.get(`${getBase()}/pending`, { params: { page, limit } }).then(r => r.data),

  getAccount: (id) =>
    apiClient.get(`${getBase()}/${id}`).then(r => r.data),

  approve: (id) =>
    apiClient.post(`${getBase()}/${id}/approve`).then(r => r.data),

  reject: (id, reason) =>
    apiClient.post(`${getBase()}/${id}/reject`, { reason }).then(r => r.data),

  getAll: (params = {}) =>
    apiClient.get(`${getBase()}/all`, { params }).then(r => r.data),

  getDetail: (id) =>
    apiClient.get(`${getBase()}/${id}/detail`).then(r => r.data),

  suspend: (id, reason) =>
    apiClient.post(`${getBase()}/${id}/suspend`, { reason }).then(r => r.data),

  unsuspend: (id) =>
    apiClient.post(`${getBase()}/${id}/unsuspend`).then(r => r.data),

  ban: (id, reason) =>
    apiClient.post(`${getBase()}/${id}/ban`, { reason }).then(r => r.data),

  adminUpdate: (id, data) => {
    const [payload, config] = buildPayload(data);
    return apiClient.put(`${getBase()}/${id}/admin-update`, payload, config).then(r => r.data);
  },

  requestEdit: (id, data) => {
    const [payload, config] = buildPayload(data);
    return apiClient.post(`${getBase()}/${id}/request-edit`, payload, config).then(r => r.data);
  },

  // Remove a single KYC hotel photo (admin only, applies immediately)
  removeKycPhoto: (id, url) =>
    apiClient.delete(`${getBase()}/${id}/kyc-photo`, { data: { url } }).then(r => r.data),

  getPendingEdits: (params = {}) =>
    apiClient.get(`${getBase()}/edit-requests/pending`, { params }).then(r => r.data),

  reviewEdit: (requestId, action, rejectionReason) =>
    apiClient.post(`${getBase()}/edit-requests/${requestId}/review`, { action, rejectionReason }).then(r => r.data),

  lock: (id) =>
    apiClient.post(`${getBase()}/${id}/lock`).then(r => r.data),

  refreshLock: (id) =>
    apiClient.post(`${getBase()}/${id}/refresh-lock`).then(r => r.data),

  unlock: (id) =>
    apiClient.post(`${getBase()}/${id}/unlock`).then(r => r.data),
};

export default hotelKycService;
