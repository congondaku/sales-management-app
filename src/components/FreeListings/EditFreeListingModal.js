import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import freeListingService from '../../services/freeListing.service';
import LoadingSpinner from '../Commons/LoadingSpinner';

const EditFreeListingModal = ({ listing, onClose, onSuccess }) => {
  const DEFAULT_PHONE = process.env.REACT_APP_DEFAULT_PHONE || '+243906520024';
  const DEFAULT_EMAIL = process.env.REACT_APP_DEFAULT_EMAIL || 'support@congondaku.com';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    listerFirstName: listing.listerFirstName || '',
    listerLastName: listing.listerLastName || '',
    listerEmailAddress: listing.listerEmailAddress || DEFAULT_EMAIL,
    listerPhoneNumber: listing.listerPhoneNumber || DEFAULT_PHONE,
    address: listing.address || '',
    description: listing.description || '',
    title: listing.title || '',
    priceMonthly: listing.priceMonthly || '',
    priceDaily: listing.priceDaily || '',
    priceSale: listing.priceSale || '',
    negotiable: listing.negotiable || false,
    details: {
      bedroom: listing.details?.bedroom || 0,
      bathroom: listing.details?.bathroom || 0,
      kitchen: listing.details?.kitchen || 0,
      area: listing.details?.area || 0,
      parking: listing.details?.parking || false,
      furnished: listing.details?.furnished || false,
      wifi: listing.details?.wifi || false,
      security: listing.details?.security || false
    }
  });

  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('details.')) {
      const detailKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        details: {
          ...prev.details,
          [detailKey]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.listerFirstName.trim()) {
      newErrors.listerFirstName = 'Le prénom est obligatoire';
    }
    if (!formData.listerLastName.trim()) {
      newErrors.listerLastName = 'Le nom est obligatoire';
    }
    if (!formData.listerEmailAddress.trim()) {
      newErrors.listerEmailAddress = "L'email est obligatoire";
    }
    if (!formData.listerPhoneNumber.trim()) {
      newErrors.listerPhoneNumber = 'Le téléphone est obligatoire';
    }
    if (!formData.address.trim()) {
      newErrors.address = "L'adresse est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await freeListingService.updateListing(listing._id, formData);
      onSuccess();
    } catch (error) {
      console.error('Error updating listing:', error);
      alert(error.message || 'Erreur lors de la mise à jour de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Modifier l'Annonce
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {listing.title || 'Annonce sans titre'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Informations de Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="listerFirstName"
                  value={formData.listerFirstName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.listerFirstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.listerFirstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.listerFirstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  name="listerLastName"
                  value={formData.listerLastName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.listerLastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.listerLastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.listerLastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="listerEmailAddress"
                  value={formData.listerEmailAddress}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.listerEmailAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.listerEmailAddress && (
                  <p className="mt-1 text-sm text-red-600">{errors.listerEmailAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="listerPhoneNumber"
                  value={formData.listerPhoneNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.listerPhoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.listerPhoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.listerPhoneNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          {listing.listingType === 'rent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix Mensuel ({listing.currency})
              </label>
              <input
                type="number"
                name="priceMonthly"
                value={formData.priceMonthly}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {listing.listingType === 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix Journalier ({listing.currency})
              </label>
              <input
                type="number"
                name="priceDaily"
                value={formData.priceDaily}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {listing.listingType === 'sale' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix de Vente ({listing.currency})
              </label>
              <input
                type="number"
                name="priceSale"
                value={formData.priceSale}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              name="negotiable"
              checked={formData.negotiable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Prix négociable
            </label>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Détails de la Propriété
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chambres
                </label>
                <input
                  type="number"
                  name="details.bedroom"
                  value={formData.details.bedroom}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salles de bain
                </label>
                <input
                  type="number"
                  name="details.bathroom"
                  value={formData.details.bathroom}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuisines
                </label>
                <input
                  type="number"
                  name="details.kitchen"
                  value={formData.details.kitchen}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surface (m²)
                </label>
                <input
                  type="number"
                  name="details.area"
                  value={formData.details.area}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="details.parking"
                  checked={formData.details.parking}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span>Parking</span>
              </label>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="details.furnished"
                  checked={formData.details.furnished}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span>Meublé</span>
              </label>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="details.wifi"
                  checked={formData.details.wifi}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span>WiFi</span>
              </label>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="details.security"
                  checked={formData.details.security}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span>Sécurité</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Décrivez la propriété..."
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Titre de l'annonce"
            />
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFreeListingModal;
