import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Mail, 
  Phone,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  User,
  UserCheck,
  AlertCircle,
  Download
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesPersonAuthService } from '../../services/sales-person-auth.service';
import { apiHelpers } from '../../services/api';
import LoadingSpinner, { SectionSpinner } from '../Commons/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Pagination from '../Commons/Paginations';

const MyUsers = () => {
  const { user } = useAuth();
  const [myUsers, setMyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all', // all, active, inactive, paid, unpaid
    period: 'all', // all, week, month, quarter
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    loadMyUsers();
  }, [filters, searchTerm]);

  const loadMyUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...filters,
        search: searchTerm
      };

      const response = await salesPersonAuthService.getMyUsers(params);
      
      if (response.success) {
        setMyUsers(response.users || []);
        setPagination(response.pagination || {});
        setStats(response.stats || null);
      } else {
        setError(response.message || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur utilisateurs:', error);
      setError(apiHelpers.formatError(error));
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

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      period: 'all',
      page: 1,
      limit: 12
    });
  };

  const handleViewUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    setShowUserDetails(true);
  };

  const getStatusColor = (userObj) => {
    if (userObj.hasPayment) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (userObj.isActive) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (userObj) => {
    if (userObj.hasPayment) return 'Client Payant';
    if (userObj.isActive) return 'Actif';
    return 'Inactif';
  };

  const getStatusIcon = (userObj) => {
    if (userObj.hasPayment) return <DollarSign className="h-4 w-4" />;
    if (userObj.isActive) return <CheckCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const handleExport = async () => {
    try {
      // Create CSV content
      const csvHeaders = ['Nom', 'Email', 'Téléphone', 'Date d\'inscription', 'Statut', 'Dernière connexion'];
      const csvRows = myUsers.map(userObj => [
        `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim(),
        userObj.email || '',
        userObj.phoneNumber || '',
        formatDate(userObj.createdAt),
        getStatusLabel(userObj),
        userObj.lastLogin ? formatDate(userObj.lastLogin) : 'Jamais'
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mes_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  if (loading && myUsers.length === 0) {
    return <SectionSpinner text="Chargement de vos utilisateurs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes Utilisateurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion de vos clients inscrits ({pagination.total || 0} utilisateur{(pagination.total || 0) > 1 ? 's' : ''})
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExport}
            disabled={myUsers.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Utilisateurs
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.paidUsers || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Clients Payants
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
                  {stats.conversionRate || 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Taux de Conversion
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.thisMonthUsers || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Ce Mois
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Clients payants</option>
              <option value="unpaid">Non payants</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>

            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Toutes les périodes</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
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

      {/* Users Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 dark:text-gray-400 mt-2">Chargement...</p>
          </div>
        ) : myUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filters.status !== 'all' || filters.period !== 'all' 
                ? 'Aucun utilisateur ne correspond à vos critères.'
                : 'Vous n\'avez pas encore d\'utilisateurs inscrits.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {myUsers.map((userObj) => (
              <div key={userObj._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => handleViewUser(userObj)}>
                
                {/* User Avatar and Basic Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {userObj.firstName?.[0]}{userObj.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {userObj.firstName} {userObj.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userObj.email}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(userObj)}`}>
                    {getStatusIcon(userObj)}
                    <span>{getStatusLabel(userObj)}</span>
                  </span>
                </div>

                {/* User Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Inscrit le:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(userObj.createdAt)}
                    </span>
                  </div>
                  
                  {userObj.lastLogin && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Dernière connexion:</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(userObj.lastLogin)}
                      </span>
                    </div>
                  )}

                  {userObj.phoneNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Téléphone:</span>
                      <span className="text-gray-900 dark:text-white">
                        {userObj.phoneNumber}
                      </span>
                    </div>
                  )}

                  {userObj.hasCommission && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Commission:</span>
                      <span className="text-green-600 font-medium">
                        Générée
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <button className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium">
                      <Eye className="h-4 w-4" />
                      <span>Voir détails</span>
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      {userObj.email && (
                        <a 
                          href={`mailto:${userObj.email}`}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {userObj.phoneNumber && (
                        <a 
                          href={`tel:${userObj.phoneNumber}`}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={(newLimit) => handleFilterChange('limit', newLimit)}
            showItemsPerPage={true}
            showPageInfo={true}
          />
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Détails de l'utilisateur
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informations de base
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.phoneNumber || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date d'inscription</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dernière connexion</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Jamais'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Statut et Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedUser)}`}>
                      {getStatusIcon(selectedUser)}
                      <span>{getStatusLabel(selectedUser)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Statut actuel</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedUser.hasPayment ? 'Oui' : 'Non'}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A effectué un paiement</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedUser.hasCommission ? 'Oui' : 'Non'}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Commission générée</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Actions disponibles
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedUser.email && (
                    <a 
                      href={`mailto:${selectedUser.email}`}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Envoyer un email</span>
                    </a>
                  )}
                  
                  {selectedUser.phoneNumber && (
                    <a 
                      href={`tel:${selectedUser.phoneNumber}`}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Appeler</span>
                    </a>
                  )}
                  
                  <button className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <TrendingUp className="h-4 w-4" />
                    <span>Voir l'historique</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyUsers;
