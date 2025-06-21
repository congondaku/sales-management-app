// Configuration de l'application
export const APP_CONFIG = {
  NAME: 'Système de Gestion des Ventes',
  VERSION: '1.0.0',
  DESCRIPTION: 'Plateforme de gestion hiérarchique des ventes et commissions',
  COMPANY: 'Votre Entreprise'
};

// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://4fm32xbz2d.us-east-1.awsapprunner.com/api',
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Configuration de l'authentification
export const AUTH_CONFIG = {
  TOKEN_KEY: 'admin_token',
  USER_KEY: 'admin_user',
  SESSION_TIMEOUT: parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 3600000, // 1 heure
  AUTO_LOGOUT_WARNING: parseInt(process.env.REACT_APP_AUTO_LOGOUT_WARNING) || 300000, // 5 minutes
  REMEMBER_ME_DURATION: 7 * 24 * 60 * 60 * 1000 // 7 jours
};

// Rôles utilisateur
export const USER_ROLES = {
  CEO: 'ceo',
  REGIONAL_MANAGER: 'regional_manager',
  SALES_MANAGER: 'sales_manager',
  TEAM_LEADER: 'team_leader',
  ADMIN: 'admin',
  SALES_PERSON: 'sales_person'
};

// Libellés des rôles en français
export const ROLE_LABELS = {
  [USER_ROLES.CEO]: 'PDG',
  [USER_ROLES.REGIONAL_MANAGER]: 'Directeur Régional',
  [USER_ROLES.SALES_MANAGER]: 'Directeur des Ventes',
  [USER_ROLES.TEAM_LEADER]: 'Chef d\'Équipe',
  [USER_ROLES.ADMIN]: 'Administrateur',
  [USER_ROLES.SALES_PERSON]: 'Commercial'
};

// Permissions disponibles
export const PERMISSIONS = {
  // Gestion des commerciaux
  CAN_CREATE_SALES_PEOPLE: 'canCreateSalesPeople',
  CAN_EDIT_SALES_PEOPLE: 'canEditSalesPeople',
  CAN_DELETE_SALES_PEOPLE: 'canDeleteSalesPeople',
  CAN_VIEW_ALL_SALES_PEOPLE: 'canViewAllSalesPeople',

  // Gestion des commissions
  CAN_VIEW_COMMISSIONS: 'canViewCommissions',
  CAN_SET_COMMISSION_RATES: 'canSetCommissionRates',
  CAN_PROCESS_PAYOUTS: 'canProcessPayouts',
  CAN_SEE_COMMISSION_RATES: 'canSeeCommissionRates',

  // Gestion des administrateurs
  CAN_CREATE_ADMINS: 'canCreateAdmins',
  CAN_EDIT_ADMINS: 'canEditAdmins',
  CAN_DELETE_ADMINS: 'canDeleteAdmins',

  // Analytics et rapports
  CAN_VIEW_ANALYTICS: 'canViewAnalytics',
  CAN_VIEW_ALL_DATA: 'canViewAllData',

  // Système
  CAN_MANAGE_SYSTEM: 'canManageSystem',
  CAN_MANAGE_PERMISSIONS: 'canManagePermissions'
};

// Libellés des permissions en français
export const PERMISSION_LABELS = {
  [PERMISSIONS.CAN_CREATE_SALES_PEOPLE]: 'Créer des commerciaux',
  [PERMISSIONS.CAN_EDIT_SALES_PEOPLE]: 'Modifier les commerciaux',
  [PERMISSIONS.CAN_DELETE_SALES_PEOPLE]: 'Supprimer les commerciaux',
  [PERMISSIONS.CAN_VIEW_ALL_SALES_PEOPLE]: 'Voir tous les commerciaux',
  [PERMISSIONS.CAN_VIEW_COMMISSIONS]: 'Voir les commissions',
  [PERMISSIONS.CAN_SET_COMMISSION_RATES]: 'Définir les taux de commission',
  [PERMISSIONS.CAN_PROCESS_PAYOUTS]: 'Traiter les paiements',
  [PERMISSIONS.CAN_SEE_COMMISSION_RATES]: 'Voir les taux de commission',
  [PERMISSIONS.CAN_CREATE_ADMINS]: 'Créer des administrateurs',
  [PERMISSIONS.CAN_EDIT_ADMINS]: 'Modifier les administrateurs',
  [PERMISSIONS.CAN_DELETE_ADMINS]: 'Supprimer les administrateurs',
  [PERMISSIONS.CAN_VIEW_ANALYTICS]: 'Voir les analyses',
  [PERMISSIONS.CAN_VIEW_ALL_DATA]: 'Voir toutes les données',
  [PERMISSIONS.CAN_MANAGE_SYSTEM]: 'Gérer le système',
  [PERMISSIONS.CAN_MANAGE_PERMISSIONS]: 'Gérer les permissions'
};

