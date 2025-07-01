import React, { useState, useEffect } from 'react';
import { X, TrendingDown, AlertCircle, CheckCircle, Crown, Shield, Users, Target, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { promotionService } from '../../services/promotion.service';
import { authService } from '../../services/auth.service';

const DemoteAdminModal = ({ admin, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const [formData, setFormData] = useState({
    newRole: '',
    demoteToSalesPerson: false,
    territory: admin?.territory || '',
    teamName: admin?.teamName || '',
    managedBy: '',
    reason: '',
    salesPersonData: {
      phoneNumber: '',
      commissionRate: 0.25
    }
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Demotion Type, 2: Details, 3: Confirmation

  useEffect(() => {
    loadAvailableAdmins();
    if (admin) {
      setFormData(prev => ({
        ...prev,
        territory: admin.territory || '',
        teamName: admin.teamName || ''
      }));
    }
  }, [admin]);

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

  const getDemotionOptions = () => {
    if (!admin) return [];
    
    const demotionOptions = promotionService.getDemotionOptions(admin.role);
    const roleLabels = {
      'sales_manager': 'Directeur des Ventes',
      'team_leader': 'Chef d\'Équipe',
      'admin': 'Administrateur',
      'sales_person': 'Commercial'
    };

    const options = demotionOptions.map(role => ({
      value: role,
      label: roleLabels[role] || role,
      description: getRoleDescription(role),
      icon: getRoleIcon(role),
      level: promotionService.getRoleLevel(role),
      isSalesPerson: role === 'sales_person'
    }));

    return options;
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      'sales_manager': 'Gestion de plusieurs équipes et territoires',
      'team_leader': 'Gestion d\'une équipe de commerciaux',
      'admin': 'Accès de base aux fonctionnalités administratives',
      'sales_person': 'Retour au terrain commercial avec objectifs de vente'
    };
    return descriptions[role] || '';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'sales_manager':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'team_leader':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'admin':
        return <Users className="w-5 h-5 text-gray-500" />;
      case 'sales_person':
        return <User className="w-5 h-5 text-purple-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'newRole') {
      const isSalesPerson = value === 'sales_person';
      setFormData(prev => ({
        ...prev,
        [field]: value,
        demoteToSalesPerson: isSalesPerson
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSalesPersonDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      salesPersonData: {
        ...prev.salesPersonData,
        [field]: value
      }
    }));

    if (errors[`salesPersonData.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`salesPersonData.${field}`]: ''
      }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.newRole) {
          newErrors.newRole = 'Veuillez sélectionner le type de rétrogradation';
        }
        break;

      case 2:
        if (!formData.reason.trim() || formData.reason.trim().length < 10) {
          newErrors.reason = 'Une raison détaillée est requise (minimum 10 caractères)';
        }

        if (formData.demoteToSalesPerson) {
          if (!formData.territory.trim()) {
            newErrors.territory = 'Le territoire est requis pour la rétrogradation vers commercial';
          }
          if (!formData.salesPersonData.phoneNumber.trim()) {
            newErrors['salesPersonData.phoneNumber'] = 'Le numéro de téléphone est requis';
          }
          if (formData.salesPersonData.commissionRate < 0 || formData.salesPersonData.commissionRate > 1) {
            newErrors['salesPersonData.commissionRate'] = 'Le taux de commission doit être entre 0 et 1';
          }
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
      const demotionData = {
        newRole: formData.demoteToSalesPerson ? undefined : formData.newRole,
        demoteToSalesPerson: formData.demoteToSalesPerson,
        territory: formData.territory,
        teamName: formData.teamName,
        managedBy: formData.managedBy || undefined,
        reason: formData.reason,
        salesPersonData: formData.demoteToSalesPerson ? formData.salesPersonData : undefined
      };

      const response = await promotionService.demoteAdmin(admin._id, demotionData);

      if (response.success) {
        onSuccess();
      } else {
        setErrors({ submit: response.message || 'Erreur lors de la rétrogradation' });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const demotionOptions = getDemotionOptions();
  const selectedOption = demotionOptions.find(option => option.value === formData.newRole);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sélectionnez le type de rétrogradation
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rétrogradation de {admin?.firstName} {admin?.lastName} vers un rôle inférieur.
            </p>

            {demotionOptions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Aucune rétrogradation disponible pour ce rôle
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {demotionOptions.map((option) => {
                  const isSelected = formData.newRole === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('newRole', option.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected 
                            ? 'bg-orange-100 dark:bg-orange-800' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {option.description}
                          </p>
                          {option.isSalesPerson && (
                            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                              ⚠️ Rétrogradation vers commercial - nécessite des informations supplémentaires
                            </div>
                          )}
                          {isSelected && (
                            <div className="mt-2 flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-orange-600 dark:text-orange-400">
                                Option sélectionnée
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
                Détails de la rétrogradation
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configuration pour la rétrogradation vers {selectedOption?.label}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Territoire {formData.demoteToSalesPerson && '*'}
                </label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => handleInputChange('territory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ex: Équipe Commercial Paris"
                />
              </div>
            </div>

            {!formData.demoteToSalesPerson && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nouveau manager
                </label>
                <select
                  value={formData.managedBy}
                  onChange={(e) => handleInputChange('managedBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionner un manager...</option>
                  {availableAdmins.map(availableAdmin => (
                    <option key={availableAdmin._id} value={availableAdmin._id}>
                      {availableAdmin.firstName} {availableAdmin.lastName} ({availableAdmin.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.demoteToSalesPerson && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <h5 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-3">
                  Informations commerciales
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                      Numéro de téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.salesPersonData.phoneNumber}
                      onChange={(e) => handleSalesPersonDataChange('phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-orange-600 dark:text-white"
                      placeholder="+33 1 23 45 67 89"
                    />
                    {errors['salesPersonData.phoneNumber'] && (
                      <p className="text-red-600 text-sm mt-1">{errors['salesPersonData.phoneNumber']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                      Taux de commission
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.salesPersonData.commissionRate}
                      onChange={(e) => handleSalesPersonDataChange('commissionRate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-orange-600 dark:text-white"
                      placeholder="0.25"
                    />
                    {errors['salesPersonData.commissionRate'] && (
                      <p className="text-red-600 text-sm mt-1">{errors['salesPersonData.commissionRate']}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Raison de la rétrogradation *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Expliquez les raisons de cette rétrogradation..."
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
                Confirmation de la rétrogradation
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vérifiez les détails avant de confirmer la rétrogradation.
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
                  <p className="text-sm text-gray-900 dark:text-white">{selectedOption?.label}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Territoire</span>
                  <p className="text-sm text-gray-900 dark:text-white">{formData.territory}</p>
                </div>
              </div>

              {formData.demoteToSalesPerson && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Informations commerciales</span>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-400">Téléphone</span>
                      <p className="text-sm text-gray-900 dark:text-white">{formData.salesPersonData.phoneNumber}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Commission</span>
                      <p className="text-sm text-gray-900 dark:text-white">{(formData.salesPersonData.commissionRate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Raison</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{formData.reason}</p>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Rétrogradation vers {selectedOption?.label}
                  </h5>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    {formData.demoteToSalesPerson 
                      ? 'L\'administrateur perdra ses accès administratifs et deviendra commercial avec un nouveau compte.'
                      : 'L\'administrateur conservera ses accès administratifs mais avec des responsabilités réduites.'
                    }
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
      case 1: return 'Type de rétrogradation';
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
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Rétrogradation d'Administrateur
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
                    ? 'bg-orange-600 text-white' 
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
                      ? 'bg-orange-600' 
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
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>Suivant</span>
                <TrendingDown className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Rétrogradation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmer la Rétrogradation</span>
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

export default DemoteAdminModal;
