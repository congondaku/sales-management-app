import apiClient from './api';

export const invoiceService = {
  // Liste toutes les factures (admin et commerciaux voient les mêmes —
  // l'API scope déjà côté serveur par entreprise, pas par créateur)
  async getInvoices(params = {}) {
    try {
      const response = await apiClient.get('/invoices', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des factures');
    }
  },

  async getInvoice(id) {
    try {
      const response = await apiClient.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la facture');
    }
  },

  async getInvoiceSummary() {
    try {
      const response = await apiClient.get('/invoices/summary');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du résumé');
    }
  },

  async createInvoice(invoiceData) {
    try {
      const response = await apiClient.post('/invoices', invoiceData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la facture');
    }
  },

  async cancelInvoice(id) {
    try {
      const response = await apiClient.post(`/invoices/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'annulation de la facture');
    }
  },

  async markPaidCash(id) {
    try {
      const response = await apiClient.post(`/invoices/${id}/mark-paid-cash`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du marquage comme payée');
    }
  },

  // Validation légère côté client — miroir de validateSalesPersonData
  // dans sales.service.js, même convention
  validateInvoiceData(data) {
    const errors = {};

    if (!data.recipientName || data.recipientName.trim().length < 2) {
      errors.recipientName = 'Le nom du destinataire est requis';
    }
    if (!data.amount || isNaN(data.amount) || Number(data.amount) <= 0) {
      errors.amount = 'Le montant doit être un nombre positif';
    }
    if (!data.currency) {
      errors.currency = 'La devise est requise';
    }
    if (data.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.recipientEmail)) {
      errors.recipientEmail = 'Email invalide';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  },
};
