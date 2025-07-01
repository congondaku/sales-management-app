import React, { useState, useEffect } from 'react';
import { X, TrendingUp, AlertCircle, CheckCircle, Crown, Shield, Users, Target } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { promotionService } from '../../services/promotion.service';
import { authService } from '../../services/auth.service';

const PromoteAdminModal = ({ admin, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const [formData, setFormData] = useState({
    newRole: '',
    territory: admin?.territory || '',
    teamName: admin?.teamName || '',
    managedBy: admin?.managedBy?._id || '',
    reason: '',
    grantPermissions: {}
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Details, 3: Confirmation

  useEffect(() => {
    loadAvailableAdmins();
    if (admin) {
      setFormData(prev => ({
        ...prev,
        territory: admin.territory || '',
        teamName: admin.teamName || '',
        managedBy: admin.managedBy?._id || ''
      }));
    }
  }, [admin]);

  useEffect(() => {
    if (formData.newRole) {
      // Set default permissions based on new role
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
        // Filter admins who can be managers
        const eligibleManagers = response.admins.filter(a => 
          a._id !== admin?._id && 
          a.isActive && 
          !a.isSuspended
        );
        setAvailableAdmins(eligibleManagers);
      }
    } catch (error) {
      console.error('Error loading available admins:', error);
    }
  };

  const getAvailableRoles = () => {
    if (!admin) return [];
    
    const promotionOptions = promotionService.getPromotionOptions(admin.role, user?.role);
    const roleLabels = {
      'team_leader': 'Chef d\'Équipe',
      'sales_manager': 'Directeur des Ventes',
      'regional_manager': 'Directeur Régional',
      'ceo': 'PDG'
    };

    return promotionOptions.map(role => ({
      value: role,
      label: roleLabels[role] || role,
      description: getRoleDescription(role),
      icon: getRoleIcon(role),
      level: promotionService.getRoleLevel(role)
    }));
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      'team_leader': 'Gestion d\'une équipe de commerciaux',
      'sales_manager': 'Gestion de plusieurs équipes et territoires',
      'regional_manager': 'Gestion d\'une région complète',
      'ceo': 'Direction générale de l\'entreprise'
    };
    return descriptions[role] || '';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ceo':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'regional_manager':
      case 'sales_manager':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'team_leader':
        return <Target className="w-5 h-5 text-green-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDefaultPermissionsByRole = (role) => {
    const permissions = {
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
      },
      ceo: {
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
        canManageSystem: true,
        canManagePermissions: true,
        canSeeCommissionRates: true
      }
    };

    return permissions[role] || {};
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.newRole) {
          newErrors.newRole = 'Veuillez sélectionner un nouveau rôle';
        }
        break;

      case 2:
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

      const response = await promotionService.promoteAdmin(admin._id, promotionData);

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

  const availableRoles = getAvailableRoles();
  const selectedRole = availableRoles.find(role => role.value === formData.newRole);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sélectionnez le nouveau rôle
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Promotion de {admin?.firstName} {admin?.lastName} vers un rôle supérieur.
            </p>

            {availableRoles.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Aucune promotion disponible pour ce rôle
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {availableRoles.map((role) => {
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
                          {role.icon}
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
            )}

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
                Finaliser les détails pour la promotion vers {selectedRole?.label}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Territoire
                </label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => handleInputChange('territory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ex: Paris, Lyon, Marseille..."
                />
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
                {availableAdmins.map(availableAdmin => (
                  <option key={availableAdmin._id} value={availableAdmin._id}>
                    {availableAdmin.firstName} {availableAdmin.lastName} ({availableAdmin.role})
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
                Confirmation de la promotion
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vérifiez les détails avant de confirmer la promotion.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Administrateur</span>
                  <p className="text-sm text-gray-900 dark:text-white">{admin?.firstName} {admin?.lastName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rôle actuel</span>
                  <p className="text-sm text-gray-900 dark:text-white">{promotionService.getRoleDisplayName(admin?.role)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nouveau rôle</span>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedRole?.label}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Territoire</span>
                  <p className="text-sm text-gray-900 dark:text-white">{formData.territory || 'Non modifié'}</p>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Raison</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{formData.reason}</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Promotion vers {selectedRole?.label}
                  </h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    L'administrateur recevra de nouvelles permissions et responsabilités correspondant à son nouveau rôle.
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

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Sélection du rôle';
      case 2: return 'Détails';
      case 3: return 'Confirmation';
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
                  Promotion d'Administrateur
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {admin?.firstName} {admin?.lastName} • {getStepTitle()} ({step}/3)
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
            {[1, 2, 3].map((stepNumber) => (
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
                {stepNumber < 3 && (
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
            
            {step < 3 ? (
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

export default PromoteAdminModal;
