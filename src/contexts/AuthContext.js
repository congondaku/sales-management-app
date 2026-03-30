import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { salesPersonAuthService } from '../services/sales-person-auth.service';

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

  const hasFullAccess = () => {
    if (!user) return false;
    if (userType === 'admin') {
      return user?.role === 'ceo' || user?.role === 'super_admin';
    }
    return false;
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      const adminToken = authService.getToken();
      const adminUser = authService.getCurrentUser();
      const salesToken = salesPersonAuthService.getToken();
      const salesPerson = salesPersonAuthService.getCurrentSalesPerson();

      if (adminToken && adminUser) {
        setToken(adminToken);
        setUser(adminUser);
        setUserType('admin');
        setIsAuthenticated(true);
        console.log('✅ Auth initialized - Admin:', {
          role: adminUser.role,
          email: adminUser.email,
        });
      } else if (salesToken && salesPerson) {
        setToken(salesToken);
        setUser(salesPerson);
        setUserType('sales_person');
        setIsAuthenticated(true);
        console.log('✅ Auth initialized - Sales Person:', {
          salesId: salesPerson.salesId,
          email: salesPerson.email
        });
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

      // Try admin login first
      try {
        const adminResponse = await authService.login(email, password);
        if (adminResponse.success) {
          const { token: authToken, admin } = adminResponse;

          // ── Clear any leftover sales token before saving admin token ──
          localStorage.removeItem('sales_token');
          localStorage.removeItem('sales_person');

          localStorage.setItem('admin_token', authToken);
          localStorage.setItem('admin_user', JSON.stringify(admin));

          setToken(authToken);
          setUser(admin);
          setUserType('admin');
          setIsAuthenticated(true);

          console.log('✅ Admin login successful:', {
            role: admin.role,
            email: admin.email,
            hasFullAccess: admin.role === 'ceo' || admin.role === 'super_admin'
          });

          return { success: true, userType: 'admin' };
        }
      } catch (adminError) {
        console.log('Admin login failed, trying sales person login...');
      }

      // Try sales person login
      try {
        const salesResponse = await salesPersonAuthService.login(email, password);
        if (salesResponse.success) {
          const { token: authToken, salesPerson } = salesResponse;

          // ── Clear any leftover admin token before saving sales token ──
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');

          localStorage.setItem('sales_token', authToken);
          localStorage.setItem('sales_person', JSON.stringify(salesPerson));

          setToken(authToken);
          setUser(salesPerson);
          setUserType('sales_person');
          setIsAuthenticated(true);

          console.log('✅ Sales person login successful:', {
            salesId: salesPerson.salesId,
            email: salesPerson.email
          });

          return { success: true, userType: 'sales_person' };
        }
      } catch (salesError) {
        console.log('Sales person login also failed');
      }

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

        // Clear any leftover sales token
        localStorage.removeItem('sales_token');
        localStorage.removeItem('sales_person');

        localStorage.setItem('admin_token', authToken);
        localStorage.setItem('admin_user', JSON.stringify(admin));

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

  const logout = () => {
    authService.logout();
    salesPersonAuthService.logout();

    setUser(null);
    setToken(null);
    setUserType(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    if (userType === 'admin') {
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    } else if (userType === 'sales_person') {
      localStorage.setItem('sales_person', JSON.stringify(updatedUser));
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;

    if (userType === 'admin') {
      if (user.role === 'ceo' || user.role === 'super_admin') return true;
      if (!user.permissions) return false;
      return user.permissions[permission] === true;
    }

    if (userType === 'sales_person') {
      const salesPermissions = {
        canRegisterUsers: true,
        canViewOwnData: true,
        canEditProfile: true,
        canViewCommissions: true,
        canViewSalesPeople: false,
        canEditSalesPeople: false
      };
      return salesPermissions[permission] === true;
    }

    return false;
  };

  const canManage = (entityType, entityId = null) => {
    if (!user) return false;
    if (userType !== 'admin') return false;
    if (user.role === 'ceo' || user.role === 'super_admin') return true;
    if (!user.managementScope) return false;
    if (entityId) return user.managementScope[entityType]?.includes(entityId);
    return user.managementScope[entityType]?.length > 0;
  };

  const isAdmin = () => userType === 'admin';
  const isSalesPerson = () => userType === 'sales_person';
  const isSuperAdmin = () => {
    if (userType === 'admin') return user?.role === 'ceo' || user?.role === 'super_admin';
    return false;
  };
  const getUserRole = () => {
    if (userType === 'admin') return user?.role;
    if (userType === 'sales_person') return 'sales_person';
    return null;
  };
  const getUserDisplayName = () => {
    if (!user) return 'Utilisateur';
    return `${user.firstName} ${user.lastName}`;
  };
  const getUserRoleDisplay = () => {
    if (userType === 'admin') {
      const role = user?.role;
      if (role === 'ceo') return 'CEO';
      if (role === 'super_admin') return 'Super Admin';
      if (role === 'regional_manager') return 'Directeur Régional';
      if (role === 'sales_manager') return 'Directeur des Ventes';
      if (role === 'team_leader') return 'Chef d\'Équipe';
      return 'Administrateur';
    }
    if (userType === 'sales_person') return 'Commercial';
    return 'Utilisateur';
  };

  const refreshToken = async () => {
    try {
      if (userType === 'admin') {
        console.log('Admin token refresh non implémenté');
      } else if (userType === 'sales_person') {
        console.log('Sales person token refresh non implémenté');
      }
    } catch (error) {
      console.error('Erreur lors du refresh du token:', error);
      logout();
    }
  };

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        const expTime = decoded.exp * 1000;
        const now = Date.now();

        if (expTime < now) {
          console.log('Token expired, logging out...');
          logout();
        }
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    userType,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    hasPermission,
    canManage,
    isAdmin,
    isSalesPerson,
    getUserRole,
    getUserDisplayName,
    getUserRoleDisplay,
    hasFullAccess,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
