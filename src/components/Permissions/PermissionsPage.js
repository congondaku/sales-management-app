import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Eye, Edit, UserCheck, UserX, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { permissionService } from '../../services/permission.service';
import { hasPermission, getDefaultPermissionsByRole } from '../../utils/permissions';
import { formatFullName, formatUserRole } from '../../utils/formatters';
import { PERMISSIONS, PERMISSION_LABELS, USER_ROLES, ROLE_LABELS } from '../../utils/constants';
import Table, { createColumn } from '../Commons/Table';
import { SectionSpinner } from '../Commons/LoadingSpinner';

const PermissionsPage = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [hierarchy, setHierarchy] = useState(null);
  const [error, setError] = useState(null);
  const [suspendedAdmins, setSuspendedAdmins] = useState(new Set());
  const [permissionCache, setPermissionCache] = useState(new Map());

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    console.log('🚀 Initializing permissions page...');
    console.log('👤 Current user:', {
      id: user?._id,
      email: user?.email,
      role: user?.role,
      permissions: user?.permissions
    });

    await Promise.all([
      loadAdmins(),
      loadHierarchy(),
      loadUserPermissions()
    ]);
  };

  const loadUserPermissions = async () => {
    try {
      console.log('🔄 Loading current user permissions...');
      const response = await permissionService.getMyPermissions();
      console.log('📥 My permissions response:', response);
    } catch (error) {
      console.error('❌ Error loading user permissions:', error);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading manageable admins...');
      
      const response = await permissionService.getManageableUsers('Admin');
      console.log('📥 Manageable users response:', response);
      
      if (response.success) {
        const adminList = Array.isArray(response.manageableUsers?.admins) 
          ? response.manageableUsers.admins 
          : [];
        
        console.log('👥 Admin list:', adminList);
        
        // Load detailed permissions for each admin
        const adminListWithPermissions = await Promise.all(
          adminList.map(admin => loadAdminPermissions(admin))
        );
        
        setAdmins(adminListWithPermissions);
      } else {
        console.error('❌ Error loading admins:', response.message);
        setError(response.message || 'Erreur lors du chargement des administrateurs');
        setAdmins([]);
      }
    } catch (error) {
      console.error('💥 Exception loading admins:', error);
      setError('Erreur de connexion au serveur');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminPermissions = async (admin) => {
    try {
      console.log(`🔍 Loading permissions for ${admin.firstName} ${admin.lastName} (${admin._id})`);
      
      // Check cache first
      if (permissionCache.has(admin._id)) {
        console.log('📋 Using cached permissions for', admin.firstName);
        return {
          ...admin,
          permissions: permissionCache.get(admin._id)
        };
      }
      
      // Try to get permissions from the API
      const permResponse = await permissionService.getUserPermissions(admin._id, 'Admin');
      console.log(`📥 Permission response for ${admin.firstName}:`, permResponse);
      
      let permissions = {};
      
      if (permResponse.success && permResponse.permissions) {
        permissions = permResponse.permissions;
        console.log(`✅ Loaded permissions for ${admin.firstName}:`, permissions);
      } else {
        // Fallback: use default permissions based on role
        console.log(`⚠️ No permissions found for ${admin.firstName}, using role defaults`);
        permissions = getDefaultPermissionsByRole(admin.role) || {};
      }
      
      // Cache the permissions
      setPermissionCache(prev => new Map(prev.set(admin._id, permissions)));
      
      return {
        ...admin,
        permissions
      };
    } catch (error) {
      console.error(`💥 Error loading permissions for ${admin.firstName}:`, error);
      
      // Fallback to role-based permissions
      const fallbackPermissions = getDefaultPermissionsByRole(admin.role) || {};
      console.log(`🔄 Using fallback permissions for ${admin.firstName}:`, fallbackPermissions);
      
      return {
        ...admin,
        permissions: fallbackPermissions
      };
    }
  };

  const loadHierarchy = async () => {
    try {
      console.log('🔄 Loading hierarchy...');
      const response = await permissionService.getHierarchy();
      console.log('🏗️ Hierarchy response:', response);
      
      if (response.success) {
        setHierarchy(response.hierarchy);
      }
    } catch (error) {
      console.error('❌ Error loading hierarchy:', error);
    }
  };

  const handleEditPermissions = async (admin) => {
    console.log('✏️ Opening permission editor for:', admin.firstName, admin.lastName);
    
    try {
      // Always fetch fresh permissions when editing
      const freshAdmin = await loadAdminPermissions(admin);
      console.log('🔄 Fresh admin data:', freshAdmin);
      
      setSelectedAdmin(freshAdmin);
      setShowPermissionModal(true);
    } catch (error) {
      console.error('💥 Error preparing admin for editing:', error);
      // Fallback to existing admin data
      setSelectedAdmin(admin);
      setShowPermissionModal(true);
    }
  };

  const confirmAction = async (message) => {
    return window.confirm(`Êtes-vous sûr de vouloir ${message} ?`);
  };

  const handleSuspendAdmin = async (admin) => {
    console.log('🚫 Attempting to suspend admin:', admin.firstName, admin.lastName);
    
    const confirmed = await confirmAction(
      `suspendre ${formatFullName(admin.firstName, admin.lastName)}`
    );

    if (confirmed) {
      try {
        console.log('📡 Calling suspend API...');
        
        const response = await permissionService.suspendAdmin(admin._id, 'Suspendu via interface admin');
        console.log('📥 Suspend response:', response);
        
        if (response.success) {
          console.log('✅ Admin suspended successfully');
          setSuspendedAdmins(prev => new Set([...prev, admin._id]));
          
          // Show success message
          alert('✅ Administrateur suspendu avec succès');
          
          // Reload data
          await loadAdmins();
        } else {
          throw new Error(response.message || 'Échec de la suspension');
        }
      } catch (error) {
        console.error('💥 Suspend failed:', error);
        
        if (error.response?.status === 404) {
          alert('❌ Fonctionnalité de suspension non disponible sur le serveur');
        } else {
          alert('❌ Erreur lors de la suspension: ' + (error.response?.data?.message || error.message));
        }
      }
    }
  };

  const handleUnsuspendAdmin = async (admin) => {
    console.log('✅ Attempting to unsuspend admin:', admin.firstName, admin.lastName);
    
    const confirmed = await confirmAction(
      `réactiver ${formatFullName(admin.firstName, admin.lastName)}`
    );

    if (confirmed) {
      try {
        console.log('📡 Calling unsuspend API...');
        
        const response = await permissionService.unsuspendAdmin(admin._id);
        console.log('📥 Unsuspend response:', response);
        
        if (response.success) {
          console.log('✅ Admin unsuspended successfully');
          setSuspendedAdmins(prev => {
            const newSet = new Set(prev);
            newSet.delete(admin._id);
            return newSet;
          });
          
          // Show success message
          alert('✅ Administrateur réactivé avec succès');
          
          // Reload data
          await loadAdmins();
        } else {
          throw new Error(response.message || 'Échec de la réactivation');
        }
      } catch (error) {
        console.error('💥 Unsuspend failed:', error);
        
        if (error.response?.status === 404) {
          alert('❌ Fonctionnalité de réactivation non disponible sur le serveur');
        } else {
          alert('❌ Erreur lors de la réactivation: ' + (error.response?.data?.message || error.message));
        }
      }
    }
  };

  const handleViewDetails = (admin) => {
    console.log('👁️ Viewing details for:', admin.firstName, admin.lastName);
    setSelectedAdmin(admin);
    setShowDetailsModal(true);
  };

  const isAdminActive = (admin) => {
    // Check multiple status indicators
    if (admin.status === 'suspended' || admin.status === 'inactive') return false;
    if (admin.isSuspended === true) return false;
    if (admin.isActive === false) return false;
    
    // Check frontend tracking
    if (suspendedAdmins.has(admin._id)) return false;
    
    return true;
  };

  // Enhanced table columns
  const columns = [
    createColumn.custom('admin', 'Administrateur', (_, row) => (
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
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
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
        {formatUserRole(row.role)}
      </span>
    )),
    
    createColumn.custom('permissions', 'Permissions', (_, row) => {
      const permissions = row.permissions || {};
      const granted = Object.values(permissions).filter(p => p === true).length;
      const total = Object.keys(permissions).length;
      const percentage = total > 0 ? Math.round((granted / total) * 100) : 0;
      
      return (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {granted} / {total}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {percentage}% accordées
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      );
    }),
    
    createColumn.custom('status', 'Statut', (_, row) => {
      const active = isAdminActive(row);
      return (
        <div>
          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
            active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {active ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Actif
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Suspendu
              </>
            )}
          </span>
        </div>
      );
    }),
    
    createColumn.custom('actions', 'Actions', (_, row) => {
      const canEdit = hasPermission(user, 'canEditAdmins');
      const canManagePerms = hasPermission(user, 'canManagePermissions');
      const isCurrentUser = row._id === user._id;
      
      return (
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
          
          {canManagePerms && (
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
          
          {canEdit && !isCurrentUser && (
            <>
              {isAdminActive(row) ? (
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
      );
    })
  ];

  if (loading) {
    return <SectionSpinner text="Chargement des permissions..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={initializeData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const activeAdmins = admins.filter(a => isAdminActive(a));
  const suspendedAdminsCount = admins.length - activeAdmins.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestion des Permissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les permissions et la hiérarchie des administrateurs
          </p>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>Admins: {admins.length} | Actifs: {activeAdmins.length} | Suspendus: {suspendedAdminsCount}</div>
            <div>Permissions: {hasPermission(user, 'canManagePermissions') ? 'OUI' : 'NON'}</div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Admins</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{admins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{activeAdmins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspendus</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{suspendedAdminsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vos Permissions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {user?.permissions ? Object.values(user.permissions).filter(p => p === true).length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Administrateurs
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gérez les permissions des administrateurs sous votre responsabilité
              </p>
            </div>
            
            <button
              onClick={initializeData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Actualiser
            </button>
          </div>
        </div>
        
        <Table
          data={admins}
          columns={columns}
          loading={loading}
          emptyMessage="Aucun administrateur sous votre responsabilité"
        />
      </div>

      {/* Modals */}
      {showDetailsModal && selectedAdmin && (
        <AdminDetailsModal
          admin={selectedAdmin}
          isActive={isAdminActive(selectedAdmin)}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAdmin(null);
          }}
        />
      )}

      {showPermissionModal && selectedAdmin && (
        <PermissionModal
          admin={selectedAdmin}
          onClose={() => {
            setShowPermissionModal(false);
            setSelectedAdmin(null);
          }}
          onSave={async () => {
            // Clear cache and reload
            setPermissionCache(new Map());
            await loadAdmins();
            setShowPermissionModal(false);
            setSelectedAdmin(null);
          }}
        />
      )}
    </div>
  );
};

// Enhanced Admin Details Modal
const AdminDetailsModal = ({ admin, isActive, onClose }) => {
  const permissions = admin.permissions || {};
  const grantedCount = Object.values(permissions).filter(p => p === true).length;
  const totalCount = Object.keys(permissions).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-medium text-blue-600 dark:text-blue-400">
                  {admin.firstName?.[0] || 'A'}{admin.lastName?.[0] || 'D'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatFullName(admin.firstName, admin.lastName)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatUserRole(admin.role)}
                </p>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {isActive ? 'Actif' : 'Suspendu'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            
            {/* Basic Info */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Informations de base
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{admin.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">{admin._id}</p>
                </div>
              </div>
            </div>

            {/* Permission Summary */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Résumé des Permissions
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Permissions accordées
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {grantedCount} / {totalCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${totalCount > 0 ? (grantedCount / totalCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Permissions List */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Détail des Permissions
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(permissions).map(([permission, granted]) => (
                  <div 
                    key={permission} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {PERMISSION_LABELS[permission] || permission}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      granted 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {granted ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accordée
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Refusée
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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

// Enhanced Permission Modal
const PermissionModal = ({ admin, onClose, onSave }) => {
  const [permissions, setPermissions] = useState(() => {
    const allPermissions = {};
    
    // Initialize with all available permissions
    Object.values(PERMISSIONS).forEach(permission => {
      allPermissions[permission] = admin.permissions?.[permission] === true;
    });
    
    console.log('🔧 Permission modal initialized for:', admin.firstName, admin.lastName);
    console.log('📋 Current permissions:', admin.permissions);
    console.log('✅ Modal state:', allPermissions);
    
    return allPermissions;
  });
  
  const [loading, setLoading] = useState(false);
  const [changes, setChanges] = useState(new Map());

  const handlePermissionChange = (permission, granted) => {
    console.log(`🔄 Permission ${permission} changed to:`, granted);
    
    setPermissions(prev => ({
      ...prev,
      [permission]: granted
    }));

    // Track changes
    const originalValue = admin.permissions?.[permission] === true;
    if (granted !== originalValue) {
      setChanges(prev => new Map(prev.set(permission, { from: originalValue, to: granted })));
    } else {
      setChanges(prev => {
        const newChanges = new Map(prev);
        newChanges.delete(permission);
        return newChanges;
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('💾 Saving permission changes...');
      console.log('🔄 Changes to apply:', Array.from(changes.entries()));
      
      if (changes.size === 0) {
        console.log('ℹ️ No changes to apply');
        onSave();
        return;
      }

      const updates = [];
      
      for (const [permission, change] of changes.entries()) {
        if (change.to) {
          console.log(`✅ Granting permission: ${permission}`);
          updates.push(
            permissionService.grantPermission(admin._id, 'Admin', permission, 'Updated via permissions modal')
          );
        } else {
          console.log(`❌ Revoking permission: ${permission}`);
          updates.push(
            permissionService.revokePermission(admin._id, 'Admin', permission, 'Updated via permissions modal')
          );
        }
      }
      
      console.log(`🚀 Executing ${updates.length} permission updates...`);
      const results = await Promise.allSettled(updates);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`📊 Update results: ${successful} successful, ${failed} failed`);
      
      if (failed > 0) {
        console.warn('⚠️ Some updates failed:', results.filter(r => r.status === 'rejected'));
        alert(`⚠️ ${successful} permissions mises à jour, ${failed} échecs`);
      } else {
        alert('✅ Toutes les permissions ont été mises à jour avec succès');
      }
      
      onSave();
    } catch (error) {
      console.error('💥 Error saving permissions:', error);
      alert('❌ Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const grantedCount = Object.values(permissions).filter(p => p === true).length;
  const totalCount = Object.keys(permissions).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gestion des Permissions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatFullName(admin.firstName, admin.lastName)} - {formatUserRole(admin.role)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          
          {/* Summary */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Résumé des Permissions
              </h4>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {grantedCount} / {totalCount} accordées
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${totalCount > 0 ? (grantedCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
            {changes.size > 0 && (
              <div className="text-xs text-blue-700 dark:text-blue-300">
                ⚠️ {changes.size} modification(s) en attente
              </div>
            )}
          </div>

          {/* Permission Groups */}
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, config]) => {
              const categoryPermissions = config.permissions.filter(p => permissions.hasOwnProperty(p));
              const grantedInCategory = categoryPermissions.filter(p => permissions[p] === true).length;
              const changesInCategory = categoryPermissions.filter(p => changes.has(p)).length;
              
              return (
                <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {config.label}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {changesInCategory > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          {changesInCategory} modification(s)
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                        {grantedInCategory}/{categoryPermissions.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {config.permissions.map(permission => {
                      const isGranted = permissions[permission] === true;
                      const originalValue = admin.permissions?.[permission] === true;
                      const hasChanged = changes.has(permission);
                      
                      return (
                        <div 
                          key={permission} 
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            hasChanged 
                              ? 'border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20'
                              : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {PERMISSION_LABELS[permission] || permission}
                              </span>
                              {hasChanged && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                  Modifié
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              État actuel: 
                              <span className={`ml-1 font-medium ${
                                originalValue ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {originalValue ? 'Accordée' : 'Refusée'}
                              </span>
                              {hasChanged && (
                                <span className="ml-2 text-orange-600 font-medium">
                                  → {isGranted ? 'Sera accordée' : 'Sera refusée'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <label className="flex items-center ml-4">
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                              disabled={loading}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 w-4 h-4"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {changes.size > 0 ? (
                <span className="text-orange-600 font-medium">
                  ⚠️ {changes.size} modification(s) en attente
                </span>
              ) : (
                'Aucune modification'
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={loading || changes.size === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  `Sauvegarder ${changes.size > 0 ? `(${changes.size})` : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsPage;
