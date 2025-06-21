import React, { useState } from 'react';
import { FormModal } from '../Commons/Modal';
import { useAuth } from '../../hooks/useAuth';
import { salesService } from '../../services/sales.service';
import { validateSalesPersonForm } from '../../utils/validators';

const EditSalesPersonModal = ({ salesPerson, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: salesPerson.firstName || '',
    lastName: salesPerson.lastName || '',
    email: salesPerson.email || '',
    phoneNumber: salesPerson.phoneNumber || '',
    territory: salesPerson.territory || '',
    teamName: salesPerson.teamName || '',
    region: salesPerson.region || '',
    isActive: salesPerson.isActive !== false,
    targets: {
      weeklyRegistrations: salesPerson.currentTargets?.weeklyRegistrations || 0,
      monthlyRegistrations: salesPerson.currentTargets?.monthlyRegistrations || 0,
      weeklyEarnings: salesPerson.currentTargets?.weeklyEarnings || 0,
      monthlyEarnings: salesPerson.currentTargets?.monthlyEarnings || 0
    },
    targetSettings: {
      allowExceedingTargets: salesPerson.targetSettings?.allowExceedingTargets !== false,
      notifyOnTargetMet: salesPerson.targetSettings?.notifyOnTargetMet !== false,
      resetTargetsMonthly: salesPerson.targetSettings?.resetTargetsMonthly || false,
      autoSetNextMonthTargets: salesPerson.targetSettings?.autoSetNextMonthTargets || false
    },
    managerNotes: salesPerson.managerNotes || ''
  });

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Nettoyer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Validation côté client (sans le mot de passe pour l'édition)
      const { password, ...validationData } = formData;
      const validation = validateSalesPersonForm(validationData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setLoading(false);
        return;
      }

      // Appel à l'API de mise à jour
      const response = await salesService.updateSalesPerson(salesPerson._id, formData);
      
      if (response.success) {
        onSuccess();
      } else {
        if (response.validationErrors) {
          setErrors(response.validationErrors);
        } else {
          setErrors({ general: [response.message || 'Erreur lors de la mise à jour'] });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setErrors({ general: ['Erreur de connexion au serveur'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Modifier ${formData.firstName} ${formData.lastName}`}
      submitText="Mettre à jour"
      cancelText="Annuler"
      loading={loading}
      size="4xl"
    >
      <div className="space-y-6">
        
        {/* Erreur générale */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {errors.general[0]}
          </div>
        )}

        {/* Informations personnelles */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Informations Personnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.firstName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Prénom"
                disabled={loading}
              />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">{errors.firstName[0]}</p>
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.lastName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Nom"
                disabled={loading}
              />
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1">{errors.lastName[0]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="email@exemple.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.phoneNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="+33 1 23 45 67 89"
                disabled={loading}
              />
              {errors.phoneNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.phoneNumber[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Statut */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Statut
          </h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Commercial actif
            </span>
          </label>
        </div>

        {/* Assignation territoriale */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Assignation Territoriale
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Territoire *
              </label>
              <input
                type="text"
                value={formData.territory}
                onChange={(e) => handleInputChange('territory', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.territory ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Paris, Lyon, Marseille"
                disabled={loading}
              />
              {errors.territory && (
                <p className="text-red-600 text-sm mt-1">{errors.territory[0]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Équipe
              </label>
              <input
                type="text"
                value={formData.teamName}
                onChange={(e) => handleInputChange('teamName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Nom de l'équipe"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Région
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Région géographique"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Objectifs de performance */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Objectifs de Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inscriptions/Semaine
              </label>
              <input
                type="number"
                value={formData.targets.weeklyRegistrations}
                onChange={(e) => handleInputChange('targets.weeklyRegistrations', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                placeholder="0"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inscriptions/Mois
              </label>
              <input
                type="number"
                value={formData.targets.monthlyRegistrations}
                onChange={(e) => handleInputChange('targets.monthlyRegistrations', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                placeholder="0"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gains/Semaine ($)
              </label>
              <input
                type="number"
                value={formData.targets.weeklyEarnings}
                onChange={(e) => handleInputChange('targets.weeklyEarnings', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gains/Mois ($)
              </label>
              <input
                type="number"
                value={formData.targets.monthlyEarnings}
                onChange={(e) => handleInputChange('targets.monthlyEarnings', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          </div>
          
          {errors.targets && (
            <p className="text-red-600 text-sm mt-2">{errors.targets[0]}</p>
          )}
        </div>

        {/* Paramètres des objectifs */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Paramètres des Objectifs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.targetSettings.allowExceedingTargets}
                  onChange={(e) => handleInputChange('targetSettings.allowExceedingTargets', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Autoriser le dépassement des objectifs
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.targetSettings.notifyOnTargetMet}
                  onChange={(e) => handleInputChange('targetSettings.notifyOnTargetMet', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Notifier quand l'objectif est atteint
                </span>
              </label>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.targetSettings.resetTargetsMonthly}
                  onChange={(e) => handleInputChange('targetSettings.resetTargetsMonthly', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Réinitialiser les objectifs mensuellement
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.targetSettings.autoSetNextMonthTargets}
                  onChange={(e) => handleInputChange('targetSettings.autoSetNextMonthTargets', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Définir automatiquement les objectifs du mois suivant
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes du manager */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes du Manager
          </label>
          <textarea
            value={formData.managerNotes}
            onChange={(e) => handleInputChange('managerNotes', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Notes optionnelles concernant ce commercial..."
            disabled={loading}
          />
        </div>

        {/* Informations de performance actuelles */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Performance Actuelle
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total inscriptions</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {salesPerson.totalRegistrations || 0}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Inscriptions payées</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {salesPerson.totalPaidRegistrations || 0}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Commissions totales</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {salesPerson.totalCommissions || 0}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Dernière activité</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {salesPerson.lastActivity 
                  ? new Date(salesPerson.lastActivity).toLocaleDateString('fr-FR')
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  );
};

export default EditSalesPersonModal;
