// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import {
  LoginPage,
  AdminDashboard,
  SalesPeople,
  Commissions,
  Analytics,
  Settings,
  SalesDashboard,
  RegisterCustomer,
  MyCustomers,
  MyEarnings,
  Profile,
} from "../pages";

const AppRoutes = () => {
  const { isAuthenticated, userType } = useAuth();
  console.log("AppRoutes render:", { isAuthenticated, userType });
  console.log("Components check:", {
    LoginPage: typeof LoginPage,
    AdminDashboard: typeof AdminDashboard,
    SalesPeople: typeof SalesPeople,
    Commissions: typeof Commissions,
    Analytics: typeof Analytics,
    Settings: typeof Settings,
    SalesDashboard: typeof SalesDashboard,
    RegisterCustomer: typeof RegisterCustomer,
    MyCustomers: typeof MyCustomers,
    MyEarnings: typeof MyEarnings,
    Profile: typeof Profile,
  });

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={userType === "admin" ? "/admin" : "/sales"} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sales-people"
        element={
          <ProtectedRoute requiredRole="admin">
            <SalesPeople />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/commissions"
        element={
          <ProtectedRoute requiredRole="admin">
            <Commissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Sales Routes */}
      <Route
        path="/sales"
        element={
          <ProtectedRoute requiredRole="sales">
            <SalesDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/register"
        element={
          <ProtectedRoute requiredRole="sales">
            <RegisterCustomer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/customers"
        element={
          <ProtectedRoute requiredRole="sales">
            <MyCustomers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/earnings"
        element={
          <ProtectedRoute requiredRole="sales">
            <MyEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/profile"
        element={
          <ProtectedRoute requiredRole="sales">
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Default Redirects */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={userType === "admin" ? "/admin" : "/sales"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 - Not Found */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-400">404</h1>
              <p className="text-xl text-gray-600 mt-4">Page not found</p>
              <a
                href={
                  isAuthenticated
                    ? userType === "admin"
                      ? "/admin"
                      : "/sales"
                    : "/login"
                }
                className="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
