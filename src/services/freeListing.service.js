import api from './api';

class FreeListingService {
  /**
   * Create a new listing (Step 1)
   */
  async createListing(listingData) {
    try {
      const response = await api.post('/listings/add', listingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Activate free listing (Step 2 - Admin)
   */
  async activateFreeListing(listingId, duration, unit) {
    try {
      const response = await api.post('/free-listings/admin', {
        listingId,
        duration,
        unit,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Activate free listing (Step 2 - Salesperson)
   */
  async activateFreeListingSalesperson(listingId, duration, unit) {
    try {
      const response = await api.post('/free-listings/salesperson', {
        listingId,
        duration,
        unit,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Get all listings (with filters)
   */
  async getAllListings(filters = {}) {
    try {
      const response = await api.get('/listings', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Get unpaid listings
   */
  async getUnpaidListings(page = 1, limit = 20) {
    try {
      const response = await api.get('/listings/unpaid', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Get free listing info
   */
  async getFreeListingInfo(listingId) {
    try {
      const response = await api.get(`/free-listings/admin/${listingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Update listing
   */
  async updateListing(listingId, listingData) {
    try {
      const response = await api.put(`/listings/update/${listingId}`, listingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Delete listing
   */
  async deleteListing(listingId) {
    try {
      const response = await api.delete(`/listings/${listingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Get available locations
   */
  async getAvailableLocations() {
    try {
      const response = await api.get('/listings/locations/villes');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  /**
   * Get administrative divisions
   */
  async getAdministrativeDivisions() {
    try {
      const response = await api.get('/administrative-divisions/provinces');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new FreeListingService();
