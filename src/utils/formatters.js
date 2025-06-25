import { 
  CURRENCY_SYMBOLS, 
  COMMISSION_STATUS_LABELS, 
  USER_STATUS_LABELS,
  ROLE_LABELS 
} from './constants';

// Formatage spécialisé pour l'application de gestion des ventes

// Formater un nom complet
export const formatFullName = (firstName, lastName) => {
  if (!firstName && !lastName) return 'Nom non défini';
  if (!firstName) return lastName;
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
};

// Formater un nom pour l'affichage (avec initiales si trop long)
export const formatDisplayName = (firstName, lastName, maxLength = 20) => {
  const fullName = formatFullName(firstName, lastName);
  if (fullName.length <= maxLength) return fullName;
  
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return `${firstName} ${initials}.`;
};

// Formater un ID de vente
export const formatSalesId = (salesId) => {
  if (!salesId) return 'ID non défini';
  return salesId.toUpperCase();
};

// Formater un montant de commission
export const formatCommissionAmount = (amount, currency = 'EUR', hideAmount = false) => {
  if (hideAmount) return 'Montant masqué';
  if (typeof amount !== 'number' || isNaN(amount)) return `0 ${CURRENCY_SYMBOLS[currency]}`;
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Formater un taux de commission
export const formatCommissionRate = (rate, hideRate = false) => {
  if (hideRate) return 'Taux masqué';
  if (typeof rate !== 'number' || isNaN(rate)) return '0%';
  
  const percentage = rate * 100;
  return `${percentage.toFixed(1)}%`;
};

// Formater un statut de commission
export const formatCommissionStatus = (status) => {
  return COMMISSION_STATUS_LABELS[status] || status;
};

// Formater un statut d'utilisateur
export const formatUserStatus = (status) => {
  return USER_STATUS_LABELS[status] || status;
};

// Formater un rôle utilisateur
export const formatUserRole = (role) => {
  return ROLE_LABELS[role] || role;
};

// Formater un territoire
export const formatTerritory = (territory) => {
  if (!territory) return 'Territoire non défini';
  return territory.charAt(0).toUpperCase() + territory.slice(1).toLowerCase();
};

// Formater un nom d'équipe
export const formatTeamName = (teamName) => {
  if (!teamName) return 'Équipe non définie';
  return teamName.charAt(0).toUpperCase() + teamName.slice(1).toLowerCase();
};

// Formater un numéro de téléphone pour l'affichage
export const formatPhoneDisplay = (phone) => {
  if (!phone) return 'Non renseigné';
  
  // Nettoyer le numéro
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format français
  if (cleaned.startsWith('+33')) {
    const number = cleaned.substring(3);
    if (number.length === 9) {
      return `+33 ${number[0]} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
    }
  }
  
  // Format international générique
  if (cleaned.startsWith('+')) {
    return cleaned.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  
  // Format français local
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phone;
};

// Formater un email pour l'affichage (tronquer si trop long)
export const formatEmailDisplay = (email, maxLength = 30) => {
  if (!email) return 'Email non renseigné';
  if (email.length <= maxLength) return email;
  
  const [local, domain] = email.split('@');
  if (local.length > maxLength / 2) {
    return `${local.substring(0, maxLength / 2 - 3)}...@${domain}`;
  }
  
  return email;
};

// Formater une date de dernière connexion
export const formatLastLogin = (lastLogin) => {
  if (!lastLogin) return 'Jamais connecté';
  
  const date = typeof lastLogin === 'string' ? new Date(lastLogin) : lastLogin;
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'À l\'instant';
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)}j`;
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

// Formater une période d'analytics
export const formatAnalyticsPeriod = (period) => {
  const periods = {
    week: 'Cette semaine',
    month: 'Ce mois',
    quarter: 'Ce trimestre',
    year: 'Cette année'
  };
  
  return periods[period] || period;
};

// Formater un objectif de performance
export const formatPerformanceTarget = (current, target, type = 'number') => {
  if (typeof target !== 'number' || target === 0) {
    return {
      display: 'Aucun objectif',
      percentage: 0,
      status: 'none'
    };
  }
  
  const percentage = Math.round((current / target) * 100);
  let status = 'below';
  
  if (percentage >= 100) status = 'achieved';
  else if (percentage >= 80) status = 'close';
  
  const display = type === 'currency' 
    ? `${formatCommissionAmount(current)} / ${formatCommissionAmount(target)}`
    : `${current} / ${target}`;
  
  return {
    display,
    percentage,
    status,
    remaining: Math.max(0, target - current)
  };
};

// Formater un indicateur de performance
export const formatPerformanceIndicator = (value, target, format = 'number') => {
  if (typeof value !== 'number') return 'N/A';
  
  const indicator = {
    value: format === 'currency' ? formatCommissionAmount(value) : value.toString(),
    target: target ? (format === 'currency' ? formatCommissionAmount(target) : target.toString()) : null,
    percentage: target ? Math.round((value / target) * 100) : 0,
    trend: null // À calculer avec des données historiques
  };
  
  // Déterminer le statut
  if (!target) {
    indicator.status = 'neutral';
  } else if (indicator.percentage >= 100) {
    indicator.status = 'success';
  } else if (indicator.percentage >= 75) {
    indicator.status = 'warning';
  } else {
    indicator.status = 'danger';
  }
  
  return indicator;
};

// Formater une liste de territoires
export const formatTerritoryList = (territories) => {
  if (!territories || territories.length === 0) return 'Aucun territoire';
  if (territories.length === 1) return formatTerritory(territories[0]);
  if (territories.length <= 3) {
    return territories.map(formatTerritory).join(', ');
  }
  
  return `${territories.slice(0, 2).map(formatTerritory).join(', ')} et ${territories.length - 2} autres`;
};

// Formater un résumé de hiérarchie
export const formatHierarchySummary = (hierarchy) => {
  if (!hierarchy) return 'Hiérarchie non définie';
  
  const { subordinates } = hierarchy;
  const adminCount = subordinates?.admins?.length || 0;
  const salesCount = subordinates?.salesPeople?.length || 0;
  const totalCount = adminCount + salesCount;
  
  if (totalCount === 0) return 'Aucun subordonné';
  if (totalCount === 1) return '1 subordonné';
  
  const parts = [];
  if (adminCount > 0) parts.push(`${adminCount} admin${adminCount > 1 ? 's' : ''}`);
  if (salesCount > 0) parts.push(`${salesCount} commercial${salesCount > 1 ? 'aux' : ''}`);
  
  return parts.join(', ');
};

// Formater un badge de statut
export const formatStatusBadge = (status, type = 'commission') => {
  const badges = {
    commission: {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmée', color: 'bg-green-100 text-green-800' },
      paid_out: { label: 'Payée', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' }
    },
    user: {
      active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-800' },
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' }
    }
  };
  
  const statusConfig = badges[type]?.[status] || { 
    label: status, 
    color: 'bg-gray-100 text-gray-800' 
  };
  
  return statusConfig;
};

// Formater un résumé de permissions
export const formatPermissionsSummary = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    return 'Aucune permission';
  }
  
  const grantedCount = Object.values(permissions).filter(p => p === true).length;
  const totalCount = Object.keys(permissions).length;
  
  if (grantedCount === 0) return 'Aucune permission accordée';
  if (grantedCount === totalCount) return 'Toutes les permissions';
  
  return `${grantedCount}/${totalCount} permissions accordées`;
};

// Formater une adresse complète
export const formatAddress = (address) => {
  if (!address) return 'Adresse non renseignée';
  
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ') || 'Adresse incomplète';
};

// Formater des coordonnées GPS
export const formatCoordinates = (lat, lng, precision = 4) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return 'Coordonnées non disponibles';
  }
  
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

export const formatDate = (date, options = {}) => {
  if (!date) return 'Date non définie';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('fr-FR', defaultOptions).format(dateObj);
};

// Formater une date avec heure
export const formatDateTime = (date) => {
  if (!date) return 'Date non définie';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

// Formater une devise (alias pour formatCommissionAmount)
export const formatCurrency = (amount, currency = 'EUR') => {
  return formatCommissionAmount(amount, currency, false);
};

// Formater un nombre simple
export const formatNumber = (number, decimals = 0) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};