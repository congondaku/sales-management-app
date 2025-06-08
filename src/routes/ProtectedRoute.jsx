import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, userType, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userType !== requiredRole) {
    // Redirect to appropriate dashboard if wrong role
    return <Navigate to={userType === 'admin' ? '/admin' : '/sales'} replace />;
  }

  return children;
};

export default ProtectedRoute;