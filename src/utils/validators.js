import { VALIDATION_RULES } from './constants';

// Validateurs pour les formulaires de l'application

// Validation d'email
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email) {
    errors.push('L\'email est requis');
    return { isValid: false, errors };
  }
  
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    errors.push('Format d\'email invalide');
  }
  
  if (email.length > 254) {
    errors.push('L\'email est trop long (maximum 254 caractères)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de mot de passe
export const validatePassword = (password, confirmPassword = null) => {
  const errors = [];
  
  if (!password) {
    errors.push('Le mot de passe est requis');
    return { isValid: false, errors };
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(`Le mot de passe doit contenir au moins ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} caractères`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  if (confirmPassword !== null && password !== confirmPassword) {
    errors.push('Les mots de passe ne correspondent pas');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de numéro de téléphone
export const validatePhone = (phone) => {
  const errors = [];
  
  if (!phone) {
    errors.push('Le numéro de téléphone est requis');
    return { isValid: false, errors };
  }
  
  // Nettoyer le numéro
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (!VALIDATION_RULES.PHONE_REGEX.test(cleaned)) {
    errors.push('Format de téléphone invalide');
  }
  
  // Validation spécifique pour les numéros français
  if (cleaned.startsWith('+33')) {
    const number = cleaned.substring(3);
    if (number.length !== 9) {
      errors.push('Numéro français invalide (doit contenir 9 chiffres après +33)');
    }
  } else if (cleaned.startsWith('0') && cleaned.length !== 10) {
    errors.push('Numéro français invalide (doit contenir 10 chiffres)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de nom (prénom/nom)
export const validateName = (name, fieldName = 'nom') => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push(`Le ${fieldName} est requis`);
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    errors.push(`Le ${fieldName} doit contenir au moins ${VALIDATION_RULES.NAME_MIN_LENGTH} caractères`);
  }
  
  if (trimmedName.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    errors.push(`Le ${fieldName} ne peut pas dépasser ${VALIDATION_RULES.NAME_MAX_LENGTH} caractères`);
  }
  
  // Vérifier que le nom ne contient que des lettres, espaces, tirets et apostrophes
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmedName)) {
    errors.push(`Le ${fieldName} ne peut contenir que des lettres, espaces, tirets et apostrophes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de territoire
export const validateTerritory = (territory) => {
  const errors = [];
  
  if (!territory || territory.trim().length === 0) {
    errors.push('Le territoire est requis');
    return { isValid: false, errors };
  }
  
  const trimmedTerritory = territory.trim();
  
  if (trimmedTerritory.length < 2) {
    errors.push('Le territoire doit contenir au moins 2 caractères');
  }
  
  if (trimmedTerritory.length > 50) {
    errors.push('Le territoire ne peut pas dépasser 50 caractères');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de taux de commission
export const validateCommissionRate = (rate) => {
  const errors = [];
  
  if (rate === null || rate === undefined || rate === '') {
    errors.push('Le taux de commission est requis');
    return { isValid: false, errors };
  }
  
  const numericRate = parseFloat(rate);
  
  if (isNaN(numericRate)) {
    errors.push('Le taux de commission doit être un nombre');
    return { isValid: false, errors };
  }
  
  if (numericRate < 0) {
    errors.push('Le taux de commission ne peut pas être négatif');
  }
  
  if (numericRate > 1) {
    errors.push('Le taux de commission ne peut pas dépasser 100% (1.0)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation d'objectifs de performance
export const validatePerformanceTargets = (targets) => {
  const errors = [];
  
  if (!targets || typeof targets !== 'object') {
    errors.push('Les objectifs doivent être un objet valide');
    return { isValid: false, errors };
  }
  
  const {
    weeklyRegistrations,
    monthlyRegistrations,
    weeklyEarnings,
    monthlyEarnings
  } = targets;
  
  // Validation des inscriptions hebdomadaires
  if (weeklyRegistrations !== undefined) {
    const weekly = parseInt(weeklyRegistrations);
    if (isNaN(weekly) || weekly < 0) {
      errors.push('L\'objectif d\'inscriptions hebdomadaires doit être un nombre positif');
    } else if (weekly > 1000) {
      errors.push('L\'objectif d\'inscriptions hebdomadaires semble irréaliste (maximum 1000)');
    }
  }
  
  // Validation des inscriptions mensuelles
  if (monthlyRegistrations !== undefined) {
    const monthly = parseInt(monthlyRegistrations);
    if (isNaN(monthly) || monthly < 0) {
      errors.push('L\'objectif d\'inscriptions mensuelles doit être un nombre positif');
    } else if (monthly > 5000) {
      errors.push('L\'objectif d\'inscriptions mensuelles semble irréaliste (maximum 5000)');
    }
    
    // Vérifier la cohérence avec l'objectif hebdomadaire
    if (weeklyRegistrations && monthly < weeklyRegistrations * 2) {
      errors.push('L\'objectif mensuel devrait être au moins le double de l\'objectif hebdomadaire');
    }
  }
  
  // Validation des gains hebdomadaires
  if (weeklyEarnings !== undefined) {
    const weeklyEarn = parseFloat(weeklyEarnings);
    if (isNaN(weeklyEarn) || weeklyEarn < 0) {
      errors.push('L\'objectif de gains hebdomadaires doit être un nombre positif');
    } else if (weeklyEarn > 100000) {
      errors.push('L\'objectif de gains hebdomadaires semble irréaliste (maximum 100 000$)');
    }
  }
  
  // Validation des gains mensuels
  if (monthlyEarnings !== undefined) {
    const monthlyEarn = parseFloat(monthlyEarnings);
    if (isNaN(monthlyEarn) || monthlyEarn < 0) {
      errors.push('L\'objectif de gains mensuels doit être un nombre positif');
    } else if (monthlyEarn > 500000) {
      errors.push('L\'objectif de gains mensuels semble irréaliste (maximum 500 000$)');
    }
    
    // Vérifier la cohérence avec l'objectif hebdomadaire
    if (weeklyEarnings && monthlyEarn < weeklyEarnings * 2) {
      errors.push('L\'objectif mensuel de gains devrait être au moins le double de l\'objectif hebdomadaire');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de montant
export const validateAmount = (amount, fieldName = 'montant', min = 0, max = 1000000) => {
  const errors = [];
  
  if (amount === null || amount === undefined || amount === '') {
    errors.push(`Le ${fieldName} est requis`);
    return { isValid: false, errors };
  }
  
  const numericAmount = parseFloat(amount);
  
  if (isNaN(numericAmount)) {
    errors.push(`Le ${fieldName} doit être un nombre`);
    return { isValid: false, errors };
  }
  
  if (numericAmount < min) {
    errors.push(`Le ${fieldName} doit être supérieur ou égal à ${min}`);
  }
  
  if (numericAmount > max) {
    errors.push(`Le ${fieldName} ne peut pas dépasser ${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de date
export const validateDate = (date, fieldName = 'date', required = true) => {
  const errors = [];
  
  if (!date) {
    if (required) {
      errors.push(`La ${fieldName} est requise`);
    }
    return { isValid: !required, errors };
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    errors.push(`La ${fieldName} n'est pas valide`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de plage de dates
export const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  const startValidation = validateDate(startDate, 'date de début');
  const endValidation = validateDate(endDate, 'date de fin');
  
  errors.push(...startValidation.errors, ...endValidation.errors);
  
  if (startValidation.isValid && endValidation.isValid) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (start >= end) {
      errors.push('La date de début doit être antérieure à la date de fin');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de texte libre
export const validateText = (text, fieldName = 'texte', required = true, minLength = 0, maxLength = VALIDATION_RULES.TEXT_MAX_LENGTH) => {
  const errors = [];
  
  if (!text || text.trim().length === 0) {
    if (required) {
      errors.push(`Le ${fieldName} est requis`);
    }
    return { isValid: !required, errors };
  }
  
  const trimmedText = text.trim();
  
  if (trimmedText.length < minLength) {
    errors.push(`Le ${fieldName} doit contenir au moins ${minLength} caractères`);
  }
  
  if (trimmedText.length > maxLength) {
    errors.push(`Le ${fieldName} ne peut pas dépasser ${maxLength} caractères`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation d'URL
export const validateUrl = (url, fieldName = 'URL', required = false) => {
  const errors = [];
  
  if (!url) {
    if (required) {
      errors.push(`L'${fieldName} est requise`);
    }
    return { isValid: !required, errors };
  }
  
  try {
    new URL(url);
  } catch {
    errors.push(`L'${fieldName} n'est pas valide`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de sélection dans une liste
export const validateSelection = (value, options, fieldName = 'sélection', required = true) => {
  const errors = [];
  
  if (!value) {
    if (required) {
      errors.push(`La ${fieldName} est requise`);
    }
    return { isValid: !required, errors };
  }
  
  if (!options.includes(value)) {
    errors.push(`La ${fieldName} n'est pas valide`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation d'ID MongoDB
export const validateMongoId = (id, fieldName = 'identifiant') => {
  const errors = [];
  
  if (!id) {
    errors.push(`L'${fieldName} est requis`);
    return { isValid: false, errors };
  }
  
  // Pattern pour ObjectId MongoDB
  const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
  
  if (!mongoIdPattern.test(id)) {
    errors.push(`L'${fieldName} n'est pas valide`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de formulaire complet de création de commercial
export const validateSalesPersonForm = (formData) => {
  const errors = {};
  
  // Validation du prénom
  const firstNameValidation = validateName(formData.firstName, 'prénom');
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.errors;
  }
  
  // Validation du nom
  const lastNameValidation = validateName(formData.lastName, 'nom');
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.errors;
  }
  
  // Validation de l'email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
  }
  
  // Validation du téléphone
  const phoneValidation = validatePhone(formData.phoneNumber);
  if (!phoneValidation.isValid) {
    errors.phoneNumber = phoneValidation.errors;
  }
  
  // Validation du mot de passe
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors;
  }
  
  // Validation du territoire
  const territoryValidation = validateTerritory(formData.territory);
  if (!territoryValidation.isValid) {
    errors.territory = territoryValidation.errors;
  }
  
  // Validation des objectifs si fournis
  if (formData.targets) {
    const targetsValidation = validatePerformanceTargets(formData.targets);
    if (!targetsValidation.isValid) {
      errors.targets = targetsValidation.errors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation de formulaire de connexion
export const validateLoginForm = (formData) => {
  const errors = {};
  
  // Validation de l'email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
  }
  
  // Validation du mot de passe (plus simple pour la connexion)
  if (!formData.password) {
    errors.password = ['Le mot de passe est requis'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation de formulaire de changement de mot de passe
export const validatePasswordChangeForm = (formData) => {
  const errors = {};
  
  // Validation du mot de passe actuel
  if (!formData.currentPassword) {
    errors.currentPassword = ['Le mot de passe actuel est requis'];
  }
  
  // Validation du nouveau mot de passe
  const newPasswordValidation = validatePassword(formData.newPassword, formData.confirmPassword);
  if (!newPasswordValidation.isValid) {
    errors.newPassword = newPasswordValidation.errors;
  }
  
  // Vérifier que le nouveau mot de passe est différent de l'actuel
  if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
    if (!errors.newPassword) errors.newPassword = [];
    errors.newPassword.push('Le nouveau mot de passe doit être différent de l\'actuel');
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation de filtres de recherche
export const validateSearchFilters = (filters) => {
  const errors = {};
  
  // Validation de la pagination
  if (filters.page) {
    const page = parseInt(filters.page);
    if (isNaN(page) || page < 1) {
      errors.page = ['Le numéro de page doit être un entier positif'];
    }
  }
  
  if (filters.limit) {
    const limit = parseInt(filters.limit);
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.limit = ['La limite doit être entre 1 et 1000'];
    }
  }
  
  // Validation des dates si présentes
  if (filters.dateFrom) {
    const dateValidation = validateDate(filters.dateFrom, 'date de début', false);
    if (!dateValidation.isValid) {
      errors.dateFrom = dateValidation.errors;
    }
  }
  
  if (filters.dateTo) {
    const dateValidation = validateDate(filters.dateTo, 'date de fin', false);
    if (!dateValidation.isValid) {
      errors.dateTo = dateValidation.errors;
    }
  }
  
  // Validation de la plage de dates
  if (filters.dateFrom && filters.dateTo) {
    const rangeValidation = validateDateRange(filters.dateFrom, filters.dateTo);
    if (!rangeValidation.isValid) {
      errors.dateRange = rangeValidation.errors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};


//validator.js