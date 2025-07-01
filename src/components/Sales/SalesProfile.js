// src/components/Sales/SalesProfile.js
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Save,
  Edit,
  CheckCircle,
  AlertCircle,
  Calendar,
  Award,
  Users,
  Building,
  TrendingUp,
  Target,
  Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesPersonAuthService } from '../../services/sales-person-auth.service';
import LoadingSpinner from '../Commons/LoadingSpinner';
import { validateEmail, validatePhone } from '../../utils/validators';

const SalesProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Clear success message
    if (success) {
      setSuccess('');
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Clear success message
    if (success) {
      setSuccess('');
    }
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (profileData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (profileData.lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!profileData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Le numéro de téléphone est requis';
    } else if (!validatePhone(profileData.phoneNumber)) {
      newErrors.phoneNumber = 'Format de téléphone invalide';
    }

    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Le nouveau mot de passe doit contenir au moins 8 caractères';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmez le nouveau mot de passe';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe doit être différent de l\'ancien';
    }

    return newErrors;
  };

  const handleUpdateProfile = async () => {
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await salesPersonAuthService.updateProfile(profileData);
      
      if (response.success) {
        setSuccess('Profil mis à jour avec succès !');
        setIsEditing(false);
        
        // Update user in auth context
        updateUser({ ...user, ...profileData });
      } else {
        setErrors({ submit: response.message || 'Erreur lors de la mise à jour' });
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      setErrors({ submit: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await salesPersonAuthService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (response.success) {
        setSuccess('Mot de passe modifié avec succès !');
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setErrors({ password: response.message || 'Erreur lors du changement de mot de passe' });
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      setErrors({ password: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || ''
    });
    setErrors({});
    setSuccess('');
  };

  const cancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Mon Profil Commercial
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Gérez vos informations personnelles et paramètres de compte
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="bg-green-500 rounded-full p-2">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Succès !</h3>
                <p className="text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-2xl text-white p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
              <span className="text-3xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl font-bold mb-3">
                {user?.firstName} {user?.lastName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-lg">
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <Award className="h-5 w-5" />
                  <span>ID: {user?.salesId}</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{user?.territory}</span>
                </div>
                {user?.teamName && (
                  <div className="flex items-center justify-center lg:justify-start space-x-2">
                    <Building className="h-5 w-5" />
                    <span>{user.teamName}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center border border-white/30">
              <Shield className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm opacity-90">Statut</p>
              <p className="text-xl font-bold">Commercial Actif</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Informations Personnelles</h3>
              </div>
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  <Edit className="h-5 w-5" />
                  <span>Modifier</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-all duration-200"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    <span>Sauvegarder</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={loading}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Prénom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                      errors.firstName ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    disabled={loading}
                  />
                ) : (
                  <div className="px-4 py-4 text-lg bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600">
                    {user?.firstName}
                  </div>
                )}
                {errors.firstName && (
                  <p className="text-red-600 text-sm mt-2 font-medium">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Nom de famille
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                      errors.lastName ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    disabled={loading}
                  />
                ) : (
                  <div className="px-4 py-4 text-lg bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600">
                    {user?.lastName}
                  </div>
                )}
                {errors.lastName && (
                  <p className="text-red-600 text-sm mt-2 font-medium">{errors.lastName}</p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Adresse email
                </label>
                <div className="flex items-center space-x-4 px-4 py-4 text-lg bg-gray-100 dark:bg-gray-600 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                  <Mail className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">{user?.email}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                  L'adresse email ne peut pas être modifiée
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Numéro de téléphone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                    className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 ${
                      errors.phoneNumber ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center space-x-4 px-4 py-4 text-lg bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                    <Phone className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white font-medium">{user?.phoneNumber}</span>
                  </div>
                )}
                {errors.phoneNumber && (
                  <p className="text-red-600 text-sm mt-2 font-medium">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-500 rounded-full p-2">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Erreur</h3>
                    <p className="text-red-700 dark:text-red-300">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Sécurité du Compte</h3>
              </div>
              
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30"
                >
                  <Lock className="h-5 w-5" />
                  <span>Changer le mot de passe</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-all duration-200"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={cancelPasswordChange}
                    disabled={loading}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/30"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {isChangingPassword ? (
              <div className="space-y-8">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className={`w-full pl-14 pr-14 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 ${
                        errors.currentPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="••••••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      disabled={loading}
                    >
                      {showCurrentPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-600 text-sm mt-2 font-medium">{errors.currentPassword}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className={`w-full pl-14 pr-14 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 ${
                          errors.newPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'
                        } dark:bg-gray-700 dark:text-white`}
                        placeholder="••••••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        disabled={loading}
                      >
                        {showNewPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-red-600 text-sm mt-2 font-medium">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className={`w-full pl-14 pr-14 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 ${
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

                {/* Password Error */}
                {errors.password && (
                  <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-red-500 rounded-full p-2">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Erreur</h3>
                        <p className="text-red-700 dark:text-red-300">{errors.password}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-8 w-24 h-24 mx-auto mb-6">
                  <Lock className="h-8 w-8 text-gray-500 dark:text-gray-400 mx-auto" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Mot de passe sécurisé
                </h4>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Votre mot de passe est protégé et chiffré. Cliquez sur "Changer le mot de passe" pour le modifier.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Account Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Calendar className="h-7 w-7 mr-3 text-purple-600" />
              Informations du Compte
            </h3>
            
            <div className="space-y-6">
              
              {/* Sales ID */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border-2 border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 rounded-lg p-3">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">ID Commercial</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-200">
                      {user?.salesId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Territory */}
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 rounded-lg p-3">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Territoire</p>
                    <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                      {user?.territory}
                    </p>
                  </div>
                </div>
              </div>

              {/* Team */}
              {user?.teamName && (
                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-500 rounded-lg p-3">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Équipe</p>
                      <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                        {user.teamName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Registration Date */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-500 rounded-lg p-3">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Membre depuis</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Non disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <TrendingUp className="h-7 w-7 mr-3 text-yellow-600" />
              Résumé des Performances
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {user?.totalRegistrations || 0}
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Inscriptions
                </div>
              </div>
              
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/30 rounded-xl border-2 border-green-200 dark:border-green-700">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {user?.totalPaidRegistrations || 0}
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Clients Payants
                </div>
              </div>
              
              <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl border-2 border-yellow-200 dark:border-yellow-700">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  ${user?.totalEarnings?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Total Gains
                </div>
              </div>
              
              <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {user?.totalRegistrations > 0 
                    ? Math.round((user.totalPaidRegistrations / user.totalRegistrations) * 100)
                    : 0}%
                </div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Taux de Conversion
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Information */}
        {user?.manager && (
          <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 rounded-2xl text-white p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <User className="h-7 w-7 mr-3" />
              Mon Manager
            </h3>
            
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="flex-1 text-center lg:text-left">
                <p className="text-3xl font-bold mb-3">
                  {user.manager.name}
                </p>
                <p className="text-xl text-blue-100 mb-3">
                  Rôle: {user.manager.role}
                </p>
                <p className="text-blue-100">
                  Pour toute question ou assistance, n'hésitez pas à contacter votre manager. 
                  Il est là pour vous accompagner dans votre réussite commerciale.
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center border border-white/30">
                <User className="h-16 w-16 mx-auto mb-3" />
                <p className="text-lg font-bold">Manager</p>
                <p className="text-sm opacity-90">Support & Guidance</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Actions Rapides
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="group p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 rounded-xl border-2 border-blue-200 dark:border-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              <Users className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
              <h4 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">Mes Clients</h4>
              <p className="text-blue-700 dark:text-blue-300">
                Voir la liste de mes clients inscrits et gérer leurs informations
              </p>
            </button>
            
            <button className="group p-6 text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/40 dark:hover:to-green-700/40 rounded-xl border-2 border-green-200 dark:border-green-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              <Target className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
              <h4 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">Ma Performance</h4>
              <p className="text-green-700 dark:text-green-300">
                Consulter mes objectifs, résultats et analyser ma progression
              </p>
            </button>
            
            <button className="group p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/40 dark:hover:to-purple-700/40 rounded-xl border-2 border-purple-200 dark:border-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              <CheckCircle className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200" />
              <h4 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-2">Inscrire un Client</h4>
              <p className="text-purple-700 dark:text-purple-300">
                Enregistrer un nouveau client et commencer le processus
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesProfile;
