import React, { useState, useEffect } from 'react';
import { X, Target, TrendingUp, Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesService } from '../../services/sales.service';
import { apiHelpers } from '../../services/api';
import Modal from '../Commons/Modal';
import LoadingSpinner from '../Commons/LoadingSpinner';
import { formatFullName } from '../../utils/formatters';

const SetTargetsModal = ({ salesPerson, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    targets: {
      weeklyRegistrations: '',
      monthlyRegistrations: '',
      weeklyEarnings: '',
      monthlyEarnings: ''
    },
    reason: '',
    settings: {
      allowExceedingTargets: true,
      notifyOnTargetMet: true,
      resetTargetsMonthly: false,
      autoSetNextMonthTargets: false
    }
  });
  const [currentTargets, setCurrentTargets] = useState(null);
  const [targetHistory, setTargetHistory] = useState([]);

  useEffect(() => {
    // Load current targets
    if (salesPerson?.currentTargets) {
      setCurrentTargets(salesPerson.currentTargets);
      setFormData(prev => ({
        ...prev,
        targets: {
          weeklyRegistrations: salesPerson.currentTargets.weeklyRegistrations?.toString() || '',
          monthlyRegistrations: salesPerson.currentTargets.monthlyRegistrations?.toString() || '',
          weeklyEarnings: salesPerson.currentTargets.weeklyEarnings?.toString() || '',
          monthlyEarnings: salesPerson.currentTargets.monthlyEarnings?.toString() || ''
        },
        settings: {
          allowExceedingTargets: salesPerson.targetSettings?.allowExceedingTargets !== false,
          notifyOnTargetMet: salesPerson.targetSettings?.notifyOnTargetMet !== false,
          resetTargetsMonthly: salesPerson.targetSettings?.resetTargetsMonthly === true,
          autoSetNextMonthTargets: salesPerson.targetSettings?.autoSetNextMonthTargets === true
        }
      }));
    }

    // Load target history
    loadTargetHistory();
  }, [salesPerson]);

  const loadTargetHistory = async () => {
    try {
      const response = await salesService.getTargetsHistory(salesPerson._id);
      if (response.success) {
        setTargetHistory(response.targetHistory || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors({});

    try {
      // Convert string values to numbers
      const targets = {
        weeklyRegistrations: formData.targets.weeklyRegistrations ? parseInt(formData.targets.weeklyRegistrations) : 0,
        monthlyRegistrations: formData.targets.monthlyRegistrations ? parseInt(formData.targets.monthlyRegistrations) : 0,
        weeklyEarnings: formData.targets.weeklyEarnings ? parseFloat(formData.targets.weeklyEarnings) : 0,
        monthlyEarnings: formData.targets.monthlyEarnings ? parseFloat(formData.targets.monthlyEarnings) : 0
      };

      // Validate targets using service method
      const validation = salesService.validateTargets(targets);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setLoading(false);
        return;
      }

      // Submit targets with settings and reason
      const response = await salesService.setSalesTargets(
        salesPerson._id,
        {
          ...targets,
          settings: formData.settings
        },
        formData.reason || 'Mise à jour des objectifs'
      );

      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Erreur lors de la mise à jour des objectifs');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des objectifs:', error);
      setError(apiHelpers.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      targets: {
        ...prev.targets,
        [field]: value
      }
    }));

    // Clear specific field error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Clear general error
    if (error) setError('');
  };

  const handleSettingChange = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleReasonChange = (value) => {
    setFormData(prev => ({
      ...prev,
      reason: value
    }));
  };

  // Calculate target achievement based on current performance
  const calculateTargetAchievement = (target, actual) => {
    if (!target || target === 0) return 0;
    return Math.round((actual / target) * 100);
  };

  // Get current performance for comparison
  const currentPerformance = {
    weeklyRegistrations: 0, // Would come from real data
    monthlyRegistrations: salesPerson?.totalRegistrations || 0,
    weeklyEarnings: 0,
    monthlyEarnings: salesPerson?.totalEarnings || 0
  };

  return (
    <Modal onClose={onClose} size="lg">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Définir les Objectifs
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatFullName(salesPerson?.firstName, salesPerson?.lastName)} ({salesPerson?.salesId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Targets Display */}
          {currentTargets && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Objectifs actuels
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Hebdomadaire (inscriptions):</span>
                  <span className="font-medium ml-2">{currentTargets.weeklyRegistrations || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Mensuel (inscriptions):</span>
                  <span className="font-medium ml-2">{currentTargets.monthlyRegistrations || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Hebdomadaire (revenus):</span>
                  <span className="font-medium ml-2">${currentTargets.weeklyEarnings || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Mensuel (revenus):</span>
                  <span className="font-medium ml-2">${currentTargets.monthlyEarnings || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Targets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registration Targets */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Objectifs d'Inscriptions</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objectif Hebdomadaire (inscriptions)
                </label>
                <input
                  type="number"
                  value={formData.targets.weeklyRegistrations}
                  onChange={(e) => handleTargetChange('weeklyRegistrations', e.target.value)}
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.weeklyRegistrations 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ex: 5"
                />
                {errors.weeklyRegistrations && (
                  <p className="text-xs text-red-600 mt-1">{errors.weeklyRegistrations}</p>
                )}
                {currentTargets?.weeklyRegistrations && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actuel: {currentTargets.weeklyRegistrations} | Performance: {calculateTargetAchievement(currentTargets.weeklyRegistrations, currentPerformance.weeklyRegistrations)}%
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objectif Mensuel (inscriptions)
                </label>
                <input
                  type="number"
                  value={formData.targets.monthlyRegistrations}
                  onChange={(e) => handleTargetChange('monthlyRegistrations', e.target.value)}
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.monthlyRegistrations 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ex: 20"
                />
                {errors.monthlyRegistrations && (
                  <p className="text-xs text-red-600 mt-1">{errors.monthlyRegistrations}</p>
                )}
                {currentTargets?.monthlyRegistrations && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actuel: {currentTargets.monthlyRegistrations} | Performance: {calculateTargetAchievement(currentTargets.monthlyRegistrations, currentPerformance.monthlyRegistrations)}%
                  </p>
                )}
              </div>
            </div>

            {/* Earnings Targets */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Objectifs de Revenus</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objectif Hebdomadaire (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.targets.weeklyEarnings}
                  onChange={(e) => handleTargetChange('weeklyEarnings', e.target.value)}
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.weeklyEarnings 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ex: 500.00"
                />
                {errors.weeklyEarnings && (
                  <p className="text-xs text-red-600 mt-1">{errors.weeklyEarnings}</p>
                )}
                {currentTargets?.weeklyEarnings && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actuel: ${currentTargets.weeklyEarnings} | Performance: {calculateTargetAchievement(currentTargets.weeklyEarnings, currentPerformance.weeklyEarnings)}%
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objectif Mensuel (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.targets.monthlyEarnings}
                  onChange={(e) => handleTargetChange('monthlyEarnings', e.target.value)}
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.monthlyEarnings 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ex: 2000.00"
                />
                {errors.monthlyEarnings && (
                  <p className="text-xs text-red-600 mt-1">{errors.monthlyEarnings}</p>
                )}
                {currentTargets?.monthlyEarnings && (
                  <p className="text-xs text-gray-500 mt-1">
                    Actuel: ${currentTargets.monthlyEarnings} | Performance: {calculateTargetAchievement(currentTargets.monthlyEarnings, currentPerformance.monthlyEarnings)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Target Settings */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span>Paramètres des Objectifs</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Autoriser le dépassement
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Permettre de continuer après l'objectif atteint
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.settings.allowExceedingTargets}
                  onChange={(e) => handleSettingChange('allowExceedingTargets', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notifier à l'atteinte
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Envoyer une notification quand l'objectif est atteint
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.settings.notifyOnTargetMet}
                  onChange={(e) => handleSettingChange('notifyOnTargetMet', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Réinitialisation mensuelle
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Remettre à zéro les objectifs chaque mois
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.settings.resetTargetsMonthly}
                  onChange={(e) => handleSettingChange('resetTargetsMonthly', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Objectifs automatiques
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Définir automatiquement les objectifs du mois suivant
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.settings.autoSetNextMonthTargets}
                  onChange={(e) => handleSettingChange('autoSetNextMonthTargets', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Raison du changement
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: Augmentation des objectifs suite à une amélioration des performances..."
            />
          </div>

          {/* Target Recommendations */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 dark:text-green-200 mb-2 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Recommandations d'objectifs</span>
            </h4>
            <div className="space-y-2 text-xs text-green-800 dark:text-green-300">
              <div className="flex justify-between">
                <span>• Commercial débutant (mensuel):</span>
                <span className="font-medium">10-15 inscriptions</span>
              </div>
              <div className="flex justify-between">
                <span>• Commercial expérimenté (mensuel):</span>
                <span className="font-medium">20-30 inscriptions</span>
              </div>
              <div className="flex justify-between">
                <span>• Top performer (mensuel):</span>
                <span className="font-medium">35+ inscriptions</span>
              </div>
              <div className="flex justify-between">
                <span>• Revenus recommandés:</span>
                <span className="font-medium">$1000-$3000/mois</span>
              </div>
            </div>
          </div>

          {/* Target History */}
          {targetHistory.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Historique des objectifs (5 derniers)
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {targetHistory.slice(0, 5).map((history, index) => (
                  <div key={index} className="text-xs bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          Mensuel: {history.targets?.monthlyRegistrations || 0} inscriptions, 
                          ${history.targets?.monthlyEarnings || 0}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                          {history.reason || 'Aucune raison spécifiée'}
                        </p>
                      </div>
                      <span className="text-gray-400">
                        {new Date(history.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{loading ? 'Mise à jour...' : 'Définir les Objectifs'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SetTargetsModal;
