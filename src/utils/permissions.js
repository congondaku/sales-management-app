import { PERMISSIONS, USER_ROLES } from './constants';

// Utilitaires de gestion des permissions

// Vérifier si un utilisateur a une permission spécifique
export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  
  // Le CEO a toutes les permissions
  if (user.role === USER_ROLES.CEO) return true;
  
  return user.permissions[permission] === true;
};

// Vérifier si un utilisateur peut gérer un autre utilisateur
export const canManageUser = (currentUser, targetUser, targetType = 'SalesPerson') => {
  if (!currentUser || !targetUser) return false;
  
  // Le CEO peut gérer tout le monde
  if (currentUser.role === USER_ROLES.CEO) return true;
  
  // Vérifier la hiérarchie directe
  if (targetUser.managedBy && targetUser.managedBy.toString() === currentUser._id.toString()) {
    return true;
  }
  
  // Vérifier les permissions de scope
  if (currentUser.managementScope && currentUser.managementScope[targetType.toLowerCase() + 's']) {
    return currentUser.managementScope[targetType.toLowerCase() + 's'].includes(targetUser._id);
  }
  
  return false;
};

// ✅ UPDATED: Obtenir les permissions par défaut selon le rôle - ALL ADMINS can manage sales people
export const getDefaultPermissionsByRole = (role) => {
  const permissions = {};
  
  // Initialiser toutes les permissions à false
  Object.values(PERMISSIONS).forEach(permission => {
    permissions[permission] = false;
  });
  
  switch (role) {
    case USER_ROLES.CEO:
      // Le CEO a toutes les permissions
      Object.values(PERMISSIONS).forEach(permission => {
        permissions[permission] = true;
      });
      break;
      
    case USER_ROLES.REGIONAL_MANAGER:
      // ✅ UPDATED: All sales people management permissions by default
      permissions[PERMISSIONS.CAN_CREATE_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_EDIT_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_DELETE_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_VIEW_ALL_SALES_PEOPLE] = true;
      // Other permissions remain as before
      permissions[PERMISSIONS.CAN_VIEW_COMMISSIONS] = true;
      permissions[PERMISSIONS.CAN_PROCESS_PAYOUTS] = true;
      permissions[PERMISSIONS.CAN_VIEW_ANALYTICS] = true;
      permissions[PERMISSIONS.CAN_VIEW_ALL_DATA] = true;
      permissions[PERMISSIONS.CAN_CREATE_ADMINS] = true;
      permissions[PERMISSIONS.CAN_EDIT_ADMINS] = true;
      break;
      
    case USER_ROLES.SALES_MANAGER:
      // ✅ UPDATED: All sales people management permissions by default
      permissions[PERMISSIONS.CAN_CREATE_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_EDIT_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_DELETE_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_VIEW_ALL_SALES_PEOPLE] = true;
      // Other permissions remain as before
      permissions[PERMISSIONS.CAN_VIEW_COMMISSIONS] = true;
      permissions[PERMISSIONS.CAN_PROCESS_PAYOUTS] = true;
      permissions[PERMISSIONS.CAN_VIEW_ANALYTICS] = true;
      break;
      
    case USER_ROLES.TEAM_LEADER:
      // ✅ UPDATED: All sales people management permissions by default
      permissions[PERMISSIONS.CAN_CREATE_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_EDIT_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_DELETE_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_VIEW_ALL_SALES_PEOPLE] = true;
      // Other permissions remain as before
      permissions[PERMISSIONS.CAN_VIEW_COMMISSIONS] = true;
      permissions[PERMISSIONS.CAN_VIEW_ANALYTICS] = true;
      break;
      
    case USER_ROLES.ADMIN:
      // ✅ UPDATED: All sales people management permissions by default
      permissions[PERMISSIONS.CAN_CREATE_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_EDIT_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_DELETE_SALES_PEOPLE] = true;
      permissions[PERMISSIONS.CAN_VIEW_ALL_SALES_PEOPLE] = true;
      // Other permissions remain as before
      permissions[PERMISSIONS.CAN_VIEW_COMMISSIONS] = true;
      permissions[PERMISSIONS.CAN_VIEW_ALL_DATA] = true;
      break;
      
    default:
      // Aucune permission par défaut pour les autres rôles
      break;
  }
  
  return permissions;
};

