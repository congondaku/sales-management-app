import React, { useState, useEffect } from 'react';
import { X, Home, Building, MapPin, DollarSign, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import freeListingService from '../../services/freeListing.service';
import LoadingSpinner from '../Commons/LoadingSpinner';

const CreateFreeListingModal = ({ onClose, onSuccess, userRole }) => {
  // Default values from .env
  const DEFAULT_PHONE = process.env.REACT_APP_DEFAULT_PHONE || '+243906520024';
  const DEFAULT_EMAIL = process.env.REACT_APP_DEFAULT_EMAIL || 'support@congondaku.com';

  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [administrativeDivisions, setAdministrativeDivisions] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    // Default contact info
    listerFirstName: '',
    listerLastName: '',
    listerEmailAddress: DEFAULT_EMAIL,
    listerPhoneNumber: DEFAULT_PHONE,
    
    // Property info
    typeOfListing: 'apartment',
    listingType: 'rent',
    priceMonthly: '',
    priceDaily: '',
    priceSale: '',
    currency: 'USD',
    negotiable: true,
    
    // Location
    address: '',
    province: '',
    ville: '',
    commune: '',
    district: '',
    
    // Images
    images: [],
    
    // Details - ALL fields from schema
    details: {
      floor: 0,
      bedroom: 0,
      bathroom: 0,
      kitchen: 0,
      dinningRoom: 0,
      livingRoom: 1,
      parking: false,
      area: 0,
      garden: false,
      furnished: false,
      yearBuilt: '',
      wifi: false,
      airConditioner: false,
      security: false,
      solarPower: false,
      waterTank: false,
      generator: false,
      swimming: false,
      accessForDisabled: false
    },
    
    // Description
    description: '',
    title: ''
  });

  const [errors, setErrors] = useState({});

  // Fetch administrative divisions
  useEffect(() => {
    const fetchAdministrativeDivisions = async () => {
      setLoadingLocations(true);
      try {
        const response = await freeListingService.getAdministrativeDivisions();
        console.log('📍 Administrative divisions loaded:', response);
        
        // Response can be either response.data or direct array
        const divisions = response.data || response;
        setAdministrativeDivisions(Array.isArray(divisions) ? divisions : []);
      } catch (error) {
        console.error('Error fetching administrative divisions:', error);
        alert('Erreur lors du chargement des provinces. Veuillez réessayer.');
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchAdministrativeDivisions();
  }, []);

  // Property types
  const propertyTypes = [
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'studio', label: 'Studio' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'office', label: 'Bureau' },
    { value: 'land', label: 'Terrain' },
    { value: 'shop', label: 'Magasin' },
    { value: 'compound', label: 'Complexe' },
    { value: 'warehouse', label: 'Entrepôt' },
    { value: 'plot', label: 'Parcelle' },
    { value: 'hotel', label: 'Hôtel' }
  ];

  const listingTypes = [
    { value: 'rent', label: 'À louer' },
    { value: 'sale', label: 'À vendre' },
    { value: 'daily', label: 'Location journalière' }
  ];

  // Get available provinces
  const getAvailableProvinces = () => {
    return administrativeDivisions.filter(prov => prov.isActive);
  };

  // Get available villes for selected province
  const getAvailableVilles = () => {
    if (!formData.province) return [];
    
    const selectedProvince = administrativeDivisions.find(
      prov => prov.nom === formData.province
    );
    
    return selectedProvince?.villes?.filter(ville => ville.isActive) || [];
  };

  // Get available communes for selected ville
  const getAvailableCommunes = () => {
    if (!formData.province || !formData.ville) return [];
    
    const selectedProvince = administrativeDivisions.find(
      prov => prov.nom === formData.province
    );
    
    const selectedVille = selectedProvince?.villes?.find(
      ville => ville.nom === formData.ville
    );
    
    return selectedVille?.communes?.filter(commune => commune.isActive) || [];
  };

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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle province change
  const handleProvinceChange = (e) => {
    const province = e.target.value;
    setFormData(prev => ({
      ...prev,
      province,
      ville: '',
      commune: ''
    }));
  };

  // Handle ville change
  const handleVilleChange = (e) => {
    const ville = e.target.value;
    setFormData(prev => ({
      ...prev,
      ville,
      commune: ''
    }));
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
    if (!formData.province) {
      newErrors.province = 'La province est obligatoire';
    }
    if (!formData.ville) {
      newErrors.ville = 'La ville est obligatoire';
    }
    if (!formData.commune) {
      newErrors.commune = 'La commune est obligatoire';
    }

    // Price validation based on listing type
    if (formData.listingType === 'rent' && !formData.priceMonthly) {
      newErrors.priceMonthly = 'Le prix mensuel est obligatoire';
    }
    if (formData.listingType === 'daily' && !formData.priceDaily) {
      newErrors.priceDaily = 'Le prix journalier est obligatoire';
    }
    if (formData.listingType === 'sale' && !formData.priceSale) {
      newErrors.priceSale = 'Le prix de vente est obligatoire';
    }

    // Image validation
    if (imageFiles.length === 0) {
      newErrors.images = 'Au moins une image est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setImageFiles(prev => [...prev, ...files]);

    // Also update formData.images with preview URLs for validation
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newPreviews]
    }));

    // Clear error if exists
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: null }));
    }
  };

  // Remove image
  const handleRemoveImage = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Also remove from formData.images
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Upload images to backend
  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];

    setUploadingImages(true);
    try {
      const uploadedUrls = [];

      // Upload each file to the backend
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('image', file);

        // TODO: Replace with your actual image upload endpoint
        // For now, using a placeholder endpoint - update this to match your backend
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
          // Add authentication if needed
          // headers: {
          //   'Authorization': `Bearer ${token}`
          // }
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        uploadedUrls.push(data.url || data.imageUrl || data.path);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Erreur lors du téléchargement des images');
    } finally {
      setUploadingImages(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that we have image files
    if (imageFiles.length === 0) {
      setErrors(prev => ({ ...prev, images: 'Au moins une image est obligatoire' }));
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting form submission...');
      console.log('📸 Image files:', imageFiles);
      console.log('📸 Number of images:', imageFiles.length);
      
      // Create FormData to send files and data
      const submitFormData = new FormData();
      
      // Append all image files
      imageFiles.forEach((file, index) => {
        console.log(`📸 Appending image ${index + 1}:`, file.name, file.type, file.size);
        submitFormData.append('images', file);
      });
      
      // Append all form fields individually
      submitFormData.append('listerFirstName', formData.listerFirstName);
      submitFormData.append('listerLastName', formData.listerLastName);
      submitFormData.append('listerEmailAddress', formData.listerEmailAddress);
      submitFormData.append('listerPhoneNumber', formData.listerPhoneNumber);
      
      submitFormData.append('typeOfListing', formData.typeOfListing);
      submitFormData.append('listingType', formData.listingType);
      submitFormData.append('currency', formData.currency);
      submitFormData.append('negotiable', formData.negotiable.toString());
      
      // Append prices based on listing type (convert to number)
      if (formData.listingType === 'rent' && formData.priceMonthly) {
        submitFormData.append('priceMonthly', Number(formData.priceMonthly));
      }
      if (formData.listingType === 'daily' && formData.priceDaily) {
        submitFormData.append('priceDaily', Number(formData.priceDaily));
      }
      if (formData.listingType === 'sale' && formData.priceSale) {
        submitFormData.append('priceSale', Number(formData.priceSale));
      }
      
      // Location fields
      submitFormData.append('address', formData.address);
      submitFormData.append('province', formData.province);
      submitFormData.append('ville', formData.ville);
      submitFormData.append('commune', formData.commune);
      if (formData.district) {
        submitFormData.append('district', formData.district);
      }
      
      // Details as JSON string
      submitFormData.append('details', JSON.stringify(formData.details));
      
      // Optional fields
      if (formData.description) {
        submitFormData.append('description', formData.description);
      }
      if (formData.title) {
        submitFormData.append('title', formData.title);
      }

      // Debug: Log all FormData entries
      console.log('📦 FormData contents:');
      for (let pair of submitFormData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      // Call the service with FormData
      // Note: axios automatically sets Content-Type: multipart/form-data for FormData
      console.log('📤 Sending request to backend...');
      const response = await freeListingService.createListing(submitFormData);
      console.log('✅ Success! Response:', response);
      onSuccess(response.listing);
    } catch (error) {
      console.error('❌ Error creating listing:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(error.message || 'Erreur lors de la création de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Créer une Annonce Gratuite
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Loading State */}
        {loadingLocations ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Chargement des provinces...</p>
          </div>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
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
                      placeholder="Ex: Jean"
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
                      placeholder="Ex: Kabila"
                    />
                    {errors.listerLastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.listerLastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email * <span className="text-xs text-gray-500">(Modifiable)</span>
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
                      Téléphone * <span className="text-xs text-gray-500">(Modifiable)</span>
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

              {/* Property Type */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Home className="h-5 w-5 mr-2 text-blue-600" />
                  Type de Propriété
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de bien *
                    </label>
                    <select
                      name="typeOfListing"
                      value={formData.typeOfListing}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {propertyTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'annonce *
                    </label>
                    <select
                      name="listingType"
                      value={formData.listingType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {listingTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Devise
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CDF">CDF (FC)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                  Prix
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.listingType === 'rent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix Mensuel * ({formData.currency})
                      </label>
                      <input
                        type="number"
                        name="priceMonthly"
                        value={formData.priceMonthly}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.priceMonthly ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ex: 800"
                      />
                      {errors.priceMonthly && (
                        <p className="mt-1 text-sm text-red-600">{errors.priceMonthly}</p>
                      )}
                    </div>
                  )}

                  {formData.listingType === 'daily' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix Journalier * ({formData.currency})
                      </label>
                      <input
                        type="number"
                        name="priceDaily"
                        value={formData.priceDaily}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.priceDaily ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ex: 50"
                      />
                      {errors.priceDaily && (
                        <p className="mt-1 text-sm text-red-600">{errors.priceDaily}</p>
                      )}
                    </div>
                  )}

                  {formData.listingType === 'sale' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix de Vente * ({formData.currency})
                      </label>
                      <input
                        type="number"
                        name="priceSale"
                        value={formData.priceSale}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.priceSale ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ex: 150000"
                      />
                      {errors.priceSale && (
                        <p className="mt-1 text-sm text-red-600">{errors.priceSale}</p>
                      )}
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
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Localisation
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
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
                      placeholder="Ex: 123 Avenue de la Liberté"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province *
                    </label>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleProvinceChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.province ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Sélectionner une province</option>
                      {getAvailableProvinces().map(province => (
                        <option key={province._id} value={province.nom}>
                          {province.nom}
                        </option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className="mt-1 text-sm text-red-600">{errors.province}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville *
                    </label>
                    <select
                      name="ville"
                      value={formData.ville}
                      onChange={handleVilleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.ville ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={!formData.province}
                    >
                      <option value="">Sélectionner une ville</option>
                      {getAvailableVilles().map(ville => (
                        <option key={ville._id} value={ville.nom}>
                          {ville.nom}
                        </option>
                      ))}
                    </select>
                    {errors.ville && (
                      <p className="mt-1 text-sm text-red-600">{errors.ville}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commune *
                    </label>
                    <select
                      name="commune"
                      value={formData.commune}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.commune ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={!formData.ville}
                    >
                      <option value="">Sélectionner une commune</option>
                      {getAvailableCommunes().map(commune => (
                        <option key={commune._id} value={commune.nom}>
                          {commune.nom}
                        </option>
                      ))}
                    </select>
                    {errors.commune && (
                      <p className="mt-1 text-sm text-red-600">{errors.commune}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quartier (optionnel)
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Centre-ville"
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de la Propriété
                </h3>
                
                {/* Room counts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Étage
                    </label>
                    <input
                      type="number"
                      name="details.floor"
                      value={formData.details.floor}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

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
                      Salles à manger
                    </label>
                    <input
                      type="number"
                      name="details.dinningRoom"
                      value={formData.details.dinningRoom}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salons
                    </label>
                    <input
                      type="number"
                      name="details.livingRoom"
                      value={formData.details.livingRoom}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Année de construction
                    </label>
                    <input
                      type="number"
                      name="details.yearBuilt"
                      value={formData.details.yearBuilt}
                      onChange={handleChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      placeholder="Ex: 2020"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Amenities - Basic */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Équipements de base</h4>
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
                        name="details.garden"
                        checked={formData.details.garden}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Jardin</span>
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
                        name="details.swimming"
                        checked={formData.details.swimming}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Piscine</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        name="details.accessForDisabled"
                        checked={formData.details.accessForDisabled}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Accès handicapés</span>
                    </label>
                  </div>
                </div>

                {/* Amenities - Services */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Services et commodités</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                        name="details.airConditioner"
                        checked={formData.details.airConditioner}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Climatisation</span>
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

                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        name="details.solarPower"
                        checked={formData.details.solarPower}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Énergie solaire</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        name="details.waterTank"
                        checked={formData.details.waterTank}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Réservoir d'eau</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        name="details.generator"
                        checked={formData.details.generator}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>Générateur</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
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

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Images * <span className="text-sm font-normal text-gray-500 ml-2">(Au moins une image requise)</span>
                </h3>

                {/* Upload Button */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border-2 border-dashed border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors">
                    <Upload className="h-5 w-5" />
                    <span className="font-medium">Télécharger des images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {uploadingImages && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <LoadingSpinner className="h-4 w-4" />
                      <span>Téléchargement...</span>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {errors.images && (
                  <p className="text-sm text-red-600">{errors.images}</p>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                            Image principale
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Upload Tips */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Conseils pour les images :</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Téléchargez des images claires et bien éclairées</li>
                    <li>• La première image sera l'image principale de votre annonce</li>
                    <li>• Formats acceptés : JPG, PNG, WEBP</li>
                    <li>• Vous pouvez télécharger plusieurs images</li>
                  </ul>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Création...
                  </>
                ) : (
                  'Créer l\'Annonce'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateFreeListingModal;
