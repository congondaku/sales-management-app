import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, MapPin, Users, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import { hasPermission, getAssignableRoles } from '../../utils/permissions';
import { USER_ROLES, ROLE_LABELS } from '../../utils/constants';

const CreateAdminModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [territories, setTerritories] = useState([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    territory: '',
    teamName: '',
    managedBy: ''
  });

  const [errors, setErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Charger les managers disponibles
      const adminsResponse = await authService.getAllAdmins();
      if (adminsResponse.success) {
        setAvailableManagers(adminsResponse.admins || []);
      }

      // Charger les territoires
      const territoriesResponse = await authService.getTerritories();
      if (territoriesResponse.success) {
        setTerritories(territoriesResponse.territories || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Vérification email en temps réel
    if (field === 'email' && value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      checkEmailAvailability(value);
    }
  };

  const checkEmailAvailability = async (email) => {
    setEmailChecking(true);
    try {
      const response = await authService.checkEmailAvailability(email);
      if (!response.available) {
        setErrors(prev => ({
          ...prev,
          email: 'Cet email est déjà utilisé'
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
    } finally {
      setEmailChecking(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation des champs requis
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const adminData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        territory: formData.territory || undefined,
        teamName: formData.teamName.trim() || undefined,
        managedBy: formData.managedBy || undefined
      };

      const response = await authService.createAdmin(adminData);
      
      if (response.success) {
        onSuccess();
      } else {
        setErrors({ general: response.message });
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les rôles assignables par l'utilisateur actuel
  const assignableRoles = getAssignableRoles(user?.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Créer un Administrateur
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ajoutez un nouveau membre à votre équipe administrative
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            
            {/* Erreur générale */}
            {errors.general && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Informations Personnelles
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                        errors.firstName 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Entrez le prénom"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                        errors.lastName 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Entrez le nom"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={loading}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                      errors.email 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="admin@exemple.com"
                  />
                  {emailChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Sécurité */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Sécurité
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={loading}
                      className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                        errors.password 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                        errors.confirmPassword 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rôle et hiérarchie */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Rôle et Hiérarchie
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rôle *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                      errors.role 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Sélectionner un rôle</option>
                    {assignableRoles.map(role => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Manager
                  </label>
                  <select
                    value={formData.managedBy}
                    onChange={(e) => handleInputChange('managedBy', e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Auto-assignation ({user?.firstName} {user?.lastName})</option>
                    {availableManagers
                      .filter(manager => manager._id !== user?.id)
                      .map(manager => (
                        <option key={manager._id} value={manager._id}>
                          {manager.firstName} {manager.lastName} ({ROLE_LABELS[manager.role]})
                        </option>
                      ))
                    }
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Laissez vide pour vous assigner comme manager
                  </p>
                </div>
              </div>
            </div>

            {/* Territoire et équipe */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Territoire et Équipe
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Territoire
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    {territories.length > 0 ? (
                      <select
                        value={formData.territory}
                        onChange={(e) => handleInputChange('territory', e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      >
                        <option value="">Sélectionner un territoire</option>
                        {territories.map(territory => (
                          <option key={territory.name} value={territory.name}>
                            {territory.name} ({territory.salesPeopleCount} commerciaux)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.territory}
                        onChange={(e) => handleInputChange('territory', e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        placeholder="ex: Nord, Sud, Est..."
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom de l'équipe
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={formData.teamName}
                      onChange={(e) => handleInputChange('teamName', e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      placeholder="ex: Équipe Alpha, Team Commercial..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu des permissions */}
            {formData.role && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Aperçu des Permissions
                </h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Les permissions suivantes seront accordées par défaut pour le rôle <strong>{ROLE_LABELS[formData.role]}</strong>:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {formData.role === USER_ROLES.CEO && (
                      <div className="col-span-2 text-center py-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                          🔑 Toutes les permissions (CEO)
                        </span>
                      </div>
                    )}
                    {formData.role === USER_ROLES.REGIONAL_MANAGER && (
                      <>
                        <span className="text-green-600 dark:text-green-400">✓ Gestion commerciaux</span>
                        <span className="text-green-600 dark:text-green-400">✓ Voir commissions</span>
                        <span className="text-green-600 dark:text-green-400">✓ Traiter paiements</span>
                        <span className="text-green-600 dark:text-green-400">✓ Voir analyses</span>
                        <span className="text-green-600 dark:text-green-400">✓ Créer admins</span>
                        <span className="text-green-600 dark:text-green-400">✓ Toutes les données</span>
                      </>
                    )}
                    {formData.role === USER_ROLES.SALES_MANAGER && (
                      <>
                        <span className="text-green-600 dark:text-green-400">✓ Gestion commerciaux</span>
                        <span className="text-green-600 dark:text-green-400">✓ Voir commissions</span>
                        <span className="text-green-600 dark:text-green-400">✓ Traiter paiements</span>
                        <span className="text-green-600 dark:text-green-400">✓ Voir analyses</span>
                      </>
                    )}
                    {formData.role === USER_ROLES.TEAM_LEADER && (
                      <>
                        <span className="text-green-600 dark:text-green-400">✓ Modifier commerciaux</span>
                        <span className="text-green-600 dark:text-green-400">✓ Voir commerciaux</span>
                        <span className="text-green-600 dark:text-green-400">✓ Voir commissions</span>
                        <span className="text-green-600 dark:text-green-400">✓ Voir analyses</span>
                      </>
                    )}
                    {formData.role === USER_ROLES.ADMIN && (
                      <>
                        <span className="text-green-600 dark:text-green-400">✓ Voir commerciaux</span>
                        <span className="text-green-600 dark:text-green-400">✓ Voir commissions</span>
                        <span className="text-green-600 dark:text-green-400">✓ Toutes les données</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Les permissions peuvent être modifiées après création dans la section Permissions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || emailChecking}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Créer l'Administrateur</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminModal;
