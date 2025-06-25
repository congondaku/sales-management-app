import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, UserPlus, MapPin, Target, Percent, UserX, UserCheck, DollarSign, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesService } from '../../services/sales.service';
import { permissionService } from '../../services/permission.service';
import { analyticsService } from '../../services/analytics.service';
import { apiHelpers } from '../../services/api';
import { hasPermission } from '../../utils/permissions';
import { formatFullName, formatPhoneDisplay, formatTerritory } from '../../utils/formatters';
import Table, { createColumn, TableActions } from '../Commons/Table';
import Pagination from '../Commons/Paginations';
import CreateSalesPersonModal from './CreateSalesPersonModal';
import EditSalesPersonModal from './EditSalesPersonModal';
import SalesPersonDetails from './SalesPersonDetails';
import CommissionRateModal from './CommissionRateModal';
import SetTargetsModal from './SetTargetsModal.js';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import { useConfirmDialog } from '../Commons/ConfirmDialog';

const SalesPeoplePage = () => {
  const { token, user } = useAuth();
  const [salesPeople, setSalesPeople] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    active: '',
    territory: '',
    team: '',
    status: 'all' // all, active, suspended, inactive
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { ConfirmDialogComponent, confirmDelete, confirmAction } = useConfirmDialog();

  // Calculate pagination manually to avoid usePagination hook issues
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadSalesPeople();
    loadPerformanceStats();
  }, [currentPage, itemsPerPage, searchTerm, filters]);

  const loadSalesPeople = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...filters
      };

      const response = await salesService.getSalesPeople(params);

      if (response.success) {
        // Ensure we always set an array
        setSalesPeople(Array.isArray(response.salesPeople) ? response.salesPeople : []);
        setTotalCount(response.pagination?.total || 0);
      } else {
        console.error('Erreur:', response.message);
        setSalesPeople([]); // Set empty array on error
        setError(response.message || 'Erreur lors du chargement des commerciaux');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commerciaux:', error);
      setSalesPeople([]); // Set empty array on error
      setError(apiHelpers.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use available analytics service
  const loadPerformanceStats = async () => {
    try {
      if (!hasPermission(user, 'canViewAnalytics')) {
        return; // Skip if user doesn't have permission
      }

      const response = await analyticsService.getSalesPerformance({ period: 'month' });
      if (response.success) {
        // Calculate stats from the analytics data
        const stats = {
          totalActive: response.analytics?.salesPeople?.filter(sp => sp.salesPerson?.isActive).length || 0,
          avgPerformance: response.analytics?.summary?.averageTargetAchievement || 0,
          totalCommissions: response.analytics?.summary?.totalCommissions || 0,
          totalSuspended: response.analytics?.salesPeople?.filter(sp => sp.salesPerson?.isSuspended).length || 0
        };
        setPerformanceStats(stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // Don't show error for stats, just log it
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadSalesPeople();
    loadPerformanceStats();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedSalesPerson(null);
    loadSalesPeople();
  };

  const handleCommissionSuccess = () => {
    setShowCommissionModal(false);
    setSelectedSalesPerson(null);
    loadSalesPeople();
  };

  const handleTargetsSuccess = () => {
    setShowTargetsModal(false);
    setSelectedSalesPerson(null);
    loadSalesPeople();
  };

  const handleViewDetails = (salesperson) => {
    setSelectedSalesPerson(salesperson);
    setShowDetailsModal(true);
  };

  const handleEdit = (salesperson) => {
    setSelectedSalesPerson(salesperson);
    setShowEditModal(true);
  };

  const handleSetCommissionRate = (salesperson) => {
    setSelectedSalesPerson(salesperson);
    setShowCommissionModal(true);
  };

  const handleSetTargets = (salesperson) => {
    setSelectedSalesPerson(salesperson);
    setShowTargetsModal(true);
  };

  // ✅ FIXED: Use permission service methods
  const handleSuspend = async (salesperson) => {
    const reason = prompt('Raison de la suspension:') || 'Suspendu par l\'administrateur';
    const confirmed = await confirmAction(
      `suspendre ${formatFullName(salesperson.firstName, salesperson.lastName)}`,
      () => { }
    );

    if (confirmed) {
      try {
        const response = await permissionService.suspendSalesPerson(salesperson._id, reason);
        if (response.success) {
          loadSalesPeople();
          loadPerformanceStats();
        }
      } catch (error) {
        console.error('Erreur lors de la suspension:', error);
        setError(apiHelpers.formatError(error));
      }
    }
  };

  const handleUnsuspend = async (salesperson) => {
    const confirmed = await confirmAction(
      `réactiver ${formatFullName(salesperson.firstName, salesperson.lastName)}`,
      () => { }
    );

    if (confirmed) {
      try {
        const response = await permissionService.unsuspendSalesPerson(salesperson._id);
        if (response.success) {
          loadSalesPeople();
          loadPerformanceStats();
        }
      } catch (error) {
        console.error('Erreur lors de la réactivation:', error);
        setError(apiHelpers.formatError(error));
      }
    }
  };

  const handleDelete = (salesperson) => {
    confirmDelete(
      `${formatFullName(salesperson.firstName, salesperson.lastName)} (${salesperson.salesId})`,
      async () => {
        try {
          const response = await salesService.deleteSalesPerson(salesperson._id);
          if (response.success) {
            loadSalesPeople();
            loadPerformanceStats();
          }
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          setError(apiHelpers.formatError(error));
        }
      },
      "Cette action supprimera également tous les liens avec les utilisateurs et les commissions associées."
    );
  };

  // ✅ NEW: Export functionality
  const handleExport = async (format = 'csv') => {
    try {
      setExporting(true);
      const exportData = await salesService.exportSalesPeople(filters, format);
      
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

  // ✅ NEW: Batch operations
  const handleBatchSuspend = async () => {
    if (selectedRows.length === 0) {
      alert('Veuillez sélectionner des commerciaux à suspendre');
      return;
    }

    const reason = prompt('Raison de la suspension en masse:') || 'Suspension en masse';
    const confirmed = await confirmAction(
      `suspendre ${selectedRows.length} commerciaux`,
      () => { }
    );

    if (confirmed) {
      try {
        const response = await permissionService.batchSuspendUsers(selectedRows, 'SalesPerson', reason);
        if (response.success) {
          loadSalesPeople();
          loadPerformanceStats();
          setSelectedRows([]);
        }
      } catch (error) {
        console.error('Erreur lors de la suspension en masse:', error);
        setError(apiHelpers.formatError(error));
      }
    }
  };

  const handleBatchUnsuspend = async () => {
    if (selectedRows.length === 0) {
      alert('Veuillez sélectionner des commerciaux à réactiver');
      return;
    }

    const confirmed = await confirmAction(
      `réactiver ${selectedRows.length} commerciaux`,
      () => { }
    );

    if (confirmed) {
      try {
        const response = await permissionService.batchUnsuspendUsers(selectedRows, 'SalesPerson');
        if (response.success) {
          loadSalesPeople();
          loadPerformanceStats();
          setSelectedRows([]);
        }
      } catch (error) {
        console.error('Erreur lors de la réactivation en masse:', error);
        setError(apiHelpers.formatError(error));
      }
    }
  };

  const handleSearch = () => {
    goToPage(1);
    loadSalesPeople();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ active: '', territory: '', team: '', status: 'all' });
    goToPage(1);
  };

  // ✅ NEW: Advanced search
  const handleAdvancedSearch = async (searchParams) => {
    try {
      setLoading(true);
      const response = await salesService.searchSalesPeople(searchParams);
      if (response.success) {
        setSalesPeople(response.salesPeople || []);
        setTotalCount(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche avancée:', error);
      setError(apiHelpers.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  // Configuration des colonnes du tableau avec sélection
  const columns = [
    // ✅ NEW: Selection column for batch operations
    createColumn.selection({
      selectedRows,
      onSelectionChange: setSelectedRows,
      disabled: (row) => !hasPermission(user, 'canEditSalesPeople')
    }),

    createColumn.custom('name', 'Commercial', (_, row) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center relative">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {row.firstName?.[0]}{row.lastName?.[0]}
          </span>
          {row.isSuspended && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" title="Suspendu"></div>
          )}
        </div>
        <div className="ml-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatFullName(row.firstName, row.lastName)}
            </span>
            {row.isSuspended && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded">
                Suspendu
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.email}
          </div>
        </div>
      </div>
    )),

    createColumn.text('salesId', 'ID Vente', {
      render: (value) => (
        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {value}
        </span>
      )
    }),

    createColumn.custom('territory', 'Territoire', (_, row) => (
      <div className="flex items-center">
        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
        <span className="text-sm text-gray-900 dark:text-white">{formatTerritory(row.territory)}</span>
        {row.teamName && (
          <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
            {row.teamName}
          </span>
        )}
      </div>
    )),

    createColumn.custom('performance', 'Performance', (_, row) => (
      <div>
        <div className="text-sm text-gray-900 dark:text-white">
          {row.totalRegistrations || 0} inscriptions
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.totalPaidRegistrations || 0} payées
        </div>
        {row.currentTargets?.monthlyRegistrations && (
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Objectif: {row.currentTargets.monthlyRegistrations}/mois
          </div>
        )}
        {row.performanceRate && (
          <div className={`text-xs ${row.performanceRate >= 100 ? 'text-green-600 dark:text-green-400' :
              row.performanceRate >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
            }`}>
            {row.performanceRate}% d'objectif
          </div>
        )}
      </div>
    )),

    createColumn.custom('commission', 'Commission', (_, row) => (
      <div>
        {/* Hide commission rates if user doesn't have permission */}
        {hasPermission(user, 'canSeeCommissionRates') ? (
          <div>
            <div className="text-sm text-gray-900 dark:text-white">
              {row.commissionRate ? `${(row.commissionRate * 100).toFixed(1)}%` : 'Non défini'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Dernier paiement: {row.lastCommissionDate ?
                new Date(row.lastCommissionDate).toLocaleDateString('fr-FR') :
                'Aucun'
              }
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Taux masqué</span>
        )}
      </div>
    )),

    createColumn.badge('isActive', 'Statut', {
      badgeConfig: {
        true: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        false: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      },
      formatValue: (value, row) => {
        if (row.isSuspended) return 'Suspendu';
        return value ? 'Actif' : 'Inactif';
      }
    }),

    createColumn.custom('manager', 'Manager', (_, row) => (
      <div>
        {row.managedBy ? (
          <div className="text-sm text-gray-900 dark:text-white">
            {formatFullName(row.managedBy.firstName, row.managedBy.lastName)}
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Non assigné</span>
        )}
      </div>
    )),

    createColumn.actions([
      {
        label: 'Voir détails',
        icon: Eye,
        onClick: handleViewDetails
      },
      {
        label: 'Modifier',
        icon: Edit,
        onClick: handleEdit,
        disabled: (row) => !hasPermission(user, 'canEditSalesPeople') || row.isSuspended
      },
      {
        label: 'Définir taux commission',
        icon: Percent,
        onClick: handleSetCommissionRate,
        disabled: (row) => !hasPermission(user, 'canSetCommissionRates') || row.isSuspended,
        className: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
      },
      {
        label: 'Définir objectifs',
        icon: Target,
        onClick: handleSetTargets,
        disabled: (row) => !hasPermission(user, 'canEditSalesPeople') || row.isSuspended
      },
      {
        label: row => row.isSuspended ? 'Réactiver' : 'Suspendre',
        icon: row => row.isSuspended ? UserCheck : UserX,
        onClick: row => row.isSuspended ? handleUnsuspend(row) : handleSuspend(row),
        disabled: (row) => !hasPermission(user, 'canEditSalesPeople'),
        className: row => row.isSuspended ?
          'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' :
          'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
      },
      {
        label: 'Supprimer',
        icon: Trash2,
        onClick: handleDelete,
        danger: true,
        disabled: (row) => !hasPermission(user, 'canDeleteSalesPeople')
      }
    ])
  ];

  if (loading) {
    return <SectionSpinner text="Chargement des commerciaux..." />;
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

      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Commerciaux
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez votre équipe de vente ({totalCount} commercial{totalCount > 1 ? 'aux' : ''})
          </p>
        </div>

        <div className="flex space-x-2">
          {/* Export buttons */}
          {hasPermission(user, 'canViewAllSalesPeople') && (
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

          {hasPermission(user, 'canCreateSalesPeople') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Commercial</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch operations */}
      {selectedRows.length > 0 && hasPermission(user, 'canEditSalesPeople') && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200">
              {selectedRows.length} commercial{selectedRows.length > 1 ? 'aux' : ''} sélectionné{selectedRows.length > 1 ? 's' : ''}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBatchSuspend}
                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
              >
                Suspendre
              </button>
              <button
                onClick={handleBatchUnsuspend}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Réactiver
              </button>
              <button
                onClick={() => setSelectedRows([])}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques de performance */}
      {performanceStats && hasPermission(user, 'canViewAnalytics') && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.totalActive}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Commerciaux actifs
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.avgPerformance}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Performance moyenne
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hasPermission(user, 'canSeeCommissionRates') 
                    ? `$${performanceStats.totalCommissions?.toLocaleString() || '0'}`
                    : 'Masqué'
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Commissions ce mois
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <UserX className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.totalSuspended || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Suspendus
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">

          {/* Barre de recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="suspended">Suspendus</option>
              <option value="inactive">Inactifs</option>
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
              placeholder="Équipe"
              value={filters.team}
              onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Actions de filtre */}
          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filtrer</span>
            </button>

            <button
              onClick={clearFilters}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Effacer
            </button>

            <button
              onClick={() => loadSalesPeople()}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des commerciaux */}
      <Table
        data={salesPeople}
        columns={columns}
        loading={loading}
        emptyMessage="Aucun commercial trouvé"
        onRowClick={handleViewDetails}
        className="cursor-pointer"
        selectable={hasPermission(user, 'canEditSalesPeople')}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / itemsPerPage)}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={goToPage}
          onItemsPerPageChange={changeItemsPerPage}
          showItemsPerPage={true}
          showPageInfo={true}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSalesPersonModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && selectedSalesPerson && (
        <EditSalesPersonModal
          salesPerson={selectedSalesPerson}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSalesPerson(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {showDetailsModal && selectedSalesPerson && (
        <SalesPersonDetails
          salesPerson={selectedSalesPerson}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSalesPerson(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {showCommissionModal && selectedSalesPerson && (
        <CommissionRateModal
          salesPerson={selectedSalesPerson}
          onClose={() => {
            setShowCommissionModal(false);
            setSelectedSalesPerson(null);
          }}
          onSuccess={handleCommissionSuccess}
        />
      )}

      {showTargetsModal && selectedSalesPerson && (
        <SetTargetsModal
          salesPerson={selectedSalesPerson}
          onClose={() => {
            setShowTargetsModal(false);
            setSelectedSalesPerson(null);
          }}
          onSuccess={handleTargetsSuccess}
        />
      )}

      {/* Dialog de confirmation */}
      <ConfirmDialogComponent />
    </div>
  );
};

export default SalesPeoplePage;
