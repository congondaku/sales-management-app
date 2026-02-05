import React, { useState } from 'react';
import { X, Calendar, Clock, Check } from 'lucide-react';
import freeListingService from '../../services/freeListing.service';
import LoadingSpinner from '../Commons/LoadingSpinner';

const ActivateFreeListingModal = ({ listing, onClose, onSuccess, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    duration: 3,
    unit: 'months'
  });

  // Get max duration based on user role
  const getMaxDuration = () => {
    if (userRole === 'admin') {
      return {
        days: 3650,   // ~10 years
        weeks: 520,   // ~10 years
        months: 120   // 10 years
      };
    } else if (userRole === 'salesperson') {
      return {
        days: 90,     // 3 months
        weeks: 12,    // ~3 months
        months: 3     // 3 months
      };
    }
    return {
      days: 30,     // 1 month
      weeks: 4      // 1 month
    };
  };

  const maxDuration = getMaxDuration();

  // Unit options based on role
  const getUnitOptions = () => {
    if (userRole === 'admin' || userRole === 'salesperson') {
      return [
        { value: 'days', label: 'Jours' },
        { value: 'weeks', label: 'Semaines' },
        { value: 'months', label: 'Mois' }
      ];
    }
    return [
      { value: 'days', label: 'Jours' },
      { value: 'weeks', label: 'Semaines' }
    ];
  };

  // Quick duration presets based on role
  const getPresets = () => {
    if (userRole === 'admin') {
      return [
        { duration: 3, unit: 'months', label: '3 Mois' },
        { duration: 6, unit: 'months', label: '6 Mois' },
        { duration: 12, unit: 'months', label: '1 An' },
        { duration: 24, unit: 'months', label: '2 Ans' }
      ];
    } else if (userRole === 'salesperson') {
      return [
        { duration: 7, unit: 'days', label: '1 Semaine' },
        { duration: 1, unit: 'months', label: '1 Mois' },
        { duration: 2, unit: 'months', label: '2 Mois' },
        { duration: 3, unit: 'months', label: '3 Mois' }
      ];
    }
    return [
      { duration: 7, unit: 'days', label: '1 Semaine' },
      { duration: 14, unit: 'days', label: '2 Semaines' },
      { duration: 21, unit: 'days', label: '3 Semaines' },
      { duration: 30, unit: 'days', label: '30 Jours' }
    ];
  };

  const presets = getPresets();

  // Calculate expiry date
  const calculateExpiryDate = () => {
    const now = new Date();
    const expiry = new Date(now);

    switch (formData.unit) {
      case 'days':
        expiry.setDate(now.getDate() + formData.duration);
        break;
      case 'weeks':
        expiry.setDate(now.getDate() + (formData.duration * 7));
        break;
      case 'months':
        expiry.setMonth(now.getMonth() + formData.duration);
        break;
      default:
        break;
    }

    return expiry.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 1 : value
    }));
  };

  // Handle preset click
  const handlePresetClick = (preset) => {
    setFormData({
      duration: preset.duration,
      unit: preset.unit
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate max duration
    const max = maxDuration[formData.unit];
    if (formData.duration > max) {
      alert(`La durée maximale est de ${max} ${formData.unit}`);
      return;
    }

    if (formData.duration < 1) {
      alert('La durée doit être au moins 1');
      return;
    }

    setLoading(true);
    try {
      if (userRole === 'admin') {
        await freeListingService.activateFreeListing(
          listing._id,
          formData.duration,
          formData.unit
        );
      } else if (userRole === 'salesperson') {
        await freeListingService.activateFreeListingSalesperson(
          listing._id,
          formData.duration,
          formData.unit
        );
      }
      onSuccess();
    } catch (error) {
      console.error('Error activating listing:', error);
      alert(error.message || 'Erreur lors de l\'activation de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Activer l'Annonce Gratuite
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Définissez la durée de publication gratuite
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Listing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              {listing.title || 'Annonce sans titre'}
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>📍 {listing.address}, {listing.commune}, {listing.ville}</p>
              <p>🏠 {listing.typeOfListing} - {listing.listingType}</p>
              <p>💰 {listing.priceMonthly || listing.priceDaily || listing.priceSale} {listing.currency}</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Durées Rapides
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                    formData.duration === preset.duration && formData.unit === preset.unit
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-400 text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                max={maxDuration[formData.unit]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum: {maxDuration[formData.unit]} {formData.unit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unité
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getUnitOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiry Preview */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900">
                  Date d'expiration
                </h4>
                <p className="text-lg font-semibold text-green-700 mt-1">
                  {calculateExpiryDate()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  L'annonce sera active pendant {formData.duration} {formData.unit}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Role Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="text-sm text-gray-600">
                {userRole === 'admin' && (
                  <p>
                    En tant qu'<strong>administrateur</strong>, vous pouvez activer des annonces gratuites jusqu'à 10 ans.
                  </p>
                )}
                {userRole === 'salesperson' && (
                  <p>
                    En tant que <strong>commercial</strong>, vous pouvez activer des annonces gratuites jusqu'à 3 mois.
                  </p>
                )}
                {userRole === 'user' && (
                  <p>
                    En tant qu'<strong>utilisateur</strong>, vous pouvez activer des annonces gratuites jusqu'à 30 jours.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Activation...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Activer Gratuitement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivateFreeListingModal;
