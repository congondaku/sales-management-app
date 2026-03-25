import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, Mail, MapPin, Building, Shield, Star } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { formatFullName } from '../../utils/formatters';
import { ROLE_LABELS, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const EditAdminModal = ({ admin, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    territory: '',
    teamName: '',
    managedBy: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableManagers, setAvailableManagers] = useState([]);

  // Check if user has full access (CEO or Super Admin)
  const hasFullAccess = user?.role === 'ceo' || user?.role === 'super_admin';
  // Check if editing self
  const isEditingSelf = admin?._id === user?._id;
  // Check if editing a Super Admin
  const isEditingSuperAdmin = admin?.role === 'super_admin';

  useEffect(() => {
    if (admin) {
      setFormData({
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        email: admin.email || '',
        role: admin.role || '',
        territory: admin.territory || '',
        teamName: admin.teamName || '',
        managedBy: admin.managedBy?._id || ''
      });
      loadAvailableManagers();
    }
  }, [admin]);

  const loadAvailableManagers = async () => {
    try {
      const response = await authService.getAllAdmins();
      if (response.success) {
        // Filter out the current admin and those at the same or lower level
        const managers = response.admins.filter(a => 
          a._id !== admin._id && 
          a.isActive && 
          !a.isSuspended
        );
        setAvailableManagers(managers);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

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

    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        territory: formData.territory.trim() || undefined,
        teamName: formData.teamName.trim() || undefined,
        managedBy: formData.managedBy || undefined
      };

      const response = await authService.updateAdmin(admin._id, updateData);
      
      if (response.success) {
        onSuccess();
      } else {
        setErrors({ submit: response.message || 'Erreur lors de la modification' });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Erreur lors de la modification' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const getRoleLevel = (role) => {
    const levels = {
      'ceo': 1,
      'super_admin': 1,
      'regional_manager': 2,
      'sales_manager': 3,
      'team_leader': 4,
      'admin': 5
    };
    return levels[role] || 5;
  };

  // Filter available roles based on current user permissions
  const getAvailableRoles = () => {
    const allRoles = Object.entries(ROLE_LABELS);
    
    return allRoles.filter(([role]) => {
      // Can't change CEO role unless user is CEO and not editing self
      if (admin.role === 'ceo' && !hasFullAccess) return false;
      if (admin.role === 'ceo' && role !== 'ceo') return false;
      
      // Super Admin can only be modified by full access users
      if (isEditingSuperAdmin && !hasFullAccess) return false;
      
      // Regular users can't promote to Super Admin
      if (role === 'super_admin' && !hasFullAccess) return false;
      
      return true;
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'ceo': 'bg-yellow-100 text-yellow-800',
      'super_admin': 'bg-purple-100 text-purple-800',
      'regional_manager': 'bg-purple-100 text-purple-800',
      'sales_manager': 'bg-blue-100 text-blue-800',
      'team_leader': 'bg-green-100 text-green-800',
      'admin': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.admin;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isEditingSuperAdmin 
                  ? 'bg-purple-100 dark:bg-purple-900/20' 
                  : 'bg-blue-100 dark:bg-blue-900/20'
              }`}>
                {isEditingSuperAdmin ? (
                  <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Modifier Administrateur
                  </h3>
                  {isEditingSuperAdmin && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                      <Star className="h-3 w-3 mr-1" />
                      Super Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFullName(admin?.firstName, admin?.lastName)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          
          {/* Personal Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Informations personnelles
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.firstName 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Prénom"
                  disabled={loading}
                />
                {errors.firstName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.lastName 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Nom"
                  disabled={loading}
                />
                {errors.lastName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.email 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="email@example.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Role and Hierarchy */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Rôle et hiérarchie
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.role 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading || (isEditingSuperAdmin && !hasFullAccess)}
                >
                  <option value="">Sélectionner un rôle</option>
                  {getAvailableRoles().map(([role, label]) => (
                    <option key={role} value={role}>
                      {label} {role === 'super_admin' && '⭐'}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.role}
                  </p>
                )}
                {formData.role === 'super_admin' && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    ⭐ Super Admin - Accès complet à toutes les fonctionnalités (même niveau que PDG)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manager
                </label>
                <select
                  value={formData.managedBy}
                  onChange={(e) => handleInputChange('managedBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={loading || formData.role === 'super_admin' || formData.role === 'ceo'}
                >
                  <option value="">Aucun manager (niveau supérieur)</option>
                  {availableManagers.map(manager => (
                    <option key={manager._id} value={manager._id}>
                      {formatFullName(manager.firstName, manager.lastName)} 
                      ({manager.role === 'super_admin' ? 'Super Admin' : (ROLE_LABELS[manager.role] || manager.role)})
                      {manager.role === 'super_admin' && ' ⭐'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(formData.role === 'super_admin' || formData.role === 'ceo') 
                    ? 'Les Super Admins et PDG n\'ont pas de manager' 
                    : 'Définit qui supervise cet administrateur dans la hiérarchie'}
                </p>
              </div>
            </div>
          </div>

          {/* Location and Team */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Localisation et équipe
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Territoire
                </label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => handleInputChange('territory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Paris, Lyon, Marseille..."
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Zone géographique de responsabilité
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  Nom de l'équipe
                </label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Équipe Commercial Paris"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Nom de l'équipe ou du département
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-700 dark:text-red-300">{errors.submit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || Object.keys(errors).length > 0}
            className={`px-6 py-2 ${
              isEditingSuperAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-lg disabled:opacity-50 flex items-center space-x-2 transition-colors`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Modification...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAdminModal;
