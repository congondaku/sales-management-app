import apiClient from './api';

export const commissionService = {
  // ================================
  // COMMISSION MANAGEMENT
  // ================================

  // Obtenir toutes les commissions
  async getCommissions(params = {}) {
    try {
      const response = await apiClient.get('/admin/commissions', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des commissions');
    }
  },

  // Obtenir les statistiques des commissions
  async getCommissionStats() {
    try {
      const response = await apiClient.get('/admin/commissions/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des statistiques');
    }
  },

  // Obtenir une commission par ID
  async getCommission(id) {
    try {
      const response = await apiClient.get(`/admin/commissions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la commission');
    }
  },

  // Marquer une commission comme payée
  async markCommissionPaid(id, notes = '') {
    try {
      const response = await apiClient.put(`/admin/commissions/${id}/mark-paid`, {
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du marquage comme payée');
    }
  },

  // Paiement groupé de commissions
  async batchPayoutCommissions(commissionIds, notes = '') {
    try {
      const response = await apiClient.post('/admin/commissions/batch-payout', {
        commissionIds,
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du paiement groupé');
    }
  },

  // Annuler une commission
  async cancelCommission(id, reason = '') {
    try {
      const response = await apiClient.put(`/admin/commissions/${id}/cancel`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  },

  // ================================
  // ENHANCED COMMISSION OPERATIONS (NEW)
  // ================================

  // ✅ NEW: Obtenir les commissions par commercial
  async getCommissionsBySalesPerson(salesPersonId, params = {}) {
    try {
      const response = await this.getCommissions({
        ...params,
        salesPersonId
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors du chargement des commissions du commercial');
    }
  },

  // ✅ NEW: Obtenir les commissions par statut
  async getCommissionsByStatus(status, params = {}) {
    try {
      const response = await this.getCommissions({
        ...params,
        status
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors du chargement des commissions par statut');
    }
  },

  // ✅ NEW: Obtenir les commissions par période
  async getCommissionsByPeriod(period, params = {}) {
    try {
      const response = await this.getCommissions({
        ...params,
        period
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Erreur lors du chargement des commissions par période');
    }
  },

  // ✅ NEW: Obtenir le résumé des commissions
  async getCommissionSummary(params = {}) {
    try {
      const [stats, commissions] = await Promise.all([
        this.getCommissionStats(),
        this.getCommissions({ limit: 1, ...params })
      ]);

      return {
        success: true,
        summary: {
          stats: stats.stats,
          total: commissions.pagination?.total || 0,
          hideCommissionRates: commissions.hideCommissionRates || false
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors du chargement du résumé des commissions');
    }
  },

  // ================================
  // VALIDATION & HELPER METHODS (NEW)
  // ================================

  // ✅ NEW: Valider les IDs de commission pour paiement groupé
  validateCommissionIds(commissionIds) {
    const errors = {};

    if (!Array.isArray(commissionIds)) {
      errors.commissionIds = 'Les IDs de commission doivent être un tableau';
      return { isValid: false, errors };
    }

    if (commissionIds.length === 0) {
      errors.commissionIds = 'Au moins une commission doit être sélectionnée';
      return { isValid: false, errors };
    }

    if (commissionIds.length > 100) {
      errors.commissionIds = 'Maximum 100 commissions peuvent être traitées en une fois';
      return { isValid: false, errors };
    }

    // Vérifier que tous les IDs sont des chaînes valides
    const invalidIds = commissionIds.filter(id => 
      typeof id !== 'string' || id.trim().length === 0
    );

    if (invalidIds.length > 0) {
      errors.commissionIds = 'Tous les IDs de commission doivent être des chaînes valides';
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  },

  // ✅ NEW: Formatter le statut de commission
  formatCommissionStatus(status) {
    const statusMap = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'paid_out': 'Payée',
      'cancelled': 'Annulée',
      'orphaned': 'Orpheline'
    };
    
    return statusMap[status] || status;
  },

  // ✅ NEW: Obtenir la couleur du statut
  getStatusColor(status) {
    const colorMap = {
      'pending': 'yellow',
      'confirmed': 'blue',
      'paid_out': 'green',
      'cancelled': 'red',
      'orphaned': 'gray'
    };
    
    return colorMap[status] || 'gray';
  },

  // ✅ NEW: Formatter le montant de commission
  formatCommissionAmount(amount, currency = 'USD', hideAmount = false) {
    if (hideAmount) {
      return '****';
    }
    
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  },

  // ✅ NEW: Calculer le total des commissions
  calculateCommissionTotal(commissions, hideAmounts = false) {
    if (hideAmounts) {
      return 'Montant masqué';
    }
    
    const total = commissions.reduce((sum, commission) => {
      return sum + (commission.commissionAmount || 0);
    }, 0);
    
    return this.formatCommissionAmount(total);
  },

  // ✅ NEW: Grouper les commissions par statut
  groupCommissionsByStatus(commissions) {
    const grouped = commissions.reduce((acc, commission) => {
      const status = commission.status || 'unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(commission);
      return acc;
    }, {});
    
    return Object.keys(grouped).map(status => ({
      status,
      statusLabel: this.formatCommissionStatus(status),
      count: grouped[status].length,
      commissions: grouped[status],
      total: grouped[status].reduce((sum, c) => sum + (c.commissionAmount || 0), 0)
    }));
  },

  // ✅ NEW: Filtrer les commissions payables
  getPayableCommissions(commissions) {
    return commissions.filter(commission => 
      commission.status === 'confirmed' && 
      !commission.paidOutAt
    );
  },

  // ================================
  // BATCH OPERATIONS (NEW)
  // ================================

  // ✅ NEW: Opérations en masse sur les commissions
  async batchUpdateCommissions(commissionIds, operation, data = {}) {
    try {
      const validation = this.validateCommissionIds(commissionIds);
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0]);
      }

      let promises = [];

      switch (operation) {
        case 'mark_paid':
          promises = commissionIds.map(id => 
            this.markCommissionPaid(id, data.notes || '')
          );
          break;
        
        case 'cancel':
          promises = commissionIds.map(id => 
            this.cancelCommission(id, data.reason || '')
          );
          break;
        
        case 'batch_payout':
          return await this.batchPayoutCommissions(commissionIds, data.notes || '');
        
        default:
          throw new Error('Opération non supportée');
      }

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        message: `${successful} commissions traitées, ${failed} échecs`,
        successful,
        failed,
        details: results
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de l\'opération en masse');
    }
  },

  // ================================
  // REPORTING & ANALYTICS (NEW)
  // ================================

  // ✅ NEW: Obtenir le rapport de commissions
  async getCommissionReport(params = {}) {
    try {
      const [commissions, stats] = await Promise.all([
        this.getCommissions(params),
        this.getCommissionStats()
      ]);

      const grouped = this.groupCommissionsByStatus(commissions.commissions || []);
      const payable = this.getPayableCommissions(commissions.commissions || []);

      return {
        success: true,
        report: {
          period: params.period || 'all',
          territory: params.territory || 'all',
          totalCommissions: commissions.pagination?.total || 0,
          hideAmounts: commissions.hideCommissionRates || false,
          stats: stats.stats,
          groupedByStatus: grouped,
          payableCommissions: {
            count: payable.length,
            total: payable.reduce((sum, c) => sum + (c.commissionAmount || 0), 0)
          },
          summary: {
            totalAmount: (commissions.commissions || []).reduce((sum, c) => sum + (c.commissionAmount || 0), 0),
            averageAmount: commissions.commissions?.length > 0 
              ? (commissions.commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0) / commissions.commissions.length)
              : 0
          }
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la génération du rapport');
    }
  },

  // ✅ NEW: Exporter les commissions
  async exportCommissions(params = {}, format = 'csv') {
    try {
      // Obtenir toutes les commissions sans pagination
      const allCommissions = await this.getCommissions({
        ...params,
        limit: 10000 // Large limit to get all
      });

      const commissions = allCommissions.commissions || [];
      
      if (format === 'csv') {
        return this.exportToCSV(commissions, allCommissions.hideCommissionRates);
      } else if (format === 'json') {
        return this.exportToJSON(commissions, allCommissions.hideCommissionRates);
      } else {
        throw new Error('Format d\'export non supporté');
      }
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de l\'export');
    }
  },

  // ✅ NEW: Exporter en CSV
  exportToCSV(commissions, hideAmounts = false) {
    const headers = [
      'ID',
      'Commercial',
      'Utilisateur',
      'Statut',
      'Date de création',
      hideAmounts ? 'Montant (masqué)' : 'Montant',
      'Devise',
      'Plan',
      'Date de paiement'
    ];

    const rows = commissions.map(commission => [
      commission._id,
      commission.salesPersonName || 'N/A',
      `${commission.userId?.firstName || ''} ${commission.userId?.lastName || ''}`.trim() || 'N/A',
      this.formatCommissionStatus(commission.status),
      new Date(commission.createdAt).toLocaleDateString('fr-FR'),
      hideAmounts ? '****' : commission.commissionAmount,
      commission.currency || 'USD',
      commission.planId || 'N/A',
      commission.paidOutAt ? new Date(commission.paidOutAt).toLocaleDateString('fr-FR') : 'Non payé'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return {
      content: csvContent,
      filename: `commissions_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv'
    };
  },

  // ✅ NEW: Exporter en JSON
  exportToJSON(commissions, hideAmounts = false) {
    const exportData = {
      exportDate: new Date().toISOString(),
      hideAmounts,
      totalCount: commissions.length,
      commissions: commissions.map(commission => ({
        id: commission._id,
        salesPerson: {
          name: commission.salesPersonName,
          salesId: commission.salesPersonSalesId,
          territory: commission.salesPersonTerritory
        },
        user: {
          name: commission.userId ? `${commission.userId.firstName} ${commission.userId.lastName}` : 'N/A',
          email: commission.userId?.email
        },
        amount: hideAmounts ? 'HIDDEN' : commission.commissionAmount,
        currency: commission.currency || 'USD',
        status: commission.status,
        statusLabel: this.formatCommissionStatus(commission.status),
        planId: commission.planId,
        createdAt: commission.createdAt,
        paidOutAt: commission.paidOutAt,
        notes: commission.payoutNotes
      }))
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `commissions_${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json'
    };
  },

  // ================================
  // SEARCH & FILTERING (NEW)
  // ================================

  // ✅ NEW: Recherche avancée de commissions
  async searchCommissions(searchParams) {
    try {
      const params = {};

      if (searchParams.salesPersonName) {
        params.salesPersonName = searchParams.salesPersonName;
      }

      if (searchParams.userEmail) {
        params.userEmail = searchParams.userEmail;
      }

      if (searchParams.status && searchParams.status !== 'all') {
        params.status = searchParams.status;
      }

      if (searchParams.period && searchParams.period !== 'all') {
        params.period = searchParams.period;
      }

      if (searchParams.territory) {
        params.territory = searchParams.territory;
      }

      if (searchParams.dateFrom) {
        params.dateFrom = searchParams.dateFrom;
      }

      if (searchParams.dateTo) {
        params.dateTo = searchParams.dateTo;
      }

      if (searchParams.minAmount) {
        params.minAmount = searchParams.minAmount;
      }

      if (searchParams.maxAmount) {
        params.maxAmount = searchParams.maxAmount;
      }

      return await this.getCommissions(params);
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la recherche');
    }
  }
};
