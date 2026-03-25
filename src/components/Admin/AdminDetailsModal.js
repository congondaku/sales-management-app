import React from 'react';
import { 
  X, 
  Crown, 
  Shield, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Mail, 
  MapPin, 
  Calendar, 
  Edit,
  User,
  Building,
  Star  // Add Star icon for super_admin
} from 'lucide-react';
import { formatFullName, formatUserRole } from '../../utils/formatters';
import { hasPermission } from '../../utils/permissions';
import { useAuth } from '../../hooks/useAuth';

const AdminDetailsModal = ({ admin, onClose, onEdit }) => {
  const { user } = useAuth();

  if (!admin) return null;

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ceo':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'super_admin':  // Add super_admin case
        return <Star className="w-5 h-5 text-purple-500" />;
      case 'regional_manager':
      case 'sales_manager':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'team_leader':
        return <Users className="w-5 h-5 text-green-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'ceo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'super_admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',  // Add super_admin styling
      'regional_manager': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'sales_manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'team_leader': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'admin': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[role] || colors.admin;
  };

  const getPermissionCount = (permissions) => {
    if (!permissions || typeof permissions !== 'object') return 0;
    return Object.values(permissions).filter(p => p === true).length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getStatusDisplay = () => {
    if (admin.isActive && !admin.isSuspended) {
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">Actif</span>
        </div>
      );
    } else if (admin.isSuspended) {
      return (
        <div className="flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">Suspendu</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-orange-600 dark:text-orange-400">Inactif</span>
        </div>
      );
    }
  };

  const permissionLabels = {
    canCreateSalesPeople: 'Créer des commerciaux',
    canEditSalesPeople: 'Modifier les commerciaux',
    canDeleteSalesPeople: 'Supprimer des commerciaux',
    canViewAllSalesPeople: 'Voir tous les commerciaux',
    canViewCommissions: 'Voir les commissions',
    canSetCommissionRates: 'Définir les taux de commission',
    canProcessPayouts: 'Traiter les paiements',
    canCreateAdmins: 'Créer des administrateurs',
    canEditAdmins: 'Modifier les administrateurs',
    canDeleteAdmins: 'Supprimer des administrateurs',
    canViewAnalytics: 'Voir les analyses',
    canViewAllData: 'Voir toutes les données',
    canManageSystem: 'Gérer le système',
    canManagePermissions: 'Gérer les permissions',
    canSeeCommissionRates: 'Voir les taux de commission'
  };

  // Check if user has full access (CEO or Super Admin)
  const hasFullAccess = user?.role === 'ceo' || user?.role === 'super_admin';
  
  // Check if user can edit this admin
  const canEditAdmin = hasFullAccess || 
    (hasPermission(user, 'canEditAdmins') && admin._id !== user._id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                admin.role === 'ceo' 
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                  : admin.role === 'super_admin'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                <span className="text-lg font-medium text-white">
                  {admin.firstName?.[0] || 'A'}{admin.lastName?.[0] || 'D'}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatFullName(admin.firstName, admin.lastName)}
                  </h3>
                  {/* Add special badge for super_admin */}
                  {admin.role === 'super_admin' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                      <Star className="w-3 h-3 mr-1" />
                      Super Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {getRoleIcon(admin.role)}
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${getRoleBadgeColor(admin.role)}`}>
                    {admin.role === 'super_admin' ? 'Super Administrateur' : formatUserRole(admin.role)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {admin.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canEditAdmin && onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Informations générales</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</span>
                  {getStatusDisplay()}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ID</span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono">{admin._id}</span>
                </div>

                {admin.territory && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Territoire
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">{admin.territory}</span>
                  </div>
                )}

                {admin.teamName && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Building className="w-4 h-4 mr-1" />
                      Équipe
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">{admin.teamName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Dates importantes</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Créé le
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">{formatDate(admin.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Dernière connexion
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">{formatDate(admin.lastLogin)}</span>
                </div>

                {admin.updatedAt && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Modifié le
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">{formatDate(admin.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manager Information */}
          {admin.managedBy && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Manager</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {admin.managedBy.firstName?.[0] || 'M'}{admin.managedBy.lastName?.[0] || 'G'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {formatFullName(admin.managedBy.firstName, admin.managedBy.lastName)}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {admin.managedBy.role === 'super_admin' ? 'Super Administrateur' : formatUserRole(admin.managedBy.role)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Permissions
              </h4>
              <span className="text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full">
                {getPermissionCount(admin.permissions)} / {admin.permissions ? Object.keys(admin.permissions).length : 0} accordées
              </span>
            </div>
            
            {/* Special message for CEO and Super Admin */}
            {(admin.role === 'ceo' || admin.role === 'super_admin') && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  {admin.role === 'ceo' ? (
                    <Crown className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <Star className="w-5 h-5 text-purple-600" />
                  )}
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {admin.role === 'ceo' 
                      ? "Cet utilisateur est le CEO et a automatiquement toutes les permissions."
                      : "Cet utilisateur est Super Admin et a automatiquement toutes les permissions."}
                  </p>
                </div>
              </div>
            )}
            
            {admin.permissions && Object.keys(admin.permissions).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(admin.permissions).map(([permission, granted]) => (
                  <div 
                    key={permission} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      granted || admin.role === 'ceo' || admin.role === 'super_admin'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {permissionLabels[permission] || permission}
                    </span>
                    {(granted || admin.role === 'ceo' || admin.role === 'super_admin') ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Aucune permission configurée</p>
              </div>
            )}
          </div>

          {/* Suspension Information */}
          {admin.isSuspended && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informations de suspension</h4>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="space-y-3">
                  {admin.suspendedAt && (
                    <div>
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Suspendu le:</span>
                      <p className="text-sm text-red-900 dark:text-red-200">{formatDate(admin.suspendedAt)}</p>
                    </div>
                  )}
                  {admin.suspensionReason && (
                    <div>
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Raison:</span>
                      <p className="text-sm text-red-900 dark:text-red-200">{admin.suspensionReason}</p>
                    </div>
                  )}
                  {admin.suspendedBy && (
                    <div>
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Suspendu par:</span>
                      <p className="text-sm text-red-900 dark:text-red-200">
                        {formatFullName(admin.suspendedBy.firstName, admin.suspendedBy.lastName)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Dernière mise à jour: {formatDate(admin.updatedAt)}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDetailsModal;
