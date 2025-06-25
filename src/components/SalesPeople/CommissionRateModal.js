import React, { useState, useEffect } from 'react';
import { X, Percent, DollarSign, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { permissionService } from '../../services/permission.service';
import { apiHelpers } from '../../services/api';
import Modal from '../Commons/Modal';
import LoadingSpinner from '../Commons/LoadingSpinner';
import { formatFullName } from '../../utils/formatters';

const CommissionRateModal = ({ salesPerson, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    commissionRate: '',
    reason: ''
  });
  const [currentRate, setCurrentRate] = useState(null);

  useEffect(() => {
    // Load current commission rate if available and user has permission
    if (salesPerson && user?.permissions?.canSeeCommissionRates) {
      setCurrentRate(salesPerson.commissionRate || null);
      setFormData(prev => ({
        ...prev,
        commissionRate: salesPerson.commissionRate ? (salesPerson.commissionRate * 100).toFixed(2) : ''
      }));
    }
  }, [salesPerson, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert percentage to decimal (e.g., 25% -> 0.25)
      const rate = parseFloat(formData.commissionRate) / 100;

      // Validate commission rate using service method
      const validation = permissionService.validateCommissionRate(rate);
      if (!validation.isValid) {
        setError(validation.error);
        setLoading(false);
        return;
      }

      // Use permission service to set commission rate
      const response = await permissionService.setCommissionRate(salesPerson._id, rate);

      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Erreur lors de la mise à jour du taux de commission');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du taux:', error);
      setError(apiHelpers.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (error) setError('');
  };

  // Calculate estimated monthly earnings based on average performance
  const calculateEstimatedEarnings = () => {
    const rate = parseFloat(formData.commissionRate) / 100;
    if (!rate || !salesPerson) return 0;

    // Estimate based on current registrations and average commission per user
    const avgCommissionPerUser = 50; // Example: $50 average commission per user
    const monthlyRegistrations = salesPerson.totalRegistrations || 0;
    const estimatedMonthlyEarnings = monthlyRegistrations * avgCommissionPerUser * rate;

    return estimatedMonthlyEarnings;
  };

  const estimatedEarnings = calculateEstimatedEarnings();

  return (
    <Modal onClose={onClose} size="md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Définir le Taux de Commission
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
          {/* Current Rate Display */}
          {currentRate !== null && user?.permissions?.canSeeCommissionRates && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Taux actuel: {permissionService.formatCommissionRate(currentRate)}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Ce commercial gagne actuellement {permissionService.formatCommissionRate(currentRate)} sur chaque commission
                  </p>
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

          {/* Commission Rate Input */}
          <div>
            <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouveau Taux de Commission (%)
            </label>
            <div className="relative">
              <input
                type="number"
                id="commissionRate"
                name="commissionRate"
                value={formData.commissionRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-12"
                placeholder="Ex: 25.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <Percent className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Entrez un pourcentage entre 0% et 100% (ex: 25.00 pour 25%)
            </p>
          </div>

          {/* Estimated Earnings Preview */}
          {formData.commissionRate && estimatedEarnings > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Estimation des gains mensuels: ${estimatedEarnings.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Basé sur la performance actuelle et le nouveau taux de {formData.commissionRate}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Raison du changement (optionnel)
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ex: Augmentation pour performance exceptionnelle..."
            />
          </div>

          {/* Commission Rate Guidelines */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Lignes directrices pour les taux de commission:
            </h4>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>• Commercial débutant:</span>
                <span className="font-medium">15% - 20%</span>
              </div>
              <div className="flex justify-between">
                <span>• Commercial expérimenté:</span>
                <span className="font-medium">20% - 30%</span>
              </div>
              <div className="flex justify-between">
                <span>• Top performer:</span>
                <span className="font-medium">30% - 40%</span>
              </div>
              <div className="flex justify-between">
                <span>• Manager commercial:</span>
                <span className="font-medium">35% - 50%</span>
              </div>
            </div>
          </div>

          {/* Performance Context */}
          {salesPerson && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Performance actuelle:
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Total inscriptions:</span>
                  <span className="font-medium ml-2">{salesPerson.totalRegistrations || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Inscriptions payées:</span>
                  <span className="font-medium ml-2">{salesPerson.totalPaidRegistrations || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Territoire:</span>
                  <span className="font-medium ml-2">{salesPerson.territory}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Statut:</span>
                  <span className={`font-medium ml-2 ${salesPerson.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {salesPerson.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
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
              disabled={loading || !formData.commissionRate}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{loading ? 'Mise à jour...' : 'Définir le Taux'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CommissionRateModal;
