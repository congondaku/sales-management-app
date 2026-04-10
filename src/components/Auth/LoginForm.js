import React, { useState } from 'react';
import { Shield, Eye, EyeOff, User, Lock, Users, Building } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validateLoginForm } from '../../utils/validators';
import LoadingSpinner from '../Commons/LoadingSpinner';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(null);

  const { login } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    if (serverError) {
      setServerError('');
    }
    if (loginSuccess) {
      setLoginSuccess(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError('');
    setLoginSuccess(null);

    const validation = validateLoginForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        const userTypeText = result.userType === 'admin' ? 'Administrateur' : 'Commercial';
        setLoginSuccess(`Connexion réussie en tant que ${userTypeText}`);
      } else {
        setServerError(result.message || 'Erreur de connexion');
      }
    } catch (error) {
      setServerError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(https://congondaku.s3.us-east-1.amazonaws.com/real-estate-listings/1775646035330-633521149.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in relative z-10">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Connexion
          </h1>
          <p className="text-gray-600">
            Système de Gestion des Ventes
          </p>
          
          {/* User type indicators */}
          <div className="flex justify-center space-x-4 mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <Building className="h-4 w-4 mr-1" />
              <span>Admin</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>Commercial</span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500 ${
                  errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="votre@email.com"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
                style={{ 
                  color: '#111827',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500 ${
                  errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
                style={{ 
                  color: '#111827',
                  backgroundColor: '#ffffff'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>
            )}
          </div>

          {/* Success message */}
          {loginSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              {loginSuccess}
            </div>
          )}

          {/* Erreur serveur */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {serverError}
            </div>
          )}

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Info box */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 text-center font-medium">
            💡 Utilisez vos identifiants admin ou commercial
          </p>
          <p className="text-xs text-blue-600 text-center mt-1">
            Le système détectera automatiquement votre type de compte
          </p>
        </div>

        {/* Informations de développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Mode développement - Backend connecté
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
