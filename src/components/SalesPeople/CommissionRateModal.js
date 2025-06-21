import React, { useState, useEffect } from 'react';
import { X, Percent, DollarSign, TrendingUp, AlertTriangle, Save, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesService } from '../../services/sales.service';
import { formatFullName } from '../../utils/formatters';

const CommissionRateModal = ({ salesPerson, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [commissionHistory, setCommissionHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    baseRate: salesPerson?.commissionRate?.base || 0,
    paidRate: salesPerson?.commissionRate?.paid || 0,
    bonusThreshold: salesPerson?.commissionRate?.bonusThreshold || 0,
    bonusRate: salesPerson?.commissionRate?.bonusRate || 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [errors, setErrors] = useState({});
  const [previewCalculation, setPreviewCalculation] = useState(null);

  useEffect(() => {
    loadCommissionHistory();
    calculatePreview();
  }, []);

  useEffect(() => {
    calculatePreview();
  }, [formData.baseRate, formData.paidRate, formData.bonusThreshold, formData.bonusRate]);

  const loadCommissionHistory = async () => {
    try {
      const response = await salesService.getCommissionHistory(salesPerson._id);
      if (response.success) {
        setCommissionHistory(response.history || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const calculatePreview = () => {
    // Simulation basée sur les données du commercial
    const monthlyRegistrations = salesPerson.totalRegistrations || 10;
    const monthlyPaidRegistrations = salesPerson.totalPaidRegistrations || 8;
    const avgRegistrationValue = 150; // Valeur moyenne d'inscription

    const baseCommission = monthlyRegistrations * avgRegistrationValue * (formData.baseRate / 100);
    const paidCommission = monthlyPaidRegistrations * avgRegistrationValue * (formData.paidRate / 100);
    
    let bonusCommission = 0;
    if (formData.bonusThreshold > 0 && monthlyRegistrations >= formData.bonusThreshold) {
      const excessRegistrations = monthlyRegistrations - formData.bonusThreshold;
      bonusCommission = excessRegistrations * avgRegistrationValue * (formData.bonusRate / 100);
    }

    const totalCommission = baseCommission + paidCommission + bonusCommission;

    setPreviewCalculation({
      baseCommission,
      paidCommission,
      bonusCommission,
      totalCommission,
      monthlyRegistrations,
      monthlyPaidRegistrations,
      avgRegistrationValue
    });
  };

  const handleInputChange = (field, value) => {
    // Convertir en nombre pour les champs numériques
    const numericFields = ['baseRate', 'paidRate', 'bonusThreshold', 'bonusRate'];
    const finalValue = numericFields.includes(field) ? parseFloat(value) || 0 : value;

    setFormData(prev => ({
      ...prev,
      [field]: finalValue
    }));

    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.baseRate < 0 || formData.baseRate > 100) {
      newErrors.baseRate = 'Le taux de base doit être entre 0 et 100%';
    }

    if (formData.paidRate < 0 || formData.paidRate > 100) {
      newErrors.paidRate = 'Le taux pour les inscriptions payées doit être entre 0 et 100%';
    }

    if (formData.bonusRate < 0 || formData.bonusRate > 100) {
      newErrors.bonusRate = 'Le taux de bonus doit être entre 0 et 100%';
    }

    if (formData.bonusThreshold < 0) {
      newErrors.bonusThreshold = 'Le seuil de bonus ne peut pas être négatif';
    }

    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'La date d\'effet est requise';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Une raison pour ce changement est requise';
    }

    // Vérification de cohérence
    if (formData.baseRate + formData.paidRate + formData.bonusRate > 150) {
      newErrors.general = 'La somme des taux semble excessive (>150%). Veuillez vérifier.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const commissionData = {
        salesPersonId: salesPerson._id,
        rates: {
          base: formData.baseRate,
          paid: formData.paidRate,
          bonusThreshold: formData.bonusThreshold,
          bonusRate: formData.bonusRate
        },
        effectiveDate: formData.effectiveDate,
        reason: formData.reason.trim(),
        updatedBy: user._id
      };

      const response = await salesService.updateCommissionRate(commissionData);
      
      if (response.success) {
        onSuccess();
      } else {
        setErrors({ general: response.message });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Percent className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Définir les Taux de Commission
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFullName(salesPerson.firstName, salesPerson.lastName)} - {salesPerson.salesId}
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

        <div className="flex">
          {/* Formulaire principal */}
          <div className="flex-1 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Erreur générale */}
              {errors.general && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Taux de commission */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Configuration des Taux
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Taux de base (%) *
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.baseRate}
                        onChange={(e) => handleInputChange('baseRate', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.baseRate 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="5.00"
                      />
                    </div>
                    {errors.baseRate && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.baseRate}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Commission sur toutes les inscriptions
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Taux pour inscriptions payées (%) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.paidRate}
                        onChange={(e) => handleInputChange('paidRate', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.paidRate 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="10.00"
                      />
                    </div>
                    {errors.paidRate && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.paidRate}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Commission supplémentaire pour les paiements effectués
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Seuil de bonus (inscriptions/mois)
                    </label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        min="0"
                        value={formData.bonusThreshold}
                        onChange={(e) => handleInputChange('bonusThreshold', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.bonusThreshold 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="20"
                      />
                    </div>
                    {errors.bonusThreshold && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.bonusThreshold}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Nombre d'inscriptions pour déclencher le bonus
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Taux de bonus (%)
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.bonusRate}
                        onChange={(e) => handleInputChange('bonusRate', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.bonusRate 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="5.00"
                      />
                    </div>
                    {errors.bonusRate && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.bonusRate}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Commission bonus pour les inscriptions au-delà du seuil
                    </p>
                  </div>
                </div>
              </div>

              {/* Date d'effet et raison */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Détails du Changement
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date d'effet *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                        errors.effectiveDate 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {errors.effectiveDate && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.effectiveDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Raison du changement *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    disabled={loading}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                      errors.reason 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Expliquez la raison de ce changement de taux..."
                  />
                  {errors.reason && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.reason}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Enregistrer les Taux</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Panneau de prévisualisation */}
          <div className="w-80 bg-gray-50 dark:bg-gray-700 p-6 border-l border-gray-200 dark:border-gray-600">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              💰 Prévisualisation Commission
            </h4>
            
            {previewCalculation && (
              <div className="space-y-4">
                {/* Données de base */}
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Données actuelles</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Inscriptions/mois:</span>
                      <span className="font-medium">{previewCalculation.monthlyRegistrations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payées/mois:</span>
                      <span className="font-medium">{previewCalculation.monthlyPaidRegistrations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valeur moyenne:</span>
                      <span className="font-medium">{formatCurrency(previewCalculation.avgRegistrationValue)}</span>
                    </div>
                  </div>
                </div>

                {/* Calcul des commissions */}
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Commissions calculées</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base ({formData.baseRate}%):</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrency(previewCalculation.baseCommission)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payées ({formData.paidRate}%):</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(previewCalculation.paidCommission)}
                      </span>
                    </div>
                    {formData.bonusThreshold > 0 && (
                      <div className="flex justify-between">
                        <span>Bonus ({formData.bonusRate}%):</span>
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {formatCurrency(previewCalculation.bonusCommission)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total estimé:</span>
                        <span className="text-orange-600 dark:text-orange-400">
                          {formatCurrency(previewCalculation.totalCommission)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historique récent */}
                {commissionHistory.length > 0 && (
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Historique récent</p>
                    <div className="space-y-2">
                      {commissionHistory.slice(0, 3).map((entry, index) => (
                        <div key={index} className="text-xs">
                          <div className="flex justify-between">
                            <span>{formatDate(entry.effectiveDate)}</span>
                            <span>{entry.rates.base}% / {entry.rates.paid}%</span>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 truncate">
                            {entry.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionRateModal;
