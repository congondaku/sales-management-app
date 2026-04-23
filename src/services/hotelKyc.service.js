import apiClient from './api';

const getBase = () =>
  localStorage.getItem('admin_token')
    ? '/admin/sales-people/hotel-kyc'
    : '/sales-people/hotel-kyc';

const getHotelAccountsBase = () => '/hotel-accounts';

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
  // ── KYC Queue (pending KYC submissions only) ──────────────────
  getPending: (page = 1, limit = 20) =>
    apiClient.get(`${getBase()}/pending`, { params: { page, limit } }).then(r => r.data),

  // Single account full details
  getAccount: (id) =>
    apiClient.get(`${getBase()}/${id}`).then(r => r.data),

  // KYC approve / reject
  approve: (id) =>
    apiClient.post(`${getBase()}/${id}/approve`).then(r => r.data),

  reject: (id, reason) =>
    apiClient.post(`${getBase()}/${id}/reject`, { reason }).then(r => r.data),

  // ── Operators list (all statuses) ─────────────────────────────
  getAll: (params = {}) =>
    apiClient.get(`${getBase()}/all`, { params }).then(r => r.data),

  // Single operator full detail (used by OperatorDetail drill-in)
  getDetail: (id) =>
    apiClient.get(`${getBase()}/${id}/detail`).then(r => r.data),

  // ── Pending profile reviews (active accounts with changes) ────
  // Calls /api/hotel-accounts/ directly — not the KYC sales route
  getPendingProfileReviews: (params = {}) =>
    apiClient.get(`${getHotelAccountsBase()}/pending-profile-reviews`, { params }).then(r => r.data),

  approveProfileUpdate: (id) =>
    apiClient.post(`${getHotelAccountsBase()}/${id}/approve-profile`).then(r => r.data),

  rejectProfileUpdate: (id, reason) =>
    apiClient.post(`${getHotelAccountsBase()}/${id}/reject-profile`, { reason }).then(r => r.data),

  // ── Actions (suspend / unsuspend / ban) ───────────────────────
  suspend: (id, reason) =>
    apiClient.post(`${getBase()}/${id}/suspend`, { reason }).then(r => r.data),

  unsuspend: (id) =>
    apiClient.post(`${getBase()}/${id}/unsuspend`).then(r => r.data),

  ban: (id, reason) =>
    apiClient.post(`${getBase()}/${id}/ban`, { reason }).then(r => r.data),

  // Admin edit (direct apply) / salesperson edit (submit for review)
  adminUpdate: (id, payload) => {
    const [data, config] = buildPayload(payload);
    return apiClient.put(`${getBase()}/${id}/admin-update`, data, config).then(r => r.data);
  },

  requestEdit: (id, payload) => {
    const [data, config] = buildPayload(payload);
    return apiClient.post(`${getBase()}/${id}/request-edit`, data, config).then(r => r.data);
  },

  reviewEdit: (requestId, action, rejectionReason) =>
    apiClient.post(`${getBase()}/edit-requests/${requestId}/review`, { action, rejectionReason }).then(r => r.data),

  // KYC photo removal (admin only)
  removeKycPhoto: (id, url) =>
    apiClient.delete(`${getBase()}/${id}/kyc-photo`, { data: { url } }).then(r => r.data),

  // ── Review locks ──────────────────────────────────────────────
  lock: (id) =>
    apiClient.post(`${getBase()}/${id}/lock`).then(r => r.data),

  refreshLock: (id) =>
    apiClient.post(`${getBase()}/${id}/refresh-lock`).then(r => r.data),

  unlock: (id) =>
    apiClient.post(`${getBase()}/${id}/unlock`).then(r => r.data),
};

export default hotelKycService;