// Grouper les permissions par catégorie
export const groupPermissionsByCategory = (permissions) => {
  return {
    salesManagement: {
      label: 'Gestion des Commerciaux',
      permissions: [
        PERMISSIONS.CAN_CREATE_SALES_PEOPLE,
        PERMISSIONS.CAN_EDIT_SALES_PEOPLE,
        PERMISSIONS.CAN_DELETE_SALES_PEOPLE,
        PERMISSIONS.CAN_VIEW_ALL_SALES_PEOPLE
      ].filter(permission => permissions.hasOwnProperty(permission))
    },
    commissionManagement: {
      label: 'Gestion des Commissions',
      permissions: [
        PERMISSIONS.CAN_VIEW_COMMISSIONS,
        PERMISSIONS.CAN_SET_COMMISSION_RATES,
        PERMISSIONS.CAN_PROCESS_PAYOUTS,
        PERMISSIONS.CAN_SEE_COMMISSION_RATES
      ].filter(permission => permissions.hasOwnProperty(permission))
    },
    adminManagement: {
      label: 'Gestion des Administrateurs',
      permissions: [
        PERMISSIONS.CAN_CREATE_ADMINS,
        PERMISSIONS.CAN_EDIT_ADMINS,
        PERMISSIONS.CAN_DELETE_ADMINS
      ].filter(permission => permissions.hasOwnProperty(permission))
    },
    analytics: {
      label: 'Analytics et Rapports',
      permissions: [
        PERMISSIONS.CAN_VIEW_ANALYTICS,
        PERMISSIONS.CAN_VIEW_ALL_DATA
      ].filter(permission => permissions.hasOwnProperty(permission))
    },
    system: {
      label: 'Administration Système',
      permissions: [
        PERMISSIONS.CAN_MANAGE_SYSTEM,
        PERMISSIONS.CAN_MANAGE_PERMISSIONS
      ].filter(permission => permissions.hasOwnProperty(permission))
    }
  };
};

// Vérifier si un utilisateur peut accéder à une route
export const canAccessRoute = (user, route) => {
  if (!user) return false;
  
  const routePermissions = {
    '/dashboard': [PERMISSIONS.CAN_VIEW_ANALYTICS],
    '/sales-people': [PERMISSIONS.CAN_VIEW_ALL_SALES_PEOPLE],
    '/commissions': [PERMISSIONS.CAN_VIEW_COMMISSIONS],
    '/analytics': [PERMISSIONS.CAN_VIEW_ANALYTICS],
    '/users': [PERMISSIONS.CAN_VIEW_ALL_DATA],
    '/permissions': [PERMISSIONS.CAN_MANAGE_PERMISSIONS],
    '/settings': [] // Accessible à tous les utilisateurs connectés
  };
  
  const requiredPermissions = routePermissions[route];
  
  // Si aucune permission n'est requise, l'accès est autorisé
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  
  // Vérifier si l'utilisateur a au moins une des permissions requises
  return requiredPermissions.some(permission => hasPermission(user, permission));
};

// Obtenir les actions disponibles pour un utilisateur sur une entité
export const getAvailableActions = (user, entityType, entity = null) => {
  const actions = [];
  
  switch (entityType) {
    case 'SalesPerson':
      if (hasPermission(user, PERMISSIONS.CAN_VIEW_ALL_SALES_PEOPLE)) {
        actions.push('view');
      }
      
      if (hasPermission(user, PERMISSIONS.CAN_EDIT_SALES_PEOPLE)) {
        if (!entity || canManageUser(user, entity, 'SalesPerson')) {
          actions.push('edit', 'suspend', 'activate', 'setTargets');
        }
      }
      
      if (hasPermission(user, PERMISSIONS.CAN_DELETE_SALES_PEOPLE)) {
        if (!entity || canManageUser(user, entity, 'SalesPerson')) {
          actions.push('delete');
        }
      }
      
      if (hasPermission(user, PERMISSIONS.CAN_SET_COMMISSION_RATES)) {
        actions.push('setCommissionRate');
      }
      break;
      
    case 'Commission':
      if (hasPermission(user, PERMISSIONS.CAN_VIEW_COMMISSIONS)) {
        actions.push('view');
      }
      
      if (hasPermission(user, PERMISSIONS.CAN_PROCESS_PAYOUTS)) {
        actions.push('markPaid', 'cancel');
      }
      break;
      
    case 'Admin':
      if (hasPermission(user, PERMISSIONS.CAN_VIEW_ALL_DATA)) {
        actions.push('view');
      }
      
      if (hasPermission(user, PERMISSIONS.CAN_EDIT_ADMINS)) {
        if (!entity || canManageUser(user, entity, 'Admin')) {
          actions.push('edit', 'suspend', 'activate');
        }
      }
      
      if (hasPermission(user, PERMISSIONS.CAN_DELETE_ADMINS)) {
        if (!entity || canManageUser(user, entity, 'Admin')) {
          actions.push('delete');
        }
      }
      
      if (hasPermission(user, PERMISSIONS.CAN_MANAGE_PERMISSIONS)) {
        actions.push('managePermissions');
      }
      break;
      
    default:
      break;
  }
  
  return actions;
};

