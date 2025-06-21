import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './components/Layout/MainLayout';
// ✅ NEW: Import sales person layout if you create one
// import SalesPersonLayout from './components/Layout/SalesPersonLayout';
import LoginForm from './components/Auth/LoginForm';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner, { PageSpinner } from './components/Commons/LoadingSpinner';
import { ToastContainer, useToast } from './components/Commons/Toast';

// Composant principal de l'application
const AppContent = () => {
  const { isAuthenticated, loading, userType, isAdmin, isSalesPerson } = useAuth();
  const { toasts, removeToast } = useToast();

  if (loading) {
    return <PageSpinner text="Chargement de l'application..." />;
  }

  // ✅ NEW: Route based on user type
  const renderDashboard = () => {
    if (isAdmin()) {
      // Admin gets full MainLayout with all features
      return <MainLayout />;
    } else if (isSalesPerson()) {
      // Sales person gets simplified layout
      // For now, use MainLayout but you could create SalesPersonLayout
      return <MainLayout />;
    }
    return <LoginForm />;
  };

  return (
    <>
      {isAuthenticated ? renderDashboard() : <LoginForm />}
      
      {/* Container des notifications Toast */}
      <ToastContainer 
        toasts={toasts} 
        position="top-right" 
        onRemove={removeToast} 
      />
    </>
  );
};

// Composant racine avec tous les providers
const App = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <div className="App">
            <AppContent />
          </div>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
