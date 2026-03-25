import React, { useState, useEffect } from 'react';
import { Settings, User, Lock, Bell, Database, Shield, Save, Eye, EyeOff, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { validatePasswordChangeForm } from '../../utils/validators';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../Commons/LoadingSpinner';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme, language, changeLanguage } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check if user has full access (CEO or Super Admin)
  const hasFullAccess = user?.role === 'ceo' || user?.role === 'super_admin';

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Préférences', icon: Settings },
    { id: 'system', label: 'Système', icon: Database }
  ];

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Paramètres
          </h2>
          {hasFullAccess && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              <Star className="h-3 w-3 mr-1" />
              Accès complet
            </span>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez vos préférences et paramètres du compte
        </p>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation des onglets */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? hasFullAccess 
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            
            {activeTab === 'profile' && (
              <ProfileTab 
                user={user} 
                updateUser={updateUser}
                loading={loading}
                setLoading={setLoading}
                showMessage={showMessage}
                hasFullAccess={hasFullAccess}
              />
            )}
            
            {activeTab === 'security' && (
              <SecurityTab 
                loading={loading}
                setLoading={setLoading}
                showMessage={showMessage}
                hasFullAccess={hasFullAccess}
              />
            )}
            
            {activeTab === 'notifications' && (
              <NotificationsTab 
                loading={loading}
                setLoading={setLoading}
                showMessage={showMessage}
                hasFullAccess={hasFullAccess}
              />
            )}
            
            {activeTab === 'preferences' && (
              <PreferencesTab 
                theme={theme}
                toggleTheme={toggleTheme}
                language={language}
                changeLanguage={changeLanguage}
                showMessage={showMessage}
                hasFullAccess={hasFullAccess}
              />
            )}
            
            {activeTab === 'system' && (
              <SystemTab 
                user={user}
                loading={loading}
                setLoading={setLoading}
                showMessage={showMessage}
                hasFullAccess={hasFullAccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Onglet Profil
const ProfileTab = ({ user, updateUser, loading, setLoading, showMessage, hasFullAccess }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await userService.updateCurrentProfile(formData);
      if (response.success) {
        updateUser({ ...user, ...formData });
        showMessage('success', 'Profil mis à jour avec succès');
      } else {
        showMessage('error', response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      showMessage('error', 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = () => {
    if (user?.role === 'ceo') return 'PDG';
    if (user?.role === 'super_admin') return 'Super Administrateur';
    if (user?.role === 'regional_manager') return 'Directeur Régional';
    if (user?.role === 'sales_manager') return 'Directeur des Ventes';
    if (user?.role === 'team_leader') return 'Chef d\'Équipe';
    return user?.role || 'Administrateur';
  };

  const getRoleColor = () => {
    if (user?.role === 'ceo') return 'bg-yellow-100 text-yellow-800';
    if (user?.role === 'super_admin') return 'bg-purple-100 text-purple-800';
    if (user?.role === 'regional_manager') return 'bg-purple-100 text-purple-800';
    if (user?.role === 'sales_manager') return 'bg-blue-100 text-blue-800';
    if (user?.role === 'team_leader') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <User className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Informations du Profil
        </h3>
      </div>

      <div className="space-y-6">
        
        {/* Photo de profil */}
        <div className="flex items-center space-x-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            user?.role === 'ceo' 
              ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
              : user?.role === 'super_admin'
              ? 'bg-gradient-to-br from-purple-500 to-pink-600'
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
            <span className="text-2xl font-bold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h4>
            <div className="flex items-center space-x-2">
              <span className={`text-sm px-2 py-1 rounded-full font-medium ${getRoleColor()}`}>
                {getRoleDisplay()}
              </span>
              {hasFullAccess && (
                <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Accès complet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Décrivez-vous brièvement..."
            disabled={loading}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`${hasFullAccess ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-2`}
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Onglet Sécurité
const SecurityTab = ({ loading, setLoading, showMessage, hasFullAccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});

  const handleChangePassword = async () => {
    setErrors({});
    
    // Validation côté client
    const validation = validatePasswordChangeForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      // Ici vous appelleriez l'API de changement de mot de passe
      console.log('Changement de mot de passe:', formData);
      
      // Simuler la réponse de l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showMessage('success', 'Mot de passe modifié avec succès');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage('error', 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Lock className="h-5 w-5 text-red-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sécurité du Compte
        </h3>
      </div>

      <div className="space-y-6">
        
        {/* Changement de mot de passe */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Changer le mot de passe
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.currentPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.currentPassword[0]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.newPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.newPassword[0]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleChangePassword}
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>{loading ? 'Modification...' : 'Changer le mot de passe'}</span>
            </button>
          </div>
        </div>

        {/* Sessions actives */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Sessions actives
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Session actuelle
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Navigateur actuel • {new Date().toLocaleDateString('fr-FR')}
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 px-2 py-1 rounded-full">
                Actuelle
              </span>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Aucune autre session active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Onglet Notifications
const NotificationsTab = ({ loading, setLoading, showMessage, hasFullAccess }) => {
  const [notifications, setNotifications] = useState({
    emailCommissions: true,
    emailReports: true,
    emailSecurity: true,
    pushCommissions: false,
    pushReports: false,
    pushSecurity: true,
    smsUrgent: false
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Ici vous appelleriez l'API pour sauvegarder les préférences
      console.log('Sauvegarde des préférences de notification:', notifications);
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Préférences de notification sauvegardées');
    } catch (error) {
      showMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Bell className="h-5 w-5 text-yellow-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Préférences de Notification
        </h3>
      </div>

      <div className="space-y-6">
        
        {/* Notifications par email */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Notifications par Email
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nouvelles commissions
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recevoir un email pour chaque nouvelle commission
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailCommissions}
                onChange={(e) => setNotifications(prev => ({ ...prev, emailCommissions: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rapports hebdomadaires
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recevoir un résumé hebdomadaire des performances
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailReports}
                onChange={(e) => setNotifications(prev => ({ ...prev, emailReports: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alertes de sécurité
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Notifications importantes concernant la sécurité du compte
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailSecurity}
                onChange={(e) => setNotifications(prev => ({ ...prev, emailSecurity: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {/* Notifications push */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Notifications Push
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nouvelles commissions
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Notifications push pour les nouvelles commissions
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.pushCommissions}
                onChange={(e) => setNotifications(prev => ({ ...prev, pushCommissions: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alertes de sécurité
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Notifications push pour les alertes de sécurité
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.pushSecurity}
                onChange={(e) => setNotifications(prev => ({ ...prev, pushSecurity: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`${hasFullAccess ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-2`}
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Onglet Préférences
const PreferencesTab = ({ theme, toggleTheme, language, changeLanguage, showMessage, hasFullAccess }) => {
  const [preferences, setPreferences] = useState({
    dateFormat: 'dd/mm/yyyy',
    currency: 'EUR',
    animations: true,
    compactSidebar: false
  });

  const handleSavePreferences = async () => {
    try {
      // Ici vous appelleriez l'API pour sauvegarder les préférences
      console.log('Sauvegarde des préférences:', preferences);
      await new Promise(resolve => setTimeout(resolve, 500));
      showMessage('success', 'Préférences sauvegardées avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de la sauvegarde des préférences');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Settings className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Préférences d'Interface
        </h3>
      </div>

      <div className="space-y-6">
        
        {/* Thème */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Apparence
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thème
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={theme === 'light'}
                    onChange={() => theme !== 'light' && toggleTheme()}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Clair</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={theme === 'dark'}
                    onChange={() => theme !== 'dark' && toggleTheme()}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Sombre</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Langue */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Langue et Région
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Langue de l'interface
              </label>
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Format de date
              </label>
              <select 
                value={preferences.dateFormat}
                onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="dd/mm/yyyy">DD/MM/YYYY (Français)</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY (Américain)</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Devise
              </label>
              <select 
                value={preferences.currency}
                onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar US ($)</option>
                <option value="GBP">Livre Sterling (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interface */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Interface
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Animations
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Activer les animations et transitions
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.animations}
                onChange={(e) => setPreferences(prev => ({ ...prev, animations: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sidebar réduite
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Réduire la barre latérale par défaut
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.compactSidebar}
                onChange={(e) => setPreferences(prev => ({ ...prev, compactSidebar: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSavePreferences}
            className={`${hasFullAccess ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-lg flex items-center space-x-2`}
          >
            <Save className="h-4 w-4" />
            <span>Sauvegarder les préférences</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Onglet Système
const SystemTab = ({ user, loading, setLoading, showMessage, hasFullAccess }) => {
  const handleExportData = async () => {
    setLoading(true);
    try {
      // Ici vous appelleriez l'API pour exporter les données
      console.log('Exportation des données utilisateur');
      await new Promise(resolve => setTimeout(resolve, 2000));
      showMessage('success', 'Données exportées avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'exportation des données');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.')) {
      setLoading(true);
      try {
        // Ici vous appelleriez l'API pour supprimer le compte
        console.log('Suppression du compte utilisateur');
        await new Promise(resolve => setTimeout(resolve, 2000));
        showMessage('success', 'Compte supprimé avec succès');
      } catch (error) {
        showMessage('error', 'Erreur lors de la suppression du compte');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleDisplay = () => {
    if (user?.role === 'ceo') return 'PDG';
    if (user?.role === 'super_admin') return 'Super Administrateur';
    return user?.role || 'Administrateur';
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Database className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Informations Système
        </h3>
      </div>

      <div className="space-y-6">
        
        {/* Informations du compte */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Informations du Compte
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Utilisateur</span>
              <p className="text-sm text-gray-900 dark:text-white font-mono">{user?._id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rôle</span>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-900 dark:text-white">{getRoleDisplay()}</p>
                {hasFullAccess && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                    <Star className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</span>
              <p className="text-sm text-gray-900 dark:text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière connexion</span>
              <p className="text-sm text-gray-900 dark:text-white">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Version de l'application */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Version de l'Application
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Version</span>
              <span className="text-sm text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Build</span>
              <span className="text-sm text-gray-900 dark:text-white font-mono">2024.01.15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Environnement</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {process.env.NODE_ENV === 'development' ? 'Développement' : 'Production'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions système */}
        <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
          <h4 className="text-md font-medium text-red-900 dark:text-red-200 mb-4">
            Zone de Danger
          </h4>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                Exporter toutes mes données
              </p>
              <button 
                onClick={handleExportData}
                disabled={loading}
                className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 text-sm disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="red" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                <span>{loading ? 'Exportation...' : 'Exporter les données'}</span>
              </button>
            </div>
            
            {(hasFullAccess) && (
              <div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  Supprimer définitivement mon compte (CEO/Super Admin uniquement)
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Suppression...' : 'Supprimer le compte'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
