import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 AuthProvider useEffect running...");

    // Check for existing authentication on app load
    const checkAuth = () => {
      const type = authService.getUserType();
      const token = authService.getToken();
      const userData = localStorage.getItem("userData");

      console.log("🔍 Auth check:", {
        type,
        token: !!token,
        userData: !!userData,
      });
      console.log("🔍 localStorage contents:", {
        adminToken: !!localStorage.getItem("adminToken"),
        salesToken: !!localStorage.getItem("salesToken"),
        userType: localStorage.getItem("userType"),
        userData: localStorage.getItem("userData"),
      });

      // Check if we have userData but no tokens (indicates tokens were cleared by interceptor)
      if (type && userData && !token) {
        console.log(
          "🔧 Tokens missing but userData exists - likely cleared by API interceptor"
        );
        console.log("🚪 Cleaning up inconsistent auth state");

        // Clear everything to force re-login
        authService.logout();
        localStorage.removeItem("userData");
        setUser(null);
        setUserType(null);
      } else if (type && token) {
        console.log("✅ Setting authenticated user");
        setUserType(type);
        setUser({
          type,
          token,
          ...(userData ? JSON.parse(userData) : {}),
        });
      } else {
        console.log("❌ No valid auth found");
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials, type) => {
    try {
      console.log("🔐 Login attempt for:", type);

      let response;

      if (type === "admin") {
        response = await authService.adminLogin(credentials);
      } else {
        response = await authService.salesLogin(credentials);
      }

      console.log("✅ Login successful:", response);

      // Store user data for persistence
      localStorage.setItem("userData", JSON.stringify(response.user));

      setUser(response);
      setUserType(response.type);

      console.log("✅ State updated after login");

      return response;
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("🚪 Logout called");
    authService.logout();
    localStorage.removeItem("userData");
    setUser(null);
    setUserType(null);
  };

  console.log("🔍 AuthProvider render:", {
    user: !!user,
    userType,
    isAuthenticated: !!user && !!userType,
  });

  const value = {
    user,
    userType,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!userType,
    isAdmin: userType === "admin",
    isSales: userType === "sales",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
