import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé dans un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Générer un ID unique pour chaque notification
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Ajouter une notification
  const addNotification = useCallback((notification) => {
    const id = generateId();
    const newNotification = {
      id,
      timestamp: new Date(),
      autoClose: true,
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-supprimer si autoClose est activé
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Supprimer toutes les notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Notifications de succès
  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      title: 'Succès',
      message,
      ...options
    });
  }, [addNotification]);

  // Notifications d'erreur
  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      title: 'Erreur',
      message,
      autoClose: false, // Les erreurs ne se ferment pas automatiquement
      ...options
    });
  }, [addNotification]);

  // Notifications d'avertissement
  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      title: 'Attention',
      message,
      duration: 7000, // Plus long pour les avertissements
      ...options
    });
  }, [addNotification]);

  // Notifications d'information
  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      title: 'Information',
      message,
      ...options
    });
  }, [addNotification]);

  // Notifications de chargement
  const loading = useCallback((message, options = {}) => {
    return addNotification({
      type: 'loading',
      title: 'Chargement',
      message,
      autoClose: false,
      ...options
    });
  }, [addNotification]);

  // Mettre à jour une notification existante
  const updateNotification = useCallback((id, updates) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  // Notifications spécifiques au contexte métier
  const salesSuccess = useCallback((message, salesPersonName) => {
    return success(`${salesPersonName}: ${message}`, {
      title: 'Succès Commercial',
      duration: 6000
    });
  }, [success]);

  const commissionAlert = useCallback((amount, currency = 'EUR') => {
    return info(`Nouvelle commission de ${amount}${currency} générée`, {
      title: 'Commission',
      duration: 8000
    });
  }, [info]);

  const permissionChange = useCallback((action, targetName) => {
    return warning(`Permission ${action} pour ${targetName}`, {
      title: 'Modification de Permission',
      duration: 6000
    });
  }, [warning]);

  const systemAlert = useCallback((message, level = 'info') => {
    const notificationMethod = level === 'error' ? error : 
                              level === 'warning' ? warning : info;
    return notificationMethod(message, {
      title: 'Alerte Système',
      autoClose: level !== 'error'
    });
  }, [error, warning, info]);

  // Obtenir le nombre de notifications non lues
  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Marquer une notification comme lue
  const markAsRead = useCallback((id) => {
    updateNotification(id, { read: true });
  }, [updateNotification]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const value = {
    // État
    notifications,
    unreadCount: getUnreadCount(),

    // Actions générales
    addNotification,
    removeNotification,
    updateNotification,
    clearNotifications,
    markAsRead,
    markAllAsRead,

    // Notifications typées
    success,
    error,
    warning,
    info,
    loading,

    // Notifications métier
    salesSuccess,
    commissionAlert,
    permissionChange,
    systemAlert
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
