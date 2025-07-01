import React, { useState, useEffect } from 'react';
import { X, TrendingUp, AlertCircle, CheckCircle, Crown, Shield, Target, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { promotionService } from '../../services/promotion.service';
import { authService } from '../../services/auth.service';

const PromoteSalesPersonModal = ({ salesPerson, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const [formData, setFormData] = useState({
    newRole: '',
    territory: salesPerson?.territory || '',
    teamName: salesPerson?.teamName || '',
    managedBy: '',
    reason: '',
    grantPermissions: {}
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Details, 3: Permissions, 4: Confirmation

  useEffect(() => {
    loadAvailableAdmins();
  }, []);

  useEffect(() => {
    if (formData.newRole) {
      // Set default permissions based on role
      const defaultPermissions = getDefaultPermissionsByRole(formData.newRole);
      setFormData(prev => ({
        ...prev,
        grantPermissions: defaultPermissions
      }));
    }
  }, [formData.newRole]);

  const loadAvailableAdmins = async () => {
    try {
      const response = await authService.getAllAdmins();
      if (response.success) {
        // Filter admins who can be managers (same level or higher)
        const eligibleManagers = response.admins.filter(admin => 
          admin.isActive && !admin.isSuspended
        );
        setAvailableAdmins(eligibleManagers);
      }
    } catch (error) {
      console.error('Error loading available admins:', error);
    }
  };

  const getAvailableAdminRoles = () => {
    // Available admin roles for sales person promotion
    const roles = [
      {
        value: 'admin',
        label: 'Administrateur',
        description: 'Accès de base aux fonctionnalités administratives',
        icon: User,
        level: 5,
        available: true
      },
      {
        value: 'team_leader',
        label: 'Chef d\'Équipe',
        description: 'Gestion d\'une équipe de commerciaux',
        icon: Target,
        level: 4,
        available: true
      },
      {
        value: 'sales_manager',
        label: 'Directeur des Ventes',
        description: 'Gestion de plusieurs équipes et territoires',
        icon: Shield,
        level: 3,
        available: user?.role === 'ceo' || ['regional_manager', 'sales_manager'].includes(user?.role)
      },
      {
        value: 'regional_manager',
        label: 'Directeur Régional',
        description: 'Gestion d\'une région complète',
        icon: Crown,
        level: 2,
        available: user?.role === 'ceo'
      }
    ];

    return roles.filter(role => role.available);
  };

  const getDefaultPermissionsByRole = (role) => {
    const permissions = {
      admin: {
        canViewAnalytics: false,
        canViewAllData: false
      },
      team_leader: {
        canCreateSalesPeople: true,
        canEditSalesPeople: true,
        canViewAllSalesPeople: true,
        canViewCommissions: true,
        canViewAnalytics: true
      },
      sales_manager: {
        canCreateSalesPeople: true,
        canEditSalesPeople: true,
        canDeleteSalesPeople: true,
        canViewAllSalesPeople: true,
        canViewCommissions: true,
        canProcessPayouts: true,
        canCreateAdmins: true,
        canEditAdmins: true,
        canViewAnalytics: true,
        canViewAllData: true
      },
      regional_manager: {
        canCreateSalesPeople: true,
        canEditSalesPeople: true,
        canDeleteSalesPeople: true,
        canViewAllSalesPeople: true,
        canViewCommissions: true,
        canSetCommissionRates: true,
        canProcessPayouts: true,
        canCreateAdmins: true,
        canEditAdmins: true,
        canDeleteAdmins: true,
        canViewAnalytics: true,
        canViewAllData: true,
        canManagePermissions: true
      }
    };

    return permissions[role] || {};
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

  const handlePermissionChange = (permission, granted) => {
    setFormData(prev => ({
      ...prev,
      grantPermissions: {
        ...prev.grantPermissions,
        [permission]: granted
      }
    }));
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.newRole) {
          newErrors.newRole = 'Veuillez sélectionner un rôle';
        }
        break;

      case 2:
        if (!formData.territory.trim()) {
          newErrors.territory = 'Le territoire est requis';
        }
        if (!formData.reason.trim() || formData.reason.trim().length < 10) {
          newErrors.reason = 'Une raison détaillée est requise (minimum 10 caractères)';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      const promotionData = {
        newRole: formData.newRole,
        territory: formData.territory,
        teamName: formData.teamName,
        managedBy: formData.managedBy || undefined,
        reason: formData.reason,
        grantPermissions: formData.grantPermissions
      };

      const response = await promotionService.promoteSalesPersonToAdmin(salesPerson.id, promotionData);

      if (response.success) {
        onSuccess();
      } else {
        setErrors({ submit: response.message || 'Erreur lors de la promotion' });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = getAvailableAdminRoles().find(role => role.value === formData.newRole);
  const grantedPermissionsCount = Object.values(formData.grantPermissions).filter(p => p === true).length;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sélectionnez le nouveau rôle administratif
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choisissez le rôle qui correspond aux responsabilités que vous souhaitez confier à {salesPerson?.name}.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {getAvailableAdminRoles().map((role) => {
                const Icon = role.icon;
                const isSelected = formData.newRole === role.value;
                
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleInputChange('newRole', role.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected 
                          ? 'bg-blue-100 dark:bg-blue-800' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isSelected 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {role.label}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {role.description}
                        </p>
                        {isSelected && (
                          <div className="mt-2 flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              Rôle sélectionné
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {errors.newRole && (
              <p className="text-red-600 text-sm flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.newRole}</span>
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Détails de la promotion
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Définissez les détails du nouveau poste administratif.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Territoire *
                </label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => handleInputChange('territory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ex: Paris, Lyon, Marseille..."
                />
                {errors.territory && (
                  <p className="text-red-600 text-sm mt-1">{errors.territory}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'équipe
                </label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ex: Équipe Commercial Paris"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manager (optionnel)
              </label>
              <select
                value={formData.managedBy}
                onChange={(e) => handleInputChange('managedBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Sélectionner un manager...</option>
                {availableAdmins.map(admin => (
                  <option key={admin._id} value={admin._id}>
                    {admin.firstName} {admin.lastName} ({admin.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Raison de la promotion *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Expliquez pourquoi cette personne mérite cette promotion..."
              />
              {errors.reason && (
                <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Permissions du rôle {selectedRole?.label}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vérifiez et ajustez les permissions qui seront accordées.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Permissions accordées
                </span>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {grantedPermissionsCount} / {Object.keys(formData.grantPermissions).length}
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${Object.keys(formData.grantPermissions).length > 0 
                      ? (grantedPermissionsCount / Object.keys(formData.grantPermissions).length) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(formData.grantPermissions).map(([permission, granted]) => (
                <div 
                  key={permission}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getPermissionLabel(permission)}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getPermissionDescription(permission)}
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={granted}
                      onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Confirmation de la promotion
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vérifiez les détails avant de confirmer la promotion.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Commercial</span>
                  <p className="text-sm text-gray-900 dark:text-white">{salesPerson?.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Commercial</span>
                  <p className="text-sm text-gray-900 dark:text-white">{salesPerson?.salesId}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nouveau rôle</span>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRole?.label}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Territoire</span>
                  <p className="text-sm text-gray-900 dark:text-white">{formData.territory}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Permissions</span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {grantedPermissionsCount} accordées
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Manager</span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formData.managedBy 
                      ? availableAdmins.find(a => a._id === formData.managedBy)?.firstName + ' ' + availableAdmins.find(a => a._id === formData.managedBy)?.lastName
                      : 'Aucun manager assigné'
                    }
                  </p>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Raison</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{formData.reason}</p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Attention
                  </h5>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Cette action va promouvoir {salesPerson?.name} de Commercial vers {selectedRole?.label}. 
                    Le compte commercial sera archivé et un nouveau compte administrateur sera créé.
                  </p>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-700 dark:text-red-300">{errors.submit}</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getPermissionLabel = (permission) => {
    const labels = {
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
      canManagePermissions: 'Gérer les permissions'
    };
    return labels[permission] || permission;
  };

  const getPermissionDescription = (permission) => {
    const descriptions = {
      canCreateSalesPeople: 'Peut ajouter de nouveaux commerciaux à l\'équipe',
      canEditSalesPeople: 'Peut modifier les profils et paramètres des commerciaux',
      canDeleteSalesPeople: 'Peut supprimer des comptes commerciaux',
      canViewAllSalesPeople: 'Peut voir la liste complète des commerciaux',
      canViewCommissions: 'Peut consulter les données de commission',
      canSetCommissionRates: 'Peut définir et modifier les taux de commission',
      canProcessPayouts: 'Peut traiter et valider les paiements de commission',
      canCreateAdmins: 'Peut créer de nouveaux comptes administrateur',
      canEditAdmins: 'Peut modifier les comptes administrateur existants',
      canDeleteAdmins: 'Peut supprimer des comptes administrateur',
      canViewAnalytics: 'Peut accéder aux rapports et analyses',
      canViewAllData: 'Peut voir l\'ensemble des données système',
      canManageSystem: 'Peut modifier les paramètres système',
      canManagePermissions: 'Peut gérer les permissions des autres utilisateurs'
    };
    return descriptions[permission] || '';
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Sélection du rôle';
      case 2: return 'Détails';
      case 3: return 'Permissions';
      case 4: return 'Confirmation';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Promotion vers Administrateur
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {salesPerson?.name} • {getStepTitle()} ({step}/4)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  {stepNumber < step ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 4 && (
                  <div className={`flex-1 h-1 rounded ${
                    stepNumber < step 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="flex space-x-2">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Précédent
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Annuler
            </button>
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={loading || (step === 1 && !formData.newRole)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>Suivant</span>
                <TrendingUp className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Promotion...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmer la Promotion</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoteSalesPersonModal;
