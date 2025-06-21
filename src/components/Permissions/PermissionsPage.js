import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Eye, Edit, UserCheck, UserX, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { permissionService } from '../../services/permission.service';
import { hasPermission, getDefaultPermissionsByRole } from '../../utils/permissions';
import { formatFullName, formatUserRole } from '../../utils/formatters';
import { PERMISSIONS, PERMISSION_LABELS, USER_ROLES, ROLE_LABELS } from '../../utils/constants';
import Table, { createColumn } from '../Commons/Table';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import { useConfirmDialog } from '../Commons/ConfirmDialog';

const PermissionsPage = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [hierarchy, setHierarchy] = useState(null);
  const [error, setError] = useState(null);

  const { ConfirmDialogComponent, confirmAction } = useConfirmDialog();

  useEffect(() => {
    loadAdmins();
    loadHierarchy();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading admins...'); // Debug log
      
      const response = await permissionService.getManageableUsers('Admin');
      
      console.log('Response:', response); // Debug log
      
      if (response.success) {
        const adminList = Array.isArray(response.manageableUsers?.admins) ? response.manageableUsers.admins : [];
        console.log('Admin list:', adminList); // Debug log
        setAdmins(adminList);
      } else {
        console.error('Error loading admins:', response.message);
        setError(response.message || 'Erreur lors du chargement des administrateurs');
        setAdmins([]);
      }
    } catch (error) {
      console.error('Exception loading admins:', error);
      setError('Erreur de connexion au serveur');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHierarchy = async () => {
    try {
      console.log('Loading hierarchy...'); // Debug log
      const response = await permissionService.getHierarchy();
      console.log('Hierarchy response:', response); // Debug log
      
      if (response.success) {
        setHierarchy(response.hierarchy);
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    }
  };

  const handleEditPermissions = (admin) => {
    console.log('Edit permissions for admin:', admin); // Debug log
    setSelectedAdmin(admin);
    setShowPermissionModal(true);
  };

  const handleSuspendAdmin = async (admin) => {
    console.log('Suspending admin:', admin); // Debug log
    
    const confirmed = await confirmAction(
      `suspendre ${formatFullName(admin.firstName, admin.lastName)}`,
      () => {}
    );

    if (confirmed) {
      try {
        console.log('Calling suspend API for admin:', admin._id); // Debug log
        const response = await permissionService.suspendAdmin(admin._id, 'Suspendu via interface admin');
        console.log('Suspend response:', response); // Debug log
        
        if (response.success) {
          await loadAdmins(); // Reload the list
        } else {
          console.error('Failed to suspend admin:', response.message);
          alert('Erreur lors de la suspension: ' + response.message);
        }
      } catch (error) {
        console.error('Exception suspending admin:', error);
        alert('Erreur lors de la suspension: ' + error.message);
      }
    }
  };

  const handleUnsuspendAdmin = async (admin) => {
    console.log('Unsuspending admin:', admin); // Debug log
    
    const confirmed = await confirmAction(
      `réactiver ${formatFullName(admin.firstName, admin.lastName)}`,
      () => {}
    );

    if (confirmed) {
      try {
        console.log('Calling unsuspend API for admin:', admin._id); // Debug log
        const response = await permissionService.unsuspendAdmin(admin._id);
        console.log('Unsuspend response:', response); // Debug log
        
        if (response.success) {
          await loadAdmins(); // Reload the list
        } else {
          console.error('Failed to unsuspend admin:', response.message);
          alert('Erreur lors de la réactivation: ' + response.message);
        }
      } catch (error) {
        console.error('Exception unsuspending admin:', error);
        alert('Erreur lors de la réactivation: ' + error.message);
      }
    }
  };

  const handleViewDetails = (admin) => {
    console.log('View details for admin:', admin); // Debug log
    // Create a proper modal instead of alert
    setSelectedAdmin(admin);
    setShowDetailsModal(true);
  };

  // Configuration des colonnes du tableau
  const columns = [
    createColumn.custom('admin', 'Administrateur', (_, row) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-blue-600">
            {row.firstName?.[0] || 'A'}{row.lastName?.[0] || 'D'}
          </span>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatFullName(row.firstName, row.lastName)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.email || 'Email non renseigné'}
          </div>
        </div>
      </div>
    )),
    
    createColumn.custom('role', 'Rôle', (_, row) => (
      <div>
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
          {formatUserRole(row.role)}
        </span>
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
              permissions accordées
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Aucune permission</span>
        )}
      </div>
    )),
    
    createColumn.custom('hierarchy', 'Hiérarchie', (_, row) => (
      <div>
        {row.managedBy ? (
          <div className="text-sm text-gray-900 dark:text-white">
            Géré par: {formatFullName(row.managedBy.firstName, row.managedBy.lastName)}
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Niveau supérieur</span>
        )}
        {row.subordinates && Array.isArray(row.subordinates) && row.subordinates.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Gère {row.subordinates.length} personne{row.subordinates.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    )),
    
    createColumn.badge('isActive', 'Statut', {
      badgeConfig: {
        true: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        false: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      },
      formatValue: (value) => value ? 'Actif' : 'Suspendu'
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
        
        {hasPermission(user, 'canManagePermissions') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditPermissions(row);
            }}
            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            title="Gérer permissions"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
        
        {hasPermission(user, 'canEditAdmins') && row._id !== user._id && (
          <>
            {row.isActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSuspendAdmin(row);
                }}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Suspendre"
              >
                <UserX className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsuspendAdmin(row);
                }}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Réactiver"
              >
                <UserCheck className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    ))
  ];

  if (loading) {
    return <SectionSpinner text="Chargement des permissions..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAdmins}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestion des Permissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les permissions et la hiérarchie des administrateurs
          </p>
        </div>
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Debug: {admins.length} admin(s) chargé(s)
          </div>
        )}
      </div>

      {/* Vue d'ensemble des rôles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Hiérarchie */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Hiérarchie
            </h3>
          </div>
          
          {hierarchy ? (
            <div className="space-y-3">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {formatUserRole(user?.role || 'admin')}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Vous
                </div>
              </div>
              
              {hierarchy.subordinates?.admins && Array.isArray(hierarchy.subordinates.admins) && hierarchy.subordinates.admins.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Administrateurs sous votre responsabilité:
                  </div>
                  {hierarchy.subordinates.admins.slice(0, 5).map((admin) => (
                    <div key={admin._id} className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded mb-1">
                      {formatFullName(admin.firstName, admin.lastName)} ({formatUserRole(admin.role)})
                    </div>
                  ))}
                  {hierarchy.subordinates.admins.length > 5 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ... et {hierarchy.subordinates.admins.length - 5} autres
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Chargement de la hiérarchie...
            </div>
          )}
        </div>

        {/* Permissions actuelles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vos Permissions
            </h3>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {user?.permissions && typeof user.permissions === 'object' ? (
              Object.entries(user.permissions).map(([permission, granted]) => (
                <div key={permission} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {PERMISSION_LABELS[permission] || permission}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    granted 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {granted ? 'Accordée' : 'Refusée'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Aucune permission définie
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Statistiques
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total admins</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Array.isArray(admins) ? admins.length : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Actifs</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Array.isArray(admins) ? admins.filter(a => a.isActive).length : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Suspendus</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Array.isArray(admins) ? admins.filter(a => !a.isActive).length : 0}
              </span>
            </div>
            
            {/* Répartition par rôle */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Répartition par rôle:
              </div>
              {Object.values(USER_ROLES).map(role => {
                const count = Array.isArray(admins) ? admins.filter(a => a.role === role).length : 0;
                if (count === 0) return null;
                return (
                  <div key={role} className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des administrateurs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Administrateurs
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gérez les permissions des administrateurs sous votre responsabilité
          </p>
        </div>
        
        <Table
          data={Array.isArray(admins) ? admins : []}
          columns={columns}
          loading={loading}
          emptyMessage="Aucun administrateur sous votre responsabilité"
        />
      </div>

      {/* Modal de détails */}
      {showDetailsModal && selectedAdmin && (
        <AdminDetailsModal
          admin={selectedAdmin}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAdmin(null);
          }}
        />
      )}

      {/* Modal de gestion des permissions */}
      {showPermissionModal && selectedAdmin && (
        <PermissionModal
          admin={selectedAdmin}
          onClose={() => {
            setShowPermissionModal(false);
            setSelectedAdmin(null);
          }}
          onSave={() => {
            loadAdmins();
            setShowPermissionModal(false);
            setSelectedAdmin(null);
          }}
        />
      )}

      {/* Dialog de confirmation */}
      <ConfirmDialogComponent />
    </div>
  );
};

// Composant Modal pour voir les détails d'un admin
const AdminDetailsModal = ({ admin, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
        
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  {admin.firstName?.[0] || 'A'}{admin.lastName?.[0] || 'D'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatFullName(admin.firstName, admin.lastName)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatUserRole(admin.role)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <p className="text-sm text-gray-900 dark:text-white">{admin.email || 'Non renseigné'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              admin.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {admin.isActive ? 'Actif' : 'Suspendu'}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hiérarchie</label>
            <p className="text-sm text-gray-900 dark:text-white">
              {admin.managedBy 
                ? `Géré par: ${formatFullName(admin.managedBy.firstName, admin.managedBy.lastName)}`
                : 'Niveau supérieur'
              }
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
            <div className="mt-2">
              {admin.permissions && typeof admin.permissions === 'object' ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Object.entries(admin.permissions).map(([permission, granted]) => (
                    <div key={permission} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {PERMISSION_LABELS[permission] || permission}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${
                        granted 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {granted ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune permission définie</p>
              )}
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant Modal pour gérer les permissions
const PermissionModal = ({ admin, onClose, onSave }) => {
  const [permissions, setPermissions] = useState(admin.permissions || {});
  const [loading, setLoading] = useState(false);

  const handlePermissionChange = (permission, granted) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: granted
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('Updating permissions for admin:', admin._id, permissions); // Debug log
      
      // Compare current permissions with new permissions and make individual API calls
      const currentPermissions = admin.permissions || {};
      const updates = [];
      
      // Find permissions that need to be granted or revoked
      for (const [permission, granted] of Object.entries(permissions)) {
        const currentValue = currentPermissions[permission];
        
        if (granted !== currentValue) {
          if (granted) {
            // Grant permission
            updates.push(
              permissionService.grantPermission(admin._id, 'Admin', permission, 'Updated via permissions modal')
            );
          } else {
            // Revoke permission
            updates.push(
              permissionService.revokePermission(admin._id, 'Admin', permission, 'Updated via permissions modal')
            );
          }
        }
      }
      
      // Execute all updates
      if (updates.length > 0) {
        await Promise.all(updates);
        console.log('All permissions updated successfully');
        onSave();
      } else {
        console.log('No permission changes detected');
        onSave();
      }
    } catch (error) {
      console.error('Exception updating permissions:', error);
      alert('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les permissions par catégorie
  const groupedPermissions = {
    salesManagement: {
      label: 'Gestion des Commerciaux',
      permissions: [
        'canCreateSalesPeople',
        'canEditSalesPeople',
        'canDeleteSalesPeople',
        'canViewAllSalesPeople'
      ]
    },
    commissionManagement: {
      label: 'Gestion des Commissions',
      permissions: [
        'canViewCommissions',
        'canSetCommissionRates',
        'canProcessPayouts',
        'canSeeCommissionRates'
      ]
    },
    adminManagement: {
      label: 'Gestion des Administrateurs',
      permissions: [
        'canCreateAdmins',
        'canEditAdmins',
        'canDeleteAdmins'
      ]
    },
    analytics: {
      label: 'Analytics et Rapports',
      permissions: [
        'canViewAnalytics',
        'canViewAllData'
      ]
    },
    system: {
      label: 'Administration Système',
      permissions: [
        'canManageSystem',
        'canManagePermissions'
      ]
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gestion des Permissions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatFullName(admin.firstName, admin.lastName)} - {formatUserRole(admin.role)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, config]) => (
              <div key={category}>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  {config.label}
                </h4>
                <div className="space-y-2">
                  {config.permissions.map(permission => (
                    <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {PERMISSION_LABELS[permission] || permission}
                        </span>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={permissions[permission] === true}
                          onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                          disabled={loading}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsPage;
