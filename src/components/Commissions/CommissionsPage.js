import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { commissionService } from '../../services/commission.service';
import { hasPermission } from '../../utils/permissions';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { formatCommissionStatus } from '../../utils/formatters';
import usePagination from '../../hooks/usePagination'; // Fixed import
import Table, { createColumn } from '../Commons/Table';
import Pagination from '../Commons/Paginations';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import { useConfirmDialog } from '../Commons/ConfirmDialog';

const CommissionsPage = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    salesPersonId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { ConfirmDialogComponent, confirmAction } = useConfirmDialog();

  // Calculate pagination manually to avoid usePagination hook issues
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadCommissions();
  }, [currentPage, itemsPerPage, searchTerm, filters]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...filters
      };

      const response = await commissionService.getCommissions(params);
      
      if (response.success) {
        // Ensure we always set an array
        setCommissions(Array.isArray(response.commissions) ? response.commissions : []);
        setTotalCount(response.pagination?.total || 0);
      } else {
        console.error('Erreur:', response.message);
        setCommissions([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commissions:', error);
      setCommissions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = (commission) => {
    confirmAction(
      'marquer cette commission comme payée',
      async () => {
        try {
          await commissionService.markCommissionPaid(commission._id);
          loadCommissions();
        } catch (error) {
          console.error('Erreur lors du marquage:', error);
        }
      },
      `Marquer la commission de ${formatCurrency(commission.amount)} comme payée ?`
    );
  };

  const handleBatchPayout = () => {
    if (selectedCommissions.length === 0) return;

    confirmAction(
      `traiter ${selectedCommissions.length} commission(s) en lot`,
      async () => {
        try {
          await commissionService.batchPayoutCommissions(selectedCommissions);
          setSelectedCommissions([]);
          loadCommissions();
        } catch (error) {
          console.error('Erreur lors du traitement en lot:', error);
        }
      }
    );
  };

  const handleSearch = () => {
    goToPage(1);
    loadCommissions();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ status: '', salesPersonId: '', dateFrom: '', dateTo: '' });
    goToPage(1);
  };

  // Configuration des colonnes du tableau
  const columns = [
    createColumn.custom('salesPerson', 'Commercial', (_, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.salesPersonId?.firstName} {row.salesPersonId?.lastName}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.salesPersonId?.salesId}
        </div>
      </div>
    )),
    
    createColumn.custom('user', 'Utilisateur', (_, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.userId?.firstName} {row.userId?.lastName}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.userId?.email}
        </div>
      </div>
    )),
    
    createColumn.currency('amount', 'Montant'),
    
    createColumn.badge('status', 'Statut', {
      badgeConfig: {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        paid_out: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      },
      formatValue: (value) => formatCommissionStatus(value)
    }),
    
    createColumn.date('createdAt', 'Date de création'),
    
    createColumn.date('paidAt', 'Date de paiement'),
    
    createColumn.actions([
      {
        label: 'Voir détails',
        icon: Eye,
        onClick: (row) => {
          console.log('Voir détails:', row._id);
          // Implémenter la modal de détails
        }
      },
      {
        label: 'Marquer comme payée',
        icon: CheckCircle,
        onClick: handleMarkPaid,
        disabled: (row) => row.status !== 'confirmed' || !hasPermission(user, 'canProcessPayouts')
      },
      {
        label: 'Annuler',
        icon: XCircle,
        onClick: (row) => {
          confirmAction(
            'annuler cette commission',
            async () => {
              try {
                await commissionService.cancelCommission(row._id);
                loadCommissions();
              } catch (error) {
                console.error('Erreur lors de l\'annulation:', error);
              }
            }
          );
        },
        danger: true,
        disabled: (row) => row.status === 'paid_out' || row.status === 'cancelled'
      }
    ])
  ];

  if (loading) {
    return <SectionSpinner text="Chargement des commissions..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestion des Commissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez et gérez les commissions ({totalCount} commission{totalCount > 1 ? 's' : ''})
          </p>
        </div>
        
        {selectedCommissions.length > 0 && hasPermission(user, 'canProcessPayouts') && (
          <button
            onClick={handleBatchPayout}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            <span>Payer la sélection ({selectedCommissions.length})</span>
          </button>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {commissions.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmées</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {commissions.filter(c => c.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Payées</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {commissions.filter(c => c.status === 'paid_out').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(commissions.reduce((sum, c) => sum + (c.amount || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

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
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="paid_out">Payées</option>
              <option value="cancelled">Annulées</option>
            </select>
            
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
          </div>
        </div>
      </div>

      {/* Tableau des commissions */}
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
          onPageChange={goToPage}
          onItemsPerPageChange={changeItemsPerPage}
          showItemsPerPage={true}
          showPageInfo={true}
        />
      )}

      {/* Dialog de confirmation */}
      <ConfirmDialogComponent />
    </div>
  );
};

export default CommissionsPage;
