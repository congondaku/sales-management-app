import apiClient from './api';

export const promoCodeService = {
  async getPromoCodes() {
    try {
      const response = await apiClient.get('/aggregator-promo-codes');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des codes promo');
    }
  },

  async createPromoCode(promoData) {
    try {
      const response = await apiClient.post('/aggregator-promo-codes', promoData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du code promo');
    }
  },

  async deactivatePromoCode(id) {
    try {
      const response = await apiClient.post(`/aggregator-promo-codes/${id}/deactivate`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la désactivation du code promo');
    }
  },

  // UPDATED — partnerUserId replaces partnerEmail as the required
  // field. A promo code must now reference a REAL selected user
  // account, not a freely-typed email — that's the actual security
  // fix (login checks that user's real password, not a made-up one).
  validatePromoCodeData(data) {
    const errors = {};

    if (!data.code || data.code.trim().length < 3) {
      errors.code = 'Le code doit contenir au moins 3 caractères';
    } else if (!/^[A-Z0-9]+$/.test(data.code.trim().toUpperCase())) {
      errors.code = 'Le code ne peut contenir que des lettres et des chiffres';
    }

    if (!data.discountType) {
      errors.discountType = 'Le type de réduction est requis';
    }

    if (!data.discountValue || isNaN(data.discountValue) || Number(data.discountValue) <= 0) {
      errors.discountValue = 'La valeur de réduction doit être un nombre positif';
    } else if (data.discountType === 'percent' && Number(data.discountValue) > 100) {
      errors.discountValue = 'Un pourcentage ne peut pas dépasser 100';
    }

    if (!data.partnerUserId) {
      errors.partnerUserId = 'Sélectionnez un partenaire dans la liste des utilisateurs';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  },
};

export default promoCodeService;