// Statuts des commissions
export const COMMISSION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PAID_OUT: 'paid_out',
  CANCELLED: 'cancelled'
};

// Libellés des statuts de commission
export const COMMISSION_STATUS_LABELS = {
  [COMMISSION_STATUS.PENDING]: 'En attente',
  [COMMISSION_STATUS.CONFIRMED]: 'Confirmée',
  [COMMISSION_STATUS.PAID_OUT]: 'Payée',
  [COMMISSION_STATUS.CANCELLED]: 'Annulée'
};

// Couleurs des statuts de commission
export const COMMISSION_STATUS_COLORS = {
  [COMMISSION_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [COMMISSION_STATUS.CONFIRMED]: 'bg-green-100 text-green-800',
  [COMMISSION_STATUS.PAID_OUT]: 'bg-blue-100 text-blue-800',
  [COMMISSION_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
};

// Statuts des utilisateurs
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

// Libellés des statuts utilisateur
export const USER_STATUS_LABELS = {
  [USER_STATUS.ACTIVE]: 'Actif',
  [USER_STATUS.INACTIVE]: 'Inactif',
  [USER_STATUS.SUSPENDED]: 'Suspendu',
  [USER_STATUS.PENDING]: 'En attente'
};

// Périodes pour les analytics
export const ANALYTICS_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year'
};

// Libellés des périodes
export const PERIOD_LABELS = {
  [ANALYTICS_PERIODS.WEEK]: 'Cette semaine',
  [ANALYTICS_PERIODS.MONTH]: 'Ce mois',
  [ANALYTICS_PERIODS.QUARTER]: 'Ce trimestre',
  [ANALYTICS_PERIODS.YEAR]: 'Cette année'
};

// Types de notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

// Configuration des notifications
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: parseInt(process.env.REACT_APP_TOAST_DURATION) || 5002,
  POSITION: 'top-right',
  MAX_NOTIFICATIONS: 5,
  ENABLE_SOUND: false
};

// Pagination par défaut
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
};

// Configuration des tableaux
export const TABLE_CONFIG = {
  DEFAULT_SORT_DIRECTION: 'desc',
  SORTABLE_COLUMNS: ['createdAt', 'updatedAt', 'name', 'email', 'amount'],
  SEARCHABLE_COLUMNS: ['name', 'email', 'salesId', 'territory']
};

// Formats de date
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
  ISO: 'yyyy-MM-dd'
};

// Devises supportées
export const CURRENCIES = {
  EUR: 'EUR',
  USD: 'USD',
  GBP: 'GBP',
  CAD: 'CAD'
};

// Symboles des devises
export const CURRENCY_SYMBOLS = {
  // [CURRENCIES.EUR]: '€',
  [CURRENCIES.USD]: '$',
  [CURRENCIES.GBP]: '£',
  [CURRENCIES.CAD]: 'C$'
};

// Configuration des graphiques
export const CHART_CONFIG = {
  COLORS: [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316'  // orange-500
  ],
  ANIMATION_DURATION: 300,
  GRID_COLOR: '#e5e7eb',
  TEXT_COLOR: '#6b7280'
};

// Routes de l'application
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SALES_PEOPLE: '/sales-people',
  COMMISSIONS: '/commissions',
  ANALYTICS: '/analytics',
  USERS: '/users',
  PERMISSIONS: '/permissions',
  SETTINGS: '/settings',
  PROFILE: '/profile'
};

// Messages d'erreur communs
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action',
  FORBIDDEN: 'Accès refusé',
  NOT_FOUND: 'Ressource non trouvée',
  VALIDATION_ERROR: 'Erreur de validation des données',
  SERVER_ERROR: 'Erreur interne du serveur',
  TIMEOUT: 'Délai d\'attente dépassé'
};

// Messages de succès communs
export const SUCCESS_MESSAGES = {
  CREATED: 'Créé avec succès',
  UPDATED: 'Mis à jour avec succès',
  DELETED: 'Supprimé avec succès',
  SAVED: 'Sauvegardé avec succès',
  SENT: 'Envoyé avec succès',
  PROCESSED: 'Traité avec succès'
};

// Configuration de validation
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  TEXT_MAX_LENGTH: 500
};

// Configuration de performance
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  LAZY_LOAD_THRESHOLD: 100,
  VIRTUAL_SCROLL_THRESHOLD: 1000
};
