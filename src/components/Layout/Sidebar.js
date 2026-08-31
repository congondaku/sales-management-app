import React, { useState } from 'react';
import {
  Home, Users, DollarSign, BarChart3, User, Shield, Settings,
  LogOut, X, TrendingUp, Info, Lock, CheckCircle, XCircle,
  Eye, UserPlus, Target, FileText, Calendar, Network, Building,
  Megaphone, TrendingUpDown, Gift, ClipboardCheck, Star, Hotel,
  HeartHandshake, Contact, Link2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/permissions';
import { PERMISSION_LABELS } from '../../utils/constants';

const Sidebar = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
  const { user, logout, userType, isAdmin, isSalesPerson } = useAuth();

  const hasFullAccess = user?.role === 'ceo' || user?.role === 'super_admin';

  const [showPermissionDetails, setShowPermissionDetails] = useState(false);

  const getMenuItems = () => {
    if (isAdmin()) {
      return [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: Home,
          permission: null,
          description: 'Vue d\'ensemble des performances'
        },
        {
          id: 'ads',
          label: 'Publicités',
          icon: Megaphone,
          permission: null,
          description: 'Gérer les bannières publicitaires',
          ceoOnly: true,
        },
        {
          id: 'property-requests',
          label: 'Demandes clients',
          icon: ClipboardCheck,
          permission: null,
          description: 'Voir toutes les demandes de propriétés',
        },
        {
          id: 'invoices',
          label: 'Factures',
          icon: FileText,
          permission: null,
          description: 'Créer et gérer les factures clients'
        },
        {
          id: 'freelistings',
          label: 'Annonces Gratuites',
          icon: Gift,
          permission: null,
          description: 'Gérer les annonces gratuites'
        },
        {
          id: 'agents',
          label: 'Agents Immobiliers',
          icon: Contact,
          permission: null,
          description: 'Carnet d\'adresses des agents et suivi KYC'
        },
        {
          id: 'assignments',
          label: 'Affectations',
          icon: Link2,
          permission: null,
          description: 'Lier ou délier un client et un agent'
        },
        {
          id: 'communes',
          label: 'Communes',
          icon: Building,
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
        // ── Single Hotels item — tabs inside handle KYC + Operators ──
        {
          id: 'hotels',
          label: 'Hôtels',
          icon: Hotel,
          permission: null,
          description: 'Opérateurs hôteliers & KYC'
        },
        {
          id: 'partners',
          label: 'Partenaires',
          icon: HeartHandshake,
          permission: null,
          description: 'Demandes partenaires business'
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
          permission: 'canViewAllData',
          description: 'Configuration du compte'
        }
      ];
    } else if (isSalesPerson()) {
      return [
        {
          id: 'sales-dashboard',
          label: 'Mon Tableau de bord',
          icon: Home,
          permission: null,
          description: 'Vue d\'ensemble de mes performances'
        },
        // ── Single Hotels item for salesperson ───────────────────────
        {
          id: 'hotels',
          label: 'Hôtels',
          icon: Hotel,
          permission: null,
          description: 'Opérateurs hôteliers & KYC'
        },
        {
          id: 'partners',
          label: 'Partenaires',
          icon: HeartHandshake,
          permission: null,
          description: 'Demandes partenaires business'
        },
        {
          id: 'property-requests',
          label: 'Demandes clients',
          icon: ClipboardCheck,
          permission: null,
          description: 'Voir toutes les demandes de propriétés',
        },
        {
          id: 'invoices',
          label: 'Factures',
          icon: FileText,
          permission: null,
          description: 'Créer et gérer les factures clients'
        },
        {
          id: 'freelistings',
          label: 'Annonces Gratuites',
          icon: Gift,
          permission: null,
          description: 'Créer des annonces gratuites pour les clients'
        },
        {
          id: 'agents',
          label: 'Agents Immobiliers',
          icon: Contact,
          permission: null,
          description: 'Trouver un agent pour un client'
        },
        {
          id: 'assignments',
          label: 'Affectations',
          icon: Link2,
          permission: null,
          description: 'Lier ou délier un client et un agent'
        },
        {
          id: 'communes',
          label: 'Communes',
          icon: Building,
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
          id: 'register-user',
          label: 'Inscrire Utilisateur',
          icon: UserPlus,
          permission: null,
          description: 'Enregistrer un nouveau client'
        },
        {
          id: 'my-users',
          label: 'Mes Utilisateurs',
          icon: UserPlus,
          permission: null,
          description: 'Utilisateurs que j\'ai enregistrés'
        },
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

  const checkPermission = (item) => {
    if (!item.permission && !item.ceoOnly) return true;
    if (item.ceoOnly) return hasFullAccess;
    if (isAdmin()) return hasPermission(user, item.permission);
    if (isSalesPerson()) return true;
    return false;
  };

  const visibleMenuItems = menuItems.filter(checkPermission);
  const hiddenMenuItems = menuItems.filter(item => !checkPermission(item));

  const handleLogout = () => logout();

  const getPermissionStats = () => {
    if (isAdmin() && user?.permissions) {
      return {
        total: Object.keys(user.permissions).length,
        granted: hasFullAccess
          ? Object.keys(user.permissions).length
          : Object.values(user.permissions).filter(p => p === true).length
      };
    } else if (isSalesPerson()) {
      return { total: 3, granted: 3 };
    }
    return { total: 0, granted: 0 };
  };

  const permissionStats = getPermissionStats();

  const getRoleDisplay = () => {
    if (isAdmin()) {
      if (user?.role === 'ceo') return 'PDG';
      if (user?.role === 'super_admin') return 'Super Admin';
      if (user?.role === 'regional_manager') return 'Directeur Régional';
      if (user?.role === 'sales_manager') return 'Directeur des Ventes';
      if (user?.role === 'team_leader') return 'Chef d\'Équipe';
      if (user?.role === 'admin') return 'Administrateur';
      return user?.role || 'Utilisateur';
    } else if (isSalesPerson()) {
      return 'Commercial';
    }
    return 'Utilisateur';
  };

  const getHeaderInfo = () => {
    if (isAdmin()) {
      return {
        title: hasFullAccess ? 'Super Admin Panel' : 'Admin Panel',
        subtitle: hasFullAccess ? 'Gestion Complète' : 'Gestion des Ventes'
      };
    } else if (isSalesPerson()) {
      return { title: 'Espace Commercial', subtitle: 'Mon Interface' };
    }
    return { title: 'Dashboard', subtitle: 'Interface Utilisateur' };
  };

  const headerInfo = getHeaderInfo();

  const getHeaderBgColor = () => {
    if (user?.role === 'ceo') return 'bg-yellow-600';
    if (user?.role === 'super_admin') return 'bg-purple-600';
    if (isSalesPerson()) return 'bg-green-600';
    return 'bg-blue-600';
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out z-50 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>

        {/* App header */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${getHeaderBgColor()} rounded-lg p-2`}>
                {hasFullAccess ? <Star className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{headerInfo.title}</h2>
                <p className="text-xs text-gray-400">{headerInfo.subtitle}</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${getHeaderBgColor()} rounded-full flex items-center justify-center`}>
              <span className="text-sm font-medium">
                {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || 'S'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{getRoleDisplay()}</p>
              {hasFullAccess && (
                <p className="text-xs text-purple-400 truncate flex items-center">
                  <Star className="h-3 w-3 mr-1" /> Accès complet
                </p>
              )}
              {isSalesPerson() && user?.salesId && (
                <p className="text-xs text-green-400 truncate">ID: {user.salesId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Permission bar */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              {isAdmin() ? 'Permissions actives:' : 'Accès autorisé:'}
            </span>
            {isAdmin() && !hasFullAccess && (
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
                className={`h-2 rounded-full transition-all duration-300 ${hasFullAccess ? 'bg-purple-500' : 'bg-green-500'}`}
                style={{ width: `${permissionStats.total > 0 ? (permissionStats.granted / permissionStats.total) * 100 : 0}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${hasFullAccess ? 'text-purple-400' : 'text-green-400'}`}>
              {permissionStats.granted} / {permissionStats.total}
            </span>
          </div>
          {hasFullAccess && (
            <p className="text-xs text-purple-400 mt-2 flex items-center justify-center">
              <Star className="h-3 w-3 mr-1" /> Toutes les permissions sont activées
            </p>
          )}
        </div>

        {/* Permission detail breakdown */}
        {showPermissionDetails && isAdmin() && !hasFullAccess && (
          <div className="p-4 border-b border-gray-700 bg-gray-800 max-h-32 overflow-y-auto custom-scrollbar flex-shrink-0">
            <h4 className="text-xs font-medium text-gray-300 mb-2">Toutes les permissions:</h4>
            <div className="space-y-1">
              {user?.permissions && Object.entries(user.permissions).map(([permission, granted]) => (
                <div key={permission} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 truncate mr-2">
                    {PERMISSION_LABELS[permission] || permission}
                  </span>
                  {granted
                    ? <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    : <XCircle className="h-3 w-3 text-red-500   flex-shrink-0" />
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Territory badge (salesperson) */}
        {isSalesPerson() && user?.territory && (
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="text-center">
              <p className="text-xs text-gray-400">Mon Territoire</p>
              <p className="text-sm font-medium text-green-400">{user.territory}</p>
              {user.teamName && <p className="text-xs text-gray-400 mt-1">Équipe: {user.teamName}</p>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar min-h-0">
          <div className="mb-6">
            <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
              {isAdmin() ? 'Pages Accessibles' : 'Mon Espace'}
            </h3>
            <ul className="space-y-2">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => { setCurrentPage(item.id); setIsSidebarOpen(false); }}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left group
                        ${isActive
                          ? hasFullAccess
                            ? 'bg-purple-600 text-white'
                            : isSalesPerson()
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }
                      `}
                      title={item.description}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Locked items (admin only) */}
          {isAdmin() && hiddenMenuItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Accès Restreint</h3>
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
                          <span className="text-xs text-gray-500 truncate block">Permission requise</span>
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

        {/* Logout */}
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
