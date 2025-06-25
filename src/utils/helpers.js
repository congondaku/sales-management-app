import { CURRENCY_SYMBOLS, DATE_FORMATS } from './constants';

// Formatage des nombres
export const formatNumber = (number, decimals = 2) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

// Formatage des devises
export const formatCurrency = (amount, currency = 'EUR') => {
  if (typeof amount !== 'number' || isNaN(amount)) return `0 ${CURRENCY_SYMBOLS[currency]}`;
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Formatage des pourcentages
export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${formatNumber(value, decimals)}%`;
};

// Formatage des dates
export const formatDate = (date, format = DATE_FORMATS.SHORT) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';

  const options = {
    [DATE_FORMATS.SHORT]: { day: '2-digit', month: '2-digit', year: 'numeric' },
    [DATE_FORMATS.LONG]: { day: 'numeric', month: 'long', year: 'numeric' },
    [DATE_FORMATS.WITH_TIME]: { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    },
    [DATE_FORMATS.TIME_ONLY]: { hour: '2-digit', minute: '2-digit' }
  };

  return new Intl.DateTimeFormat('fr-FR', options[format]).format(dateObj);
};

// Formatage du temps relatif
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) return 'À l\'instant';
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 2592000) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  
  return formatDate(dateObj);
};

// Générer des initiales à partir d'un nom
export const getInitials = (firstName = '', lastName = '') => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
};

// Générer une couleur d'avatar basée sur le nom
export const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Tronquer le texte
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

// Nettoyer et formater les numéros de téléphone
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Supprimer tous les caractères non numériques sauf +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format français basique
  if (cleaned.startsWith('+33')) {
    const number = cleaned.substring(3);
    return `+33 ${number.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`;
  }
  
  return cleaned;
};

// Valider l'email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Valider le numéro de téléphone
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleaned = phone.replace(/[^\d+]/g, '');
  return phoneRegex.test(cleaned);
};

// Générer un mot de passe sécurisé
export const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Vérifier la force du mot de passe
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Très faible' };
  
  let score = 0;
  
  // Longueur
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Complexité
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const levels = [
    { score: 0, label: 'Très faible', color: 'text-red-600' },
    { score: 1, label: 'Faible', color: 'text-red-500' },
    { score: 2, label: 'Moyen', color: 'text-yellow-500' },
    { score: 3, label: 'Bon', color: 'text-blue-500' },
    { score: 4, label: 'Fort', color: 'text-green-500' },
    { score: 5, label: 'Très fort', color: 'text-green-600' },
    { score: 6, label: 'Excellent', color: 'text-green-700' }
  ];
  
  return levels.find(level => level.score === score) || levels[0];
};

// Debounce function
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone d'un objet
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Comparer deux objets
export const isEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// Filtrer un objet par ses clés
export const pickKeys = (obj, keys) => {
  const result = {};
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Omettre des clés d'un objet
export const omitKeys = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

// Convertir les paramètres d'objet en query string
export const objectToQueryString = (obj) => {
  const params = new URLSearchParams();
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item));
      } else {
        params.append(key, value);
      }
    }
  });
  
  return params.toString();
};

// Parser un query string en objet
export const queryStringToObject = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    if (result[key]) {
      // Si la clé existe déjà, créer un tableau
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

// Calculer la différence en pourcentage
export const calculatePercentageChange = (oldValue, newValue) => {
  if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Grouper un tableau par une propriété
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

// Trier un tableau par multiple critères
export const sortBy = (array, criteria) => {
  return array.sort((a, b) => {
    for (const criterion of criteria) {
      const { key, direction = 'asc' } = criterion;
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// Obtenir une couleur de statut
export const getStatusColor = (status) => {
  const colors = {
    success: 'text-green-600 bg-green-100',
    error: 'text-red-600 bg-red-100',
    warning: 'text-yellow-600 bg-yellow-100',
    info: 'text-blue-600 bg-blue-100',
    pending: 'text-gray-600 bg-gray-100',
    active: 'text-green-600 bg-green-100',
    inactive: 'text-red-600 bg-red-100',
    confirmed: 'text-green-600 bg-green-100',
    paid_out: 'text-blue-600 bg-blue-100',
    cancelled: 'text-red-600 bg-red-100'
  };
  
  return colors[status] || colors.pending;
};

// Générer un slug à partir d'un texte
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9 -]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Supprimer les tirets multiples
    .trim();
};

// Capitaliser la première lettre
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Capitaliser chaque mot
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

// Générer un nom de fichier sécurisé
export const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

// Télécharger un fichier
export const downloadFile = (data, fileName, type = 'text/csv') => {
  const file = new Blob([data], { type });
  const a = document.createElement('a');
  const url = URL.createObjectURL(file);
  
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
};

// Copier du texte dans le presse-papiers
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Vérifier si on est sur mobile
export const isMobile = () => {
  return window.innerWidth <= 768;
};

// Vérifier si on est sur tablette
export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

// Vérifier si on est sur desktop
export const isDesktop = () => {
  return window.innerWidth > 1024;
};

// Obtenir la taille de l'écran
export const getScreenSize = () => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

// Délai d'attente
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry avec backoff exponentiel
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
};

// Générer un ID unique
export const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}_${randomStr}`;
};

// Vérifier si une URL est valide
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Obtenir l'extension d'un fichier
export const getFileExtension = (fileName) => {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Formater la taille d'un fichier
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Vérifier si une date est aujourd'hui
export const isToday = (date) => {
  const today = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
};

// Vérifier si une date est cette semaine
export const isThisWeek = (date) => {
  const today = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  return dateObj >= startOfWeek && dateObj <= endOfWeek;
};

// Obtenir le début de la semaine
export const getStartOfWeek = (date = new Date()) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = dateObj.getDay();
  const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
  return new Date(dateObj.setDate(diff));
};

// Obtenir la fin de la semaine
export const getEndOfWeek = (date = new Date()) => {
  const startOfWeek = getStartOfWeek(date);
  return new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
};

// Obtenir le début du mois
export const getStartOfMonth = (date = new Date()) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
};

// Obtenir la fin du mois
export const getEndOfMonth = (date = new Date()) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
};

//helper.js