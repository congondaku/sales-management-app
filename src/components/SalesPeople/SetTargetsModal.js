import React, { useState, useEffect } from 'react';
import { X, Target, TrendingUp, Calendar, BarChart3, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesService } from '../../services/sales.service';
import { formatFullName } from '../../utils/formatters';

const SetTargetsModal = ({ salesPerson, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [targetHistory, setTargetHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    monthlyRegistrations: salesPerson?.currentTargets?.monthlyRegistrations || 0,
    monthlyPaidRegistrations: salesPerson?.currentTargets?.monthlyPaidRegistrations || 0,
    quarterlyRevenue: salesPerson?.currentTargets?.quarterlyRevenue || 0,
    yearlyRegistrations: salesPerson?.currentTargets?.yearlyRegistrations || 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    reason: '',
    priority: 'medium'
  });

  const [errors, setErrors] = useState({});
  const [currentPerformance, setCurrentPerformance] = useState(null);

  useEffect(() => {
    loadTargetHistory();
    loadCurrentPerformance();
  }, []);

  const loadTargetHistory = async () => {
    try {
      const response = await salesService.getTargetHistory(salesPerson._id);
      if (response.success) {
        setTargetHistory(response.history || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const loadCurrentPerformance = async () => {
    try {
      const response = await salesService.getPerformanceData(salesPerson._id);
      if (response.success) {
        setCurrentPerformance(response.performance);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des performances:', error);
    }
  };

  const handleInputChange = (field, value) => {
    // Convertir en nombre pour les champs numériques
    const numericFields = ['monthlyRegistrations', 'monthlyPaidRegistrations', 'quarterlyRevenue', 'yearlyRegistrations'];
    const finalValue = numericFields.includes(field) ? parseInt(value) || 0 : value;

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

    if (formData.monthlyRegistrations <= 0) {
      newErrors.monthlyRegistrations = 'L\'objectif mensuel d\'inscriptions doit être supérieur à 0';
    }

    if (formData.monthlyPaidRegistrations < 0) {
      newErrors.monthlyPaidRegistrations = 'L\'objectif d\'inscriptions payées ne peut pas être négatif';
    }

    if (formData.monthlyPaidRegistrations > formData.monthlyRegistrations) {
      newErrors.monthlyPaidRegistrations = 'L\'objectif d\'inscriptions payées ne peut pas dépasser l\'objectif total';
    }

    if (formData.quarterlyRevenue < 0) {
      newErrors.quarterlyRevenue = 'L\'objectif de revenus ne peut pas être négatif';
    }

    if (formData.yearlyRegistrations < formData.monthlyRegistrations * 12) {
      newErrors.yearlyRegistrations = 'L\'objectif annuel semble incohérent avec l\'objectif mensuel';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'La date de fin doit être postérieure à la date de début';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Une raison pour ce changement d\'objectifs est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const targetsData = {
        salesPersonId: salesPerson._id,
        targets: {
          monthlyRegistrations: formData.monthlyRegistrations,
          monthlyPaidRegistrations: formData.monthlyPaidRegistrations,
          quarterlyRevenue: formData.quarterlyRevenue,
          yearlyRegistrations: formData.yearlyRegistrations
        },
        period: {
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        priority: formData.priority,
        reason: formData.reason.trim(),
        setBy: user._id
      };

      const response = await salesService.setTargets(targetsData);
      
      if (response.success) {
        onSuccess();
      } else {
        setErrors({ general: response.message });
      }
    } catch (error) {
      console.error('Erreur lors de la définition des objectifs:', error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const calculateProjections = () => {
    const monthsInPeriod = Math.ceil(
      (new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24 * 30)
    );
    
    return {
      totalRegistrations: formData.monthlyRegistrations * monthsInPeriod,
      totalPaidRegistrations: formData.monthlyPaidRegistrations * monthsInPeriod,
      projectedRevenue: formData.quarterlyRevenue * (monthsInPeriod / 3),
      averagePerMonth: formData.monthlyRegistrations
    };
  };

  const getPerformanceComparison = () => {
    if (!currentPerformance) return null;
    
    return {
      registrationGap: formData.monthlyRegistrations - (currentPerformance.avgMonthlyRegistrations || 0),
      paidGap: formData.monthlyPaidRegistrations - (currentPerformance.avgMonthlyPaid || 0),
      difficulty: formData.monthlyRegistrations > (currentPerformance.avgMonthlyRegistrations || 0) * 1.2 ? 'high' : 
                 formData.monthlyRegistrations > (currentPerformance.avgMonthlyRegistrations || 0) ? 'medium' : 'low'
    };
  };

  const projections = calculateProjections();
  const comparison = getPerformanceComparison();

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
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Définir les Objectifs
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
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Erreur générale */}
              {errors.general && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Performance actuelle */}
              {currentPerformance && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-md font-medium text-blue-900 dark:text-blue-100 mb-2">
                    📊 Performance Actuelle
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Inscriptions/mois:</span>
                      <div className="font-semibold">{currentPerformance.avgMonthlyRegistrations || 0}</div>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Payées/mois:</span>
                      <div className="font-semibold">{currentPerformance.avgMonthlyPaid || 0}</div>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Taux conversion:</span>
                      <div className="font-semibold">{currentPerformance.conversionRate || 0}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Objectifs principaux */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Objectifs Principaux
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inscriptions mensuelles *
                    </label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        min="1"
                        value={formData.monthlyRegistrations}
                        onChange={(e) => handleInputChange('monthlyRegistrations', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.monthlyRegistrations 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="20"
                      />
                    </div>
                    {errors.monthlyRegistrations && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.monthlyRegistrations}</p>
                    )}
                    {comparison && (
                      <p className={`text-xs mt-1 ${
                        comparison.registrationGap > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {comparison.registrationGap > 0 ? '+' : ''}{comparison.registrationGap} par rapport à la moyenne actuelle
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inscriptions payées mensuelles
                    </label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        min="0"
                        value={formData.monthlyPaidRegistrations}
                        onChange={(e) => handleInputChange('monthlyPaidRegistrations', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.monthlyPaidRegistrations 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="15"
                      />
                    </div>
                    {errors.monthlyPaidRegistrations && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.monthlyPaidRegistrations}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Inscriptions avec paiement effectué
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Revenus trimestriels (€)
                    </label>
                    <div className="relative">
                      <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.quarterlyRevenue}
                        onChange={(e) => handleInputChange('quarterlyRevenue', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.quarterlyRevenue 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="50000"
                      />
                    </div>
                    {errors.quarterlyRevenue && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.quarterlyRevenue}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inscriptions annuelles
                    </label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        min="0"
                        value={formData.yearlyRegistrations}
                        onChange={(e) => handleInputChange('yearlyRegistrations', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.yearlyRegistrations 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="240"
                      />
                    </div>
                    {errors.yearlyRegistrations && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.yearlyRegistrations}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Suggéré: {formData.monthlyRegistrations * 12}
                    </p>
                  </div>
                </div>
              </div>

              {/* Période et priorité */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Période et Priorité
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date de début *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.startDate 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    {errors.startDate && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date de fin *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${
                          errors.endDate 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    {errors.endDate && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.endDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priorité
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="critical">Critique</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Raison */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raison/Contexte *
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
                  placeholder="Expliquez le contexte de ces objectifs (nouveau produit, campagne spéciale, amélioration performance...)"
                />
                {errors.reason && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.reason}</p>
                )}
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
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Définir les Objectifs</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Panneau de projections */}
          <div className="w-80 bg-gray-50 dark:bg-gray-700 p-6 border-l border-gray-200 dark:border-gray-600">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              🎯 Projections
            </h4>
            
            <div className="space-y-4">
              {/* Niveau de difficulté */}
              {comparison && (
                <div className={`p-3 rounded-lg ${
                  comparison.difficulty === 'high' ? 'bg-red-100 dark:bg-red-900/20' :
                  comparison.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-green-100 dark:bg-green-900/20'
                }`}>
                  <p className="text-xs font-medium mb-1">Niveau de difficulté</p>
                  <p className={`text-sm font-semibold ${
                    comparison.difficulty === 'high' ? 'text-red-800 dark:text-red-200' :
                    comparison.difficulty === 'medium' ? 'text-yellow-800 dark:text-yellow-200' :
                    'text-green-800 dark:text-green-200'
                  }`}>
                    {comparison.difficulty === 'high' ? '🔥 Difficile' :
                     comparison.difficulty === 'medium' ? '⚖️ Modéré' :
                     '✅ Atteignable'}
                  </p>
                </div>
              )}

              {/* Projections sur la période */}
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sur la période définie</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total inscriptions:</span>
                    <span className="font-medium">{projections.totalRegistrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total payées:</span>
                    <span className="font-medium">{projections.totalPaidRegistrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenus projetés:</span>
                    <span className="font-medium">{formatCurrency(projections.projectedRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Historique récent */}
              {targetHistory.length > 0 && (
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Objectifs précédents</p>
                  <div className="space-y-2">
                    {targetHistory.slice(0, 3).map((target, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex justify-between">
                          <span>{formatDate(target.period.startDate)}</span>
                          <span>{target.targets.monthlyRegistrations}/mois</span>
                        </div>
                        <div className={`text-xs ${
                          target.achievement >= 100 ? 'text-green-600 dark:text-green-400' :
                          target.achievement >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {target.achievement || 0}% atteint
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conseils */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">💡 Conseils</p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Définissez des objectifs SMART</li>
                  <li>• Prévoyez des points de contrôle</li>
                  <li>• Considérez la saisonnalité</li>
                  <li>• Adaptez selon les capacités</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetTargetsModal;
