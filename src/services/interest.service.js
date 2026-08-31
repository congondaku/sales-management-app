import apiClient from './api';

const interestService = {
  // Every user who has shown interest in something, with a count. Primary dashboard view.
  async getInterestedUsers(page = 1, limit = 30) {
    const res = await apiClient.get(`/interests/dashboard/users?page=${page}&limit=${limit}`);
    return res.data;
  },

  // All listings a specific user has shown interest in
  async getInterestsForUser(userId) {
    const res = await apiClient.get(`/interests/dashboard/users/${userId}`);
    return res.data;
  },

  // Everyone interested in one listing
  async getInterestsForListing(listingId) {
    const res = await apiClient.get(`/interests/dashboard/listings/${listingId}`);
    return res.data;
  },

  // status: 'new' | 'contacted' | 'closed', handledBy: RealEstateAgent id or null
  async updateInterestStatus(interestId, { status, handledBy } = {}) {
    const body = {};
    if (status !== undefined) body.status = status;
    if (handledBy !== undefined) body.handledBy = handledBy;
    const res = await apiClient.patch(`/interests/${interestId}`, body);
    return res.data;
  },
};

export default interestService;