// Vérifier si un utilisateur peut voir les données sensibles
export const canViewSensitiveData = (user, dataType) => {
  switch (dataType) {
    case 'commissionRates':
      return hasPermission(user, PERMISSIONS.CAN_SEE_COMMISSION_RATES);
      
    case 'commissionAmounts':
      return hasPermission(user, PERMISSIONS.CAN_VIEW_COMMISSIONS);
      
    case 'personalData':
      return hasPermission(user, PERMISSIONS.CAN_VIEW_ALL_DATA);
      
    case 'systemSettings':
      return hasPermission(user, PERMISSIONS.CAN_MANAGE_SYSTEM);
      
    default:
      return false;
  }
};

// Filtrer les données selon les permissions de l'utilisateur
export const filterDataByPermissions = (user, data, dataType) => {
  if (!data) return data;
  
  switch (dataType) {
    case 'commission':
      if (!canViewSensitiveData(user, 'commissionRates')) {
        if (Array.isArray(data)) {
          return data.map(item => {
            const { commissionRate, ...rest } = item;
            return rest;
          });
        } else {
          const { commissionRate, ...rest } = data;
          return rest;
        }
      }
      break;
      
    case 'salesPerson':
      if (!canViewSensitiveData(user, 'commissionRates')) {
        if (Array.isArray(data)) {
          return data.map(item => {
            const { commissionRate, ...rest } = item;
            return rest;
          });
        } else {
          const { commissionRate, ...rest } = data;
          return rest;
        }
      }
      break;
      
    default:
      break;
  }
  
  return data;
};

// Obtenir le niveau hiérarchique d'un rôle
export const getRoleHierarchyLevel = (role) => {
  const levels = {
    [USER_ROLES.CEO]: 1,
    [USER_ROLES.REGIONAL_MANAGER]: 2,
    [USER_ROLES.SALES_MANAGER]: 3,
    [USER_ROLES.TEAM_LEADER]: 4,
    [USER_ROLES.ADMIN]: 5,
    [USER_ROLES.SALES_PERSON]: 6
  };
  
  return levels[role] || 999;
};

// Vérifier si un utilisateur peut gérer un rôle spécifique
export const canManageRole = (userRole, targetRole) => {
  const userLevel = getRoleHierarchyLevel(userRole);
  const targetLevel = getRoleHierarchyLevel(targetRole);
  
  // Un utilisateur peut gérer des rôles de niveau inférieur
  return userLevel < targetLevel;
};

// Obtenir les rôles qu'un utilisateur peut assigner
export const getAssignableRoles = (userRole) => {
  const userLevel = getRoleHierarchyLevel(userRole);
  
  return Object.values(USER_ROLES).filter(role => {
    const roleLevel = getRoleHierarchyLevel(role);
    return roleLevel > userLevel;
  });
};

// Vérifier les permissions en masse
export const hasAnyPermission = (user, permissions) => {
  if (!user || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(permission => hasPermission(user, permission));
};

// Vérifier que l'utilisateur a toutes les permissions requises
export const hasAllPermissions = (user, permissions) => {
  if (!user || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.every(permission => hasPermission(user, permission));
};

// Calculer le score de permissions d'un utilisateur
export const calculatePermissionScore = (permissions) => {
  if (!permissions || typeof permissions !== 'object') return 0;
  
  const totalPermissions = Object.keys(permissions).length;
  const grantedPermissions = Object.values(permissions).filter(p => p === true).length;
  
  return totalPermissions > 0 ? (grantedPermissions / totalPermissions) * 100 : 0;
};

// Comparer les permissions de deux utilisateurs
export const comparePermissions = (user1Permissions, user2Permissions) => {
  const allPermissions = new Set([
    ...Object.keys(user1Permissions || {}),
    ...Object.keys(user2Permissions || {})
  ]);
  
  const differences = [];
  
  allPermissions.forEach(permission => {
    const user1HasPermission = user1Permissions?.[permission] === true;
    const user2HasPermission = user2Permissions?.[permission] === true;
    
    if (user1HasPermission !== user2HasPermission) {
      differences.push({
        permission,
        user1: user1HasPermission,
        user2: user2HasPermission
      });
    }
  });
  
  return differences;
};
