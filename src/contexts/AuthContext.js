import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialiser l'authentification au chargement
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      const storedToken = authService.getToken();
      const storedUser = authService.getCurrentUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      if (response.success) {
        const { token: authToken, admin } = response;
        
        // Stocker dans localStorage
        localStorage.setItem('admin_token', authToken);
        localStorage.setItem('admin_user', JSON.stringify(admin));
        
        // Mettre à jour l'état
        setToken(authToken);
        setUser(admin);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Connexion échouée');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur de connexion au serveur' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (adminData) => {
    try {
      setLoading(true);
      const response = await authService.register(adminData);
      
      if (response.success) {
        const { token: authToken, admin } = response;
        
        // Stocker dans localStorage
        localStorage.setItem('admin_token', authToken);
        localStorage.setItem('admin_user', JSON.stringify(admin));
        
        // Mettre à jour l'état
        setToken(authToken);
        setUser(admin);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Inscription échouée');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de l\'inscription' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('admin_user', JSON.stringify(updatedUser));
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions[permission] === true;
  };

  const canManage = (entityType, entityId = null) => {
    if (!user) return false;
    
    // CEO peut tout gérer
    if (user.role === 'ceo') return true;
    
    // Vérifier les permissions de gestion spécifiques
    if (!user.managementScope) return false;
    
    if (entityId) {
      return user.managementScope[entityType]?.includes(entityId);
    }
    
    return user.managementScope[entityType]?.length > 0;
  };

  const refreshToken = async () => {
    try {
      // Si vous avez un endpoint de refresh token
      // const response = await authService.refreshToken();
      // Mettre à jour le token
      console.log('Token refresh non implémenté');
    } catch (error) {
      console.error('Erreur lors du refresh du token:', error);
      logout();
    }
  };

  // Auto-logout quand le token expire
  useEffect(() => {
    if (token) {
      // Vous pouvez implémenter une logique pour vérifier l'expiration du token
      // et déclencher un refresh ou un logout automatique
    }
  }, [token]);

  const value = {
    // État
    user,
    token,
    loading,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    
    // Utilitaires
    hasPermission,
    canManage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
