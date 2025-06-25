import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, Eye, Check, X, Download, CreditCard, Users, TrendingUp, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { commissionService } from '../../services/commission.service';
import { apiHelpers } from '../../services/api';
import { hasPermission } from '../../utils/permissions';
import { formatCurrency, formatFullName, formatCommissionAmount, formatCommissionStatus } from '../../utils/formatters';
import Table, { createColumn } from '../Commons/Table';
import Pagination from '../Commons/Paginations';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import { useConfirmDialog } from '../Commons/ConfirmDialog';

const CommissionsPage = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    period: 'all',
    salesPersonId: '',
    territory: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  const [stats, setStats] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hideCommissionRates, setHideCommissionRates] = useState(false);

  const { ConfirmDialogComponent, confirmAction } = useConfirmDialog();

  useEffect(() => {
    loadCommissions();
    loadCommissionStats();
  }, [currentPage, itemsPerPage, filters]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await commissionService.getCommissions(params);

      if (response.success) {
        setCommissions(response.commissions || []);
        setTotalCount(response.pagination?.total || 0);
        setHideCommissionRates(response.hideCommissionRates || false);
      } else {
        setError(response.message || 'Erreur lors du chargement des commissions');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commissions:', error);
      setError(apiHelpers.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadCommissionStats = async () => {
    try {
      const response = await commissionService.getCommissionStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadCommissions();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      period: 'all',
      salesPersonId: '',
      territory: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    });
    setCurrentPage(1);
  };

  // ✅ NEW: Advanced search functionality
  const handleAdvancedSearch = async () => {
    try {
      setLoading(true);
      const searchParams = {
        salesPersonName: searchTerm,
        ...filters
      };

      const response = await commissionService.searchCommissions(searchParams);
      if (response.success) {
        setCommissions(response.commissions || []);
        setTotalCount(response.pagination?.total || 0);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setError(apiHelpers.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Mark single commission as paid
  const handleMarkPaid = async (commission) => {
    const notes = prompt('Notes pour le paiement (optionnel):') || '';
    const confirmed = await confirmAction(
      `marquer comme payée la commission de ${commissionService.formatCommissionAmount(commission.commissionAmount, commission.currency, hideCommissionRates)}`,
      () => {}
    );

    if (confirmed) {
      try {
        const response = await commissionService.markCommissionPaid(commission._id, notes);
        if (response.success) {
          loadCommissions();
          loadCommissionStats();
        }
      } catch (error) {
        console.error('Erreur lors du marquage:', error);
        setError(apiHelpers.formatError(error));
      }
    }
  };

  // ✅ NEW: Cancel commission
  const handleCancelCommission = async (commission) => {
    const reason = prompt('Raison de l\'annulation:') || 'Annulée par l\'administrateur';
    const confirmed = await confirmAction(
      `annuler la commission de ${commissionService.formatCommissionAmount(commission.commissionAmount, commission.currency, hideCommissionRates)}`,
      () => {}
    );

    if (confirmed) {
      try {
        const response = await commissionService.cancelCommission(commission._id, reason);
        if (response.success) {
          loadCommissions();
          loadCommissionStats();
        }
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error);
        setError(apiHelpers.formatError(error));
      }
    }
  };

  // ✅ NEW: Batch payout
  const handleBatchPayout = async () => {
    if (selectedCommissions.length === 0) {
      alert('Veuillez sélectionner des commissions à payer');
      return;
    }

    // Filter only confirmed commissions
    const payableCommissions = commissions.filter(c => 
      selectedCommissions.includes(c._id) && c.status === 'confirmed'
    );

    if (payableCommissions.length === 0) {
      alert('Aucune commission confirmée sélectionnée');
      return;
    }

    const notes = prompt('Notes pour le paiement en masse (optionnel):') || 'Paiement en masse';
    const confirmed = await confirmAction(
      `payer ${payableCommissions.length} commissions sélectionnées`,
      () => {}
    );

    if (confirmed) {
      try {
        setProcessing(true);
        const response = await commissionService.batchPayoutCommissions(
          payableCommissions.map(c => c._id),
          notes
        );
        
        if (response.success) {
          loadCommissions();
          loadCommissionStats();
          setSelectedCommissions([]);
        }
      } catch (error) {
        console.error('Erreur lors du paiement en masse:', error);
        setError(apiHelpers.formatError(error));
      } finally {
        setProcessing(false);
      }
    }
  };

  // ✅ NEW: Export functionality
  const handleExport = async (format = 'csv') => {
    try {
      setExporting(true);
      const exportData = await commissionService.exportCommissions(filters, format);
      
      // Create and trigger download
      const blob = new Blob([exportData.content], { type: exportData.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError(apiHelpers.formatError(error));
    } finally {
      setExporting(false);
    }
  };

  // Table columns configuration
  const columns = [
    // Selection column for batch operations
    createColumn.selection({
      selectedRows: selectedCommissions,
      onSelectionChange: setSelectedCommissions,
      disabled: (row) => !hasPermission(user, 'canProcessPayouts') || row.status === 'paid_out'
    }),

    createColumn.custom('salesPerson', 'Commercial', (_, row) => (
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {row.salesPersonName?.split(' ').map(n => n[0]).join('') || 'SP'}
          </span>
        </div>
        <div className="ml-3">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {row.salesPersonName || 'N/A'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.salesPersonSalesId || 'N/A'}
          </div>
        </div>
      </div>
    )),

    createColumn.custom('user', 'Utilisateur', (_, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.userId ? `${row.userId.firstName} ${row.userId.lastName}` : 'N/A'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.userId?.email || 'N/A'}
        </div>
      </div>
    )),

    createColumn.custom('amount', 'Commission', (_, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {commissionService.formatCommissionAmount(row.commissionAmount, row.currency, hideCommissionRates)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.currency || 'USD'}
        </div>
        {!hideCommissionRates && row.commissionRate && (
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Taux: {(row.commissionRate * 100).toFixed(1)}%
          </div>
        )}
      </div>
    )),

    createColumn.custom('status', 'Statut', (_, row) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        row.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
        row.status === 'paid_out' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
        row.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
        row.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      }`}>
        {commissionService.formatCommissionStatus(row.status)}
      </span>
    )),

    createColumn.custom('plan', 'Plan/Produit', (_, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.planId || 'N/A'}
        </div>
        {row.planDuration && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.planDuration}
          </div>
        )}
      </div>
    )),

    createColumn.date('createdAt', 'Date de création', {
      format: 'datetime'
    }),

    createColumn.custom('payout', 'Paiement', (_, row) => (
      <div>
        {row.paidOutAt ? (
          <div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              Payé le {new Date(row.paidOutAt).toLocaleDateString('fr-FR')}
            </div>
            {row.payoutNotes && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {row.payoutNotes}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Non payé</span>
        )}
      </div>
    )),

    createColumn.actions([
      {
        label: 'Voir détails',
        icon: Eye,
        onClick: (row) => {
          // Navigate to commission details
          console.log('View commission details:', row._id);
        }
      },
      {
        label: 'Marquer comme payé',
        icon: Check,
        onClick: handleMarkPaid,
        disabled: (row) => !hasPermission(user, 'canProcessPayouts') || row.status !== 'confirmed',
        className: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
      },
      {
        label: 'Annuler',
        icon: X,
        onClick: handleCancelCommission,
        disabled: (row) => !hasPermission(user, 'canProcessPayouts') || row.status === 'paid_out' || row.status === 'cancelled',
        className: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
      }
    ])
  ];

  if (loading) {
    return <SectionSpinner text="Chargement des commissions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestion des Commissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les commissions de votre équipe ({totalCount} commission{totalCount > 1 ? 's' : ''})
          </p>
        </div>

        <div className="flex space-x-2">
          {/* Export buttons */}
          {hasPermission(user, 'canViewCommissions') && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{exporting ? 'Export...' : 'CSV'}</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Commission Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hideCommissionRates ? 'Masqué' : commissionService.formatCommissionAmount(stats.confirmedAmount || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Confirmées ({stats.confirmedCount || 0})
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hideCommissionRates ? 'Masqué' : commissionService.formatCommissionAmount(stats.paid_outAmount || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Payées ({stats.paid_outCount || 0})
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hideCommissionRates ? 'Masqué' : commissionService.formatCommissionAmount(stats.pendingAmount || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  En attente ({stats.pendingCount || 0})
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hideCommissionRates ? 'Masqué' : commissionService.formatCommissionAmount(stats.totalCommissions || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total ({stats.totalCount || 0})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Operations */}
      {selectedCommissions.length > 0 && hasPermission(user, 'canProcessPayouts') && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200">
              {selectedCommissions.length} commission{selectedCommissions.length > 1 ? 's' : ''} sélectionnée{selectedCommissions.length > 1 ? 's' : ''}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBatchPayout}
                disabled={processing}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {processing && <CreditCard className="h-4 w-4 animate-pulse" />}
                <span>{processing ? 'Traitement...' : 'Payer la sélection'}</span>
              </button>
              <button
                onClick={() => setSelectedCommissions([])}
                className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom du commercial, utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleAdvancedSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Rechercher</span>
              </button>
              <button
                onClick={clearFilters}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Effacer
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="paid_out">Payées</option>
              <option value="cancelled">Annulées</option>
            </select>

            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Toutes les périodes</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
            </select>

            <input
              type="text"
              placeholder="Territoire"
              value={filters.territory}
              onChange={(e) => setFilters(prev => ({ ...prev, territory: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <input
              type="text"
              placeholder="ID Commercial"
              value={filters.salesPersonId}
              onChange={(e) => setFilters(prev => ({ ...prev, salesPersonId: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Advanced filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <input
              type="date"
              placeholder="Date de début"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <input
              type="date"
              placeholder="Date de fin"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <input
              type="number"
              placeholder="Montant min"
              value={filters.minAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <input
              type="number"
              placeholder="Montant max"
              value={filters.maxAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Filter actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSearch}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Appliquer les filtres</span>
            </button>

            {/* Commission rates visibility notice */}
            {hideCommissionRates && (
              <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Montants masqués - Permission requise</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <Table
        data={commissions}
        columns={columns}
        loading={loading}
        emptyMessage="Aucune commission trouvée"
        selectable={hasPermission(user, 'canProcessPayouts')}
        selectedRows={selectedCommissions}
        onSelectionChange={setSelectedCommissions}
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / itemsPerPage)}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1);
          }}
          showItemsPerPage={true}
          showPageInfo={true}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialogComponent />
    </div>
  );
};

export default CommissionsPage;
