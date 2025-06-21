import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { salesPersonAuthService } from '../services/sales-person-auth.service';

// Create the context
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
  const [userType, setUserType] = useState(null); // 'admin' | 'sales_person'

  // Initialiser l'authentification au chargement
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      // Check for admin token first
      const adminToken = authService.getToken();
      const adminUser = authService.getCurrentUser();

      // Check for sales person token
      const salesToken = salesPersonAuthService.getToken();
      const salesPerson = salesPersonAuthService.getCurrentSalesPerson();

      if (adminToken && adminUser) {
        setToken(adminToken);
        setUser(adminUser);
        setUserType('admin');
        setIsAuthenticated(true);
      } else if (salesToken && salesPerson) {
        setToken(salesToken);
        setUser(salesPerson);
        setUserType('sales_person');
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENHANCED: Universal login that detects user type
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Try admin login first
      try {
        const adminResponse = await authService.login(email, password);
        if (adminResponse.success) {
          const { token: authToken, admin } = adminResponse;
          
          // Store admin data
          localStorage.setItem('admin_token', authToken);
          localStorage.setItem('admin_user', JSON.stringify(admin));
          
          // Update state
          setToken(authToken);
          setUser(admin);
          setUserType('admin');
          setIsAuthenticated(true);
          
          return { success: true, userType: 'admin' };
        }
      } catch (adminError) {
        // Admin login failed, try sales person login
        console.log('Admin login failed, trying sales person login...');
      }

      // Try sales person login
      try {
        const salesResponse = await salesPersonAuthService.login(email, password);
        if (salesResponse.success) {
          const { token: authToken, salesPerson } = salesResponse;
          
          // Store sales person data
          localStorage.setItem('sales_token', authToken);
          localStorage.setItem('sales_person', JSON.stringify(salesPerson));
          
          // Update state
          setToken(authToken);
          setUser(salesPerson);
          setUserType('sales_person');
          setIsAuthenticated(true);
          
          return { success: true, userType: 'sales_person' };
        }
      } catch (salesError) {
        console.log('Sales person login also failed');
      }

      // Both failed
      throw new Error('Email ou mot de passe incorrect');
      
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
        setUserType('admin');
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

  // ✅ ENHANCED: Clear all auth data
  const logout = () => {
    // Clear admin data
    authService.logout();
    // Clear sales person data
    salesPersonAuthService.logout();
    
    setUser(null);
    setToken(null);
    setUserType(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    
    // Update appropriate localStorage
    if (userType === 'admin') {
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    } else if (userType === 'sales_person') {
      localStorage.setItem('sales_person', JSON.stringify(updatedUser));
    }
  };

  // ✅ ENHANCED: Permission checking based on user type
  const hasPermission = (permission) => {
    if (!user) return false;
    
    if (userType === 'admin') {
      if (!user.permissions) return false;
      // CEO has all permissions
      if (user.role === 'ceo') return true;
      return user.permissions[permission] === true;
    }
    
    if (userType === 'sales_person') {
      // Sales people have basic permissions
      const salesPermissions = {
        canRegisterUsers: true,
        canViewOwnData: true,
        canEditProfile: true
      };
      return salesPermissions[permission] === true;
    }
    
    return false;
  };

  const canManage = (entityType, entityId = null) => {
    if (!user) return false;
    
    // Only admins can manage entities
    if (userType !== 'admin') return false;
    
    // CEO peut tout gérer
    if (user.role === 'ceo') return true;
    
    // Vérifier les permissions de gestion spécifiques
    if (!user.managementScope) return false;
    
    if (entityId) {
      return user.managementScope[entityType]?.includes(entityId);
    }
    
    return user.managementScope[entityType]?.length > 0;
  };

  // ✅ NEW: Check if current user is admin
  const isAdmin = () => userType === 'admin';
  
  // ✅ NEW: Check if current user is sales person
  const isSalesPerson = () => userType === 'sales_person';
  
  // ✅ NEW: Get user role (works for both types)
  const getUserRole = () => {
    if (userType === 'admin') return user?.role;
    if (userType === 'sales_person') return 'sales_person';
    return null;
  };

  const refreshToken = async () => {
    try {
      if (userType === 'admin') {
        // Admin token refresh logic
        console.log('Admin token refresh non implémenté');
      } else if (userType === 'sales_person') {
        // Sales person token refresh logic
        console.log('Sales person token refresh non implémenté');
      }
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
    userType, // ✅ NEW
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    
    // Utilitaires
    hasPermission,
    canManage,
    isAdmin, // ✅ NEW
    isSalesPerson, // ✅ NEW
    getUserRole // ✅ NEW
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the context for direct use if needed
export { AuthContext };
