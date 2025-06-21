import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

const Toast = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  autoClose = true,
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Configuration des types de toast
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      textColor: 'text-green-700'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      textColor: 'text-red-700'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700'
    },
    loading: {
      icon: Loader2,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      iconColor: 'text-gray-600',
      titleColor: 'text-gray-800',
      textColor: 'text-gray-700'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  // Gérer la fermeture automatique
  useEffect(() => {
    if (autoClose && duration > 0 && type !== 'loading') {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        max-w-sm w-full pointer-events-auto overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5
        ${config.bgColor} ${config.borderColor}
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon 
              className={`h-6 w-6 ${config.iconColor} ${type === 'loading' ? 'animate-spin' : ''}`} 
            />
          </div>
          
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {title && (
              <p className={`text-sm font-medium ${config.titleColor}`}>
                {title}
              </p>
            )}
            {message && (
              <p className={`text-sm ${config.textColor} ${title ? 'mt-1' : ''}`}>
                {message}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className={`
                inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                ${config.iconColor} hover:opacity-75 focus:ring-offset-${config.bgColor}
              `}
            >
              <span className="sr-only">Fermer</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Barre de progression pour l'auto-close */}
      {autoClose && duration > 0 && type !== 'loading' && !isExiting && (
        <div className="h-1 bg-black bg-opacity-10">
          <div 
            className={`h-full ${config.iconColor.replace('text-', 'bg-')} transition-all ease-linear`}
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Container pour les toasts
export const ToastContainer = ({ toasts = [], position = 'top-right', onRemove }) => {
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2'
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className={`
        fixed z-50 pointer-events-none p-6 w-full 
        ${positionClasses[position]}
      `}
    >
      <div className="flex flex-col space-y-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            autoClose={toast.autoClose}
            onClose={onRemove}
            position={position}
          />
        ))}
      </div>
    </div>
  );
};

// Hook pour gérer les toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, ...toast }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  // Méthodes de convenance
  const success = (message, title = 'Succès', options = {}) => {
    return addToast({
      type: 'success',
      title,
      message,
      duration: 5000,
      autoClose: true,
      ...options
    });
  };

  const error = (message, title = 'Erreur', options = {}) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 0, // Les erreurs ne se ferment pas automatiquement
      autoClose: false,
      ...options
    });
  };

  const warning = (message, title = 'Attention', options = {}) => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: 7000,
      autoClose: true,
      ...options
    });
  };

  const info = (message, title = 'Information', options = {}) => {
    return addToast({
      type: 'info',
      title,
      message,
      duration: 5000,
      autoClose: true,
      ...options
    });
  };

  const loading = (message, title = 'Chargement', options = {}) => {
    return addToast({
      type: 'loading',
      title,
      message,
      autoClose: false,
      ...options
    });
  };

  const updateToast = (id, updates) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    updateToast,
    success,
    error,
    warning,
    info,
    loading
  };
};

// CSS pour l'animation de la barre de progression
const progressBarCSS = `
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

// Injecter le CSS si ce n'est pas déjà fait
if (typeof document !== 'undefined' && !document.getElementById('toast-progress-css')) {
  const style = document.createElement('style');
  style.id = 'toast-progress-css';
  style.textContent = progressBarCSS;
  document.head.appendChild(style);
}

export default Toast;
