import React, { useState } from 'react';
import { Menu, Bell, Sun, Moon, Search, User, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

const Header = ({ title, isSidebarOpen, setIsSidebarOpen }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);

  // Check if user has full access (CEO or Super Admin)
  const hasFullAccess = user?.role === 'ceo' || user?.role === 'super_admin';
  
  // Get role display name
  const getRoleDisplay = () => {
    if (user?.role === 'ceo') return 'PDG';
    if (user?.role === 'super_admin') return 'Super Admin';
    if (user?.role === 'regional_manager') return 'Directeur Régional';
    if (user?.role === 'sales_manager') return 'Directeur des Ventes';
    if (user?.role === 'team_leader') return 'Chef d\'Équipe';
    return user?.role || 'Utilisateur';
  };

  // Get role color for avatar background
  const getAvatarColor = () => {
    if (user?.role === 'ceo') return 'bg-gradient-to-br from-yellow-500 to-orange-600';
    if (user?.role === 'super_admin') return 'bg-gradient-to-br from-purple-500 to-pink-600';
    return 'bg-blue-600';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        
        {/* Côté gauche - Menu et titre */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
            {hasFullAccess && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                <Star className="h-3 w-3 mr-1" />
                Accès complet
              </span>
            )}
          </div>
        </div>

        {/* Côté droit - Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Barre de recherche (optionnelle pour les grandes interfaces) */}
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Toggle thème */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown des notifications */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20 dark:bg-gray-800 dark:ring-gray-700">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-gray-500 text-center py-4 dark:text-gray-400">
                          Aucune notification
                        </p>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-lg border ${
                              notification.read 
                                ? 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600' 
                                : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.read ? 'bg-gray-400' : 'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                                  {new Date(notification.timestamp).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {notifications.length > 5 && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                          Voir toutes les notifications
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Profil utilisateur */}
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${getAvatarColor()} rounded-full flex items-center justify-center`}>
              <span className="text-sm font-medium text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName}
                </p>
                {hasFullAccess && (
                  <Star className="h-3 w-3 text-purple-500" />
                )}
              </div>
              <div className="flex items-center space-x-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getRoleDisplay()}
                </p>
                {user?.role === 'super_admin' && (
                  <span className="text-xs text-purple-500">✨</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche mobile */}
      <div className="md:hidden mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
