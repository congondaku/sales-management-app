import apiClient from './api';

const listingService = {
  // Full listing document, populated with the app account (createdBy).
  // Public route on the backend, no special auth needed beyond the
  // universal auth this app already sends.
  async getListing(id) {
    const res = await apiClient.get(`/listings/${id}`);
    return res.data; // { success, listing }
  },
};

export default listingService;
