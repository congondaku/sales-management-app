import React, { useState } from 'react';
import { 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Award,
  TrendingUp,
  Users,
  Target,
  Star
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesPersonAuthService } from '../../services/sales-person-auth.service';
import { apiHelpers } from '../../services/api';
import LoadingSpinner from '../Commons/LoadingSpinner';
import { validateEmail, validatePhone, validateName } from '../../utils/validators';

const RegisterUser = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Clear success message when user starts typing
    if (success) {
      setSuccess(null);
      setRegisteredUser(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    const firstNameValidation = validateName(formData.firstName, 'prénom');
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.errors[0];
    }

    // Last Name validation
    const lastNameValidation = validateName(formData.lastName, 'nom');
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.errors[0];
    }

    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors[0];
    }

    // Phone validation
    const phoneValidation = validatePhone(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.errors[0];
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmez le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password
      };

      const response = await salesPersonAuthService.registerUser(userData);
      
      if (response.success) {
        setSuccess('Utilisateur inscrit avec succès !');
        setRegisteredUser(response.user);
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          password: '',
          confirmPassword: ''
        });
        setErrors({});
        
        // Scroll to success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrors({ submit: response.message || 'Erreur lors de l\'inscription' });
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      setErrors({ submit: apiHelpers.formatError(error) });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setSuccess(null);
    setRegisteredUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Inscription Nouveau Client
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Enregistrez un nouveau utilisateur dans votre portefeuille commercial
          </p>
          
          {/* Sales Person Info Card */}
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl px-8 py-4 text-white shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Award className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold">
                  Commercial: {user?.salesId}
                </p>
                <p className="text-green-100">
                  {user?.firstName} {user?.lastName} • {user?.territory}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && registeredUser && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-700 rounded-2xl p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
                  🎉 {success}
                </h3>
                
                <div className="bg-white dark:bg-green-900/30 rounded-xl p-6 border-2 border-green-200 dark:border-green-600 shadow-inner">
                  <h4 className="text-lg font-bold text-green-800 dark:text-green-200 mb-4 flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Détails du client inscrit
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-800/30 rounded-lg p-4">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Nom complet</span>
                      <p className="text-lg font-bold text-green-800 dark:text-green-200">
                        {registeredUser.firstName} {registeredUser.lastName}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-800/30 rounded-lg p-4">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Email</span>
                      <p className="text-lg font-bold text-green-800 dark:text-green-200 break-all">
                        {registeredUser.email}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-800/30 rounded-lg p-4">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Téléphone</span>
                      <p className="text-lg font-bold text-green-800 dark:text-green-200">
                        {registeredUser.phoneNumber}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-800/30 rounded-lg p-4">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Date d'inscription</span>
                      <p className="text-lg font-bold text-green-800 dark:text-green-200">
                        {new Date(registeredUser.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    <UserPlus className="h-6 w-6 mr-2" />
                    Inscrire un autre client
                  </button>
                  <button
                    onClick={() => window.location.href = '#my-users'}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    <Users className="h-6 w-6 mr-2" />
                    Voir mes clients
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-xl p-3">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white">
                  Informations du Nouveau Client
                </h3>
                <p className="text-blue-100 text-lg">
                  Remplissez tous les champs requis pour l'inscription
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-200 dark:border-blue-700 pb-2">
                Informations Personnelles
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* First Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full pl-14 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                        errors.firstName ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="Entrez le prénom du client"
                      disabled={loading}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-600 text-sm mt-2 font-medium">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Nom de famille *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full pl-14 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                        errors.lastName ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="Entrez le nom de famille du client"
                      disabled={loading}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-600 text-sm mt-2 font-medium">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-purple-200 dark:border-purple-700 pb-2">
                Informations de Contact
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Adresse Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-14 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                        errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="client@exemple.com"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-2 font-medium">{errors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Numéro de Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full pl-14 pr-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                        errors.phoneNumber ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="+243 XXX XXX XXX"
                      disabled={loading}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-red-600 text-sm mt-2 font-medium">{errors.phoneNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Information Section */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-red-200 dark:border-red-700 pb-2">
                Informations de Sécurité
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-14 pr-14 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                        errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="••••••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-2 font-medium">{errors.password}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Minimum 8 caractères
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-14 pr-14 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                        errors.confirmPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="••••••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-2 font-medium">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-500 rounded-full p-2">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Erreur d'inscription</h3>
                    <p className="text-red-700 dark:text-red-300">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-8 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-3" />
                    Inscription en cours...
                  </>
                ) : (
                  <>
                    <Save className="h-6 w-6 mr-3" />
                    Inscrire le Client
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="lg:flex-none bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
              >
                <RotateCcw className="h-6 w-6 mr-3" />
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="h-7 w-7 mr-3 text-purple-600" />
            Vos Statistiques Actuelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-2 border-green-200 dark:border-green-700">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {user?.totalRegistrations || 0}
              </div>
              <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                Total Inscriptions
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                Clients enregistrés
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {user?.totalPaidRegistrations || 0}
              </div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                Clients Payants
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Conversions réussies
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-700">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {user?.totalRegistrations > 0 
                  ? Math.round((user.totalPaidRegistrations / user.totalRegistrations) * 100)
                  : 0}%
              </div>
              <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                Taux de Conversion
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Performance globale
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;
