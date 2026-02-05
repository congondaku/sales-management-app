import React, { useState } from 'react';
import {
  Home,
  Users,
  DollarSign,
  BarChart3,
  User,
  Shield,
  Settings,
  LogOut,
  X,
  TrendingUp,
  Info,
  Lock,
  CheckCircle,
  XCircle,
  Eye,
  UserPlus,
  Target,
  FileText,
  Calendar,
  Network,
  Building,
  Megaphone,
  TrendingUpDown,
  Gift
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/permissions';
import { PERMISSION_LABELS } from '../../utils/constants';
import Communes from '../Sales/Communes';

const Sidebar = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
  const { user, logout, userType, isAdmin, isSalesPerson } = useAuth();
  const [showPermissionDetails, setShowPermissionDetails] = useState(false);

  // ✅ ENHANCED: Different menu items based on user type
  const getMenuItems = () => {
    if (isAdmin()) {
      // Admin menu items (enhanced with Organization Chart)
      return [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: Home,
          permission: null,
          description: 'Vue d\'ensemble des performances'
        },
        {
          id: 'freelistings',
          label: 'Annonces Gratuites',
          icon: Gift,
          permission: null,
          description: 'Gérer les annonces gratuites'
        },
        {
          id: 'communes',
          label: 'Communes',
          icon: Building,
          permission: null,
          description: 'Vue d\'ensemble de communes'
        },
        {
          id: 'annoces',
          label: 'Annonces',
          icon: Megaphone,
          permission: null,
          description: 'Vue d\'ensemble de communes'
        },
        {
          id: 'traffic',
          label: 'Traffic',
          icon: TrendingUp,
          permission: null,
          description: 'Performance du site'
        },
        {
          id: 'sales-people',
          label: 'Commerciaux',
          icon: Users,
          permission: 'canViewAllSalesPeople',
          description: 'Gestion de l\'équipe de vente'
        },
        {
          id: 'commissions',
          label: 'Commissions',
          icon: DollarSign,
          permission: 'canViewCommissions',
          description: 'Suivi des commissions et paiements'
        },
        {
          id: 'analytics',
          label: 'Analyses',
          icon: BarChart3,
          permission: 'canViewAnalytics',
          description: 'Rapports et statistiques détaillées'
        },
        {
          id: 'users',
          label: 'Utilisateurs',
          icon: User,
          permission: 'canViewAllData',
          description: 'Gestion des comptes utilisateurs'
        },
        {
          id: 'permissions',
          label: 'Permissions',
          icon: Shield,
          permission: 'canManagePermissions',
          description: 'Configuration des accès et rôles'
        },
        {
          id: 'settings',
          label: 'Paramètres',
          icon: Settings,
          permission: null,
          description: 'Configuration du compte'
        }
      ];
    } else if (isSalesPerson()) {
      // Sales person menu items (simplified but with org chart access)
      return [
        {
          id: 'sales-dashboard',
          label: 'Mon Tableau de bord',
          icon: Home,
          permission: null,
          description: 'Vue d\'ensemble de mes performances'
        },
        {
          id: 'freelistings',
          label: 'Annonces Gratuites',
          icon: Gift,
          permission: null,
          description: 'Créer des annonces gratuites pour les clients'
        },
        {
          id: 'communes',
          label: 'Communes',
          icon: Building,
          permission: null,
          description: 'Vue d\'ensemble de communes'
        },
        {
          id: 'annoces',
          label: 'Annonces',
          icon: Megaphone,
          permission: null,
          description: 'Vue d\'ensemble de communes'
        },
        {
          id: 'traffic',
          label: 'Traffic',
          icon: TrendingUp,
          permission: null,
          description: 'Performance du site'
        },
        {
          id: 'analytics',
          label: 'Analyses',
          icon: BarChart3,
          permission: 'canViewAnalytics',
          description: 'Rapports et statistiques détaillées'
        },
        {
          id: 'register-user',
          label: 'Inscrire Utilisateur',
          icon: UserPlus,
          permission: null,
          description: 'Enregistrer un nouveau client'
        },
        // {
        //   id: 'organization',
        //   label: 'Organigramme',
        //   icon: Network,
        //   permission: null,
        //   description: 'Structure de l\'organisation'
        // },
        {
          id: 'my-users',
          label: 'Mes Utilisateurs',
          icon: UserPlus,
          permission: null,
          description: 'Utilisateurs que j\'ai enregistrés'
        },
        // {
        //   id: 'my-commissions',
        //   label: 'Mes Commissions',
        //   icon: DollarSign,
        //   permission: null,
        //   description: 'Mes commissions et gains'
        // },
        {
          id: 'my-performance',
          label: 'Ma Performance',
          icon: Target,
          permission: null,
          description: 'Objectifs et résultats'
        },
        {
          id: 'sales-profile',
          label: 'Mon Profil',
          icon: User,
          permission: null,
          description: 'Paramètres de mon compte'
        }
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  // ✅ ENHANCED: Permission checking based on user type
  const checkPermission = (item) => {
    if (!item.permission) return true;

    if (isAdmin()) {
      return hasPermission(user, item.permission);
    } else if (isSalesPerson()) {
      // Sales people have access to all their menu items
      return true;
    }

    return false;
  };

  // Séparer les éléments visibles et non visibles
  const visibleMenuItems = menuItems.filter(checkPermission);
  const hiddenMenuItems = menuItems.filter(item => !checkPermission(item));

  const handleLogout = () => {
    logout();
  };

  // ✅ ENHANCED: Permission stats based on user type
  const getPermissionStats = () => {
    if (isAdmin() && user?.permissions) {
      return {
        total: Object.keys(user.permissions).length,
        granted: Object.values(user.permissions).filter(p => p === true).length
      };
    } else if (isSalesPerson()) {
      // Sales people have basic permissions
      return {
        total: 3, // canRegisterUsers, canViewOwnData, canEditProfile
        granted: 3
      };
    }
    return { total: 0, granted: 0 };
  };

  const permissionStats = getPermissionStats();

  // ✅ ENHANCED: User role display
  const getRoleDisplay = () => {
    if (isAdmin()) {
      return user?.role === 'ceo' ? 'PDG' :
        user?.role === 'admin' ? 'Administrateur' :
          user?.role === 'regional_manager' ? 'Directeur Régional' :
            user?.role === 'sales_manager' ? 'Directeur des Ventes' :
              user?.role === 'team_leader' ? 'Chef d\'Équipe' :
                user?.role || 'Utilisateur';
    } else if (isSalesPerson()) {
      return 'Commercial';
    }
    return 'Utilisateur';
  };

  // ✅ ENHANCED: Header text based on user type
  const getHeaderInfo = () => {
    if (isAdmin()) {
      return {
        title: 'Admin Panel',
        subtitle: 'Gestion des Ventes'
      };
    } else if (isSalesPerson()) {
      return {
        title: 'Espace Commercial',
        subtitle: 'Mon Interface'
      };
    }
    return {
      title: 'Dashboard',
      subtitle: 'Interface Utilisateur'
    };
  };

  const headerInfo = getHeaderInfo();

  // ✅ NEW: Highlight organization chart as new feature
  const isNewFeature = (itemId) => {
    return itemId === 'organization';
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out z-50 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>

        {/* ✅ ENHANCED: Header with user type indication */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${isSalesPerson() ? 'bg-green-600' : 'bg-blue-600'} rounded-lg p-2`}>
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{headerInfo.title}</h2>
                <p className="text-xs text-gray-400">{headerInfo.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ✅ ENHANCED: User profile with user type indicator */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${isSalesPerson() ? 'bg-green-600' : 'bg-blue-600'} rounded-full flex items-center justify-center`}>
              <span className="text-sm font-medium">
                {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || 'S'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {getRoleDisplay()}
              </p>
              {isSalesPerson() && user?.salesId && (
                <p className="text-xs text-green-400 truncate">
                  ID: {user.salesId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ✅ ENHANCED: Permission stats (simplified for sales people) */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              {isAdmin() ? 'Permissions actives:' : 'Accès autorisé:'}
            </span>
            {isAdmin() && (
              <button
                onClick={() => setShowPermissionDetails(!showPermissionDetails)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <Eye className="h-3 w-3" />
                <span>{showPermissionDetails ? 'Masquer' : 'Voir'}</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className={`${isSalesPerson() ? 'bg-green-500' : 'bg-green-500'} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${permissionStats.total > 0 ? (permissionStats.granted / permissionStats.total) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-xs text-green-400 font-medium">
              {permissionStats.granted} / {permissionStats.total}
            </span>
          </div>
        </div>

        {/* ✅ ENHANCED: Permission details (admin only) */}
        {showPermissionDetails && isAdmin() && (
          <div className="p-4 border-b border-gray-700 bg-gray-800 max-h-32 overflow-y-auto custom-scrollbar flex-shrink-0">
            <h4 className="text-xs font-medium text-gray-300 mb-2">Toutes les permissions:</h4>
            <div className="space-y-1">
              {user?.permissions && Object.entries(user.permissions).map(([permission, granted]) => (
                <div key={permission} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 truncate mr-2">
                    {PERMISSION_LABELS[permission] || permission}
                  </span>
                  {granted ? (
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ ENHANCED: Territory/Team info for sales people */}
        {isSalesPerson() && user?.territory && (
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="text-center">
              <p className="text-xs text-gray-400">Mon Territoire</p>
              <p className="text-sm font-medium text-green-400">{user.territory}</p>
              {user.teamName && (
                <p className="text-xs text-gray-400 mt-1">Équipe: {user.teamName}</p>
              )}
            </div>
          </div>
        )}

        {/* Menu de navigation */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar min-h-0">
          {/* Pages accessibles */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
              {isAdmin() ? 'Pages Accessibles' : 'Mon Espace'}
            </h3>
            <ul className="space-y-2">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                const isNew = isNewFeature(item.id);

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setCurrentPage(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left group relative
                        ${isActive
                          ? (isSalesPerson() ? 'bg-green-600 text-white' : 'bg-blue-600 text-white')
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }
                      `}
                      title={item.description}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{item.label}</span>
                        {item.permission && isAdmin() && (
                          <span className="text-xs text-gray-400 group-hover:text-gray-300 truncate block">
                            {PERMISSION_LABELS[item.permission]}
                          </span>
                        )}
                      </div>
                      {!item.permission && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ✅ ENHANCED: Hidden pages for admins only */}
          {isAdmin() && hiddenMenuItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                Accès Restreint
              </h3>
              <ul className="space-y-2">
                {hiddenMenuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.id}>
                      <div
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed"
                        title={`Permission requise: ${PERMISSION_LABELS[item.permission] || item.permission}`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{item.label}</span>
                          <span className="text-xs text-gray-500 truncate block">
                            Permission requise
                          </span>
                        </div>
                        <Lock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* Bouton de déconnexion */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
