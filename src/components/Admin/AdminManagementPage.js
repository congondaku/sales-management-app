import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, UserX, UserCheck, Shield, Users, Crown, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import { hasPermission } from '../../utils/permissions';
import { formatFullName, formatUserRole } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/constants';
import Table, { createColumn } from '../Commons/Table';
import Pagination from '../Commons/Paginations';
import CreateAdminModal from './CreateAdminModal';
import EditAdminModal from './EditAdminModal';
import AdminDetailsModal from './AdminDetailsModal';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import { useConfirmDialog } from '../Commons/ConfirmDialog';

const AdminManagementPage = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    territory: '',
    status: 'all'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hierarchy, setHierarchy] = useState(null);

  const { ConfirmDialogComponent, confirmAction } = useConfirmDialog();

  useEffect(() => {
    loadAdmins();
    loadHierarchy();
  }, [currentPage, itemsPerPage, searchTerm, filters]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...filters
      };

      const response = await authService.getAllAdmins(params);
      
      if (response.success) {
        setAdmins(Array.isArray(response.admins) ? response.admins : []);
        setTotalCount(response.total || 0);
      } else {
        console.error('Erreur:', response.message);
        setAdmins([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des administrateurs:', error);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHierarchy = async () => {
    try {
      const response = await authService.getHierarchy();
      if (response.success) {
        setHierarchy(response.hierarchy);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la hiérarchie:', error);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadAdmins();
    loadHierarchy();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedAdmin(null);
    loadAdmins();
  };

  const handleViewDetails = (admin) => {
    setSelectedAdmin(admin);
    setShowDetailsModal(true);
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleSuspend = async (admin) => {
    const confirmed = await confirmAction(
      `suspendre ${formatFullName(admin.firstName, admin.lastName)}`,
      () => {}
    );

    if (confirmed) {
      try {
        const response = await authService.suspendAdmin(admin._id, 'Suspendu via interface admin');
        if (response.success) {
          loadAdmins();
        }
      } catch (error) {
        console.error('Erreur lors de la suspension:', error);
      }
    }
  };

  const handleUnsuspend = async (admin) => {
    const confirmed = await confirmAction(
      `réactiver ${formatFullName(admin.firstName, admin.lastName)}`,
      () => {}
    );

    if (confirmed) {
      try {
        const response = await authService.unsuspendAdmin(admin._id);
        if (response.success) {
          loadAdmins();
        }
      } catch (error) {
        console.error('Erreur lors de la réactivation:', error);
      }
    }
  };

  const handleDelete = async (admin) => {
    const confirmed = await confirmAction(
      `supprimer définitivement ${formatFullName(admin.firstName, admin.lastName)}`,
      () => {},
      'Cette action est irréversible et supprimera tous les liens hiérarchiques.'
    );

    if (confirmed) {
      try {
        const response = await authService.deleteAdmin(admin._id);
        if (response.success) {
          loadAdmins();
          loadHierarchy();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ role: '', territory: '', status: 'all' });
    setCurrentPage(1);
  };

  // Configuration des colonnes du tableau
  const columns = [
    createColumn.custom('admin', 'Administrateur', (_, row) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {row.firstName?.[0]}{row.lastName?.[0]}
          </span>
        </div>
        <div className="ml-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatFullName(row.firstName, row.lastName)}
            </span>
            {row.role === 'ceo' && (
              <Crown className="h-4 w-4 text-yellow-500" title="CEO" />
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.email}
          </div>
        </div>
      </div>
    )),
    
    createColumn.custom('role', 'Rôle', (_, row) => (
      <div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          row.role === 'ceo' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
          row.role === 'regional_manager' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
          row.role === 'sales_manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
          row.role === 'team_leader' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        }`}>
          {formatUserRole(row.role)}
        </span>
      </div>
    )),
    
    createColumn.custom('territory', 'Territoire/Équipe', (_, row) => (
      <div>
        {row.territory && (
          <div className="text-sm text-gray-900 dark:text-white">
            📍 {row.territory}
          </div>
        )}
        {row.teamName && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            👥 {row.teamName}
          </div>
        )}
        {!row.territory && !row.teamName && (
          <span className="text-sm text-gray-400">Non assigné</span>
        )}
      </div>
    )),
    
    createColumn.custom('permissions', 'Permissions', (_, row) => (
      <div>
        {row.permissions && typeof row.permissions === 'object' ? (
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {Object.values(row.permissions).filter(p => p === true).length} / {Object.keys(row.permissions).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              permissions
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Non définies</span>
        )}
      </div>
    )),
    
    createColumn.custom('hierarchy', 'Hiérarchie', (_, row) => (
      <div>
        {row.managedBy ? (
          <div className="text-sm text-gray-900 dark:text-white">
            ⬆️ {formatFullName(row.managedBy.firstName, row.managedBy.lastName)}
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Niveau supérieur</span>
        )}
        {row.subordinatesCount > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ⬇️ {row.subordinatesCount} subordonné{row.subordinatesCount > 1 ? 's' : ''}
          </div>
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
    
    createColumn.custom('actions', 'Actions', (_, row) => (
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(row);
          }}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Voir détails"
        >
          <Eye className="h-4 w-4" />
        </button>
        
        {hasPermission(user, 'canEditAdmins') && row._id !== user._id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        
        {hasPermission(user, 'canEditAdmins') && row._id !== user._id && row.role !== 'ceo' && (
          <>
            {row.isActive && !row.isSuspended ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSuspend(row);
                }}
                className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                title="Suspendre"
              >
                <UserX className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsuspend(row);
                }}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Réactiver"
              >
                <UserCheck className="h-4 w-4" />
              </button>
            )}
          </>
        )}
        
        {hasPermission(user, 'canDeleteAdmins') && row._id !== user._id && row.role !== 'ceo' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    ))
  ];

  if (loading) {
    return <SectionSpinner text="Chargement des administrateurs..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestion des Administrateurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez votre équipe administrative ({totalCount} administrateur{totalCount > 1 ? 's' : ''})
          </p>
        </div>
        
        {hasPermission(user, 'canCreateAdmins') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel Administrateur</span>
          </button>
        )}
      </div>

      {/* Vue d'ensemble de la hiérarchie */}
      {hierarchy && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aperçu de la Hiérarchie
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Votre position */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatUserRole(user?.role)}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                Votre rôle
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {user?.firstName} {user?.lastName}
              </div>
            </div>

            {/* Vos subordonnés directs */}
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {hierarchy.subordinates?.admins?.length || 0}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                Administrateurs sous votre responsabilité
              </div>
            </div>

            {/* Total dans l'organisation */}
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {totalCount}
              </div>
              <div className="text-sm text-purple-800 dark:text-purple-200">
                Total administrateurs
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
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Tous les rôles</option>
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
              ))}
            </select>
            
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
          </div>

          {/* Actions de filtre */}
          <div className="flex space-x-2">
            <button
              onClick={clearFilters}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des administrateurs */}
      <Table
        data={admins}
        columns={columns}
        loading={loading}
        emptyMessage="Aucun administrateur trouvé"
        onRowClick={handleViewDetails}
        className="cursor-pointer"
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / itemsPerPage)}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
          showItemsPerPage={true}
          showPageInfo={true}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && selectedAdmin && (
        <EditAdminModal
          admin={selectedAdmin}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {showDetailsModal && selectedAdmin && (
        <AdminDetailsModal
          admin={selectedAdmin}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAdmin(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {/* Dialog de confirmation */}
      <ConfirmDialogComponent />
    </div>
  );
};

export default AdminManagementPage;
