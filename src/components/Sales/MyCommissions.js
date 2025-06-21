import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesPersonAuthService } from '../../services/sales-person-auth.service';
import LoadingSpinner, { SectionSpinner } from '../Commons/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Pagination from '../Commons/Paginations';

const MyCommissions = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    period: 'all',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadCommissions();
  }, [filters]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await salesPersonAuthService.getMyCommissions(filters);
      
      if (response.success) {
        setCommissions(response.commissions);
        setSummary(response.summary);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Erreur lors du chargement des commissions');
      }
    } catch (error) {
      console.error('Erreur commissions:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when changing filters
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paid_out':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'paid_out':
        return <DollarSign className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmée';
      case 'paid_out':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading && commissions.length === 0) {
    return <SectionSpinner text="Chargement de vos commissions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes Commissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Suivi de vos gains et commissions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summary.map((stat) => (
            <div key={stat._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {getStatusLabel(stat._id)}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stat.total)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.count} commission{stat.count > 1 ? 's' : ''}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getStatusColor(stat._id)}`}>
                  {getStatusIcon(stat._id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          
          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="paid_out">Payées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Période
            </label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Toutes les périodes</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>

          {/* Items per page */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Affichage
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={10}>10 par page</option>
              <option value={20}>20 par page</option>
              <option value={50}>50 par page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Commissions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 dark:text-gray-400 mt-2">Chargement...</p>
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune commission trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.status !== 'all' || filters.period !== 'all' 
                ? 'Aucune commission ne correspond à vos filtres.'
                : 'Vous n\'avez pas encore de commissions.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div>Client</div>
                <div>Date</div>
                <div>Montant</div>
                <div>Statut</div>
                <div>Type</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {commissions.map((commission) => (
                <div key={commission._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    
                    {/* Client */}
                    <div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {commission.userId?.firstName?.[0]}{commission.userId?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {commission.userId?.firstName} {commission.userId?.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {commission.userId?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(commission.createdAt)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(commission.createdAt).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(commission.commissionAmount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        USD
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(commission.status)}`}>
                        {getStatusIcon(commission.status)}
                        <span>{getStatusLabel(commission.status)}</span>
                      </span>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {commission.planId || 'Plan Standard'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {commission.planDuration ? `${commission.planDuration} mois` : 'Durée non spécifiée'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div>
                      <button
                        onClick={() => {
                          // TODO: Open commission details modal
                          console.log('View commission details:', commission._id);
                        }}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Détails</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Summary Footer */}
      {commissions.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Total des Commissions</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {summary ? formatCurrency(summary.reduce((sum, stat) => sum + stat.total, 0)) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Nombre de Commissions</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {summary ? summary.reduce((sum, stat) => sum + stat.count, 0) : '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Taux de Conversion</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {user?.totalRegistrations > 0 
                  ? Math.round((user.totalPaidRegistrations / user.totalRegistrations) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCommissions;
