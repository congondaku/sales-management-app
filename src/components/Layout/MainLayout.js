import React, { useState } from 'react';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

// Import all page components
import Dashboard from '../Dashboard/Dashboard';
import SalesDashboard from '../Sales/SalesDashboard';
import SalesPeoplePage from '../SalesPeople/SalesPeoplePage';
import CommissionsPage from '../Commissions/CommissionsPage';
import AnalyticsPage from '../Analytics/AnalyticsPage';
import UsersPage from '../Users/UsersPage';
import PermissionsPage from '../Permissions/PermissionsPage';
import SettingsPage from '../Settings/SettingsPage';
import AdminManagementPage from '../Admin/AdminManagementPage';

// Sales person specific pages
import MyUsers from '../Sales/MyUsers';
import MyCommissions from '../Sales/MyCommissions';
import MyPerformance from '../Sales/MyPerformance';
import RegisterUser from '../Sales/RegisterUser';
import SalesProfile from '../Sales/SalesProfile';

// ✅ NEW: Organization components
import OrganizationChart from '../Organization/OrganizationChart';

const MainLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { isAdmin, isSalesPerson } = useAuth();

  // ✅ ENHANCED: Route handler for both admin and sales person pages
  const renderCurrentPage = () => {
    // ✅ NEW: Organization chart available to both admin and sales people
    if (currentPage === 'organization') {
      return <OrganizationChart />;
    }

    // Admin pages
    if (isAdmin()) {
      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'sales-people':
          return <SalesPeoplePage />;
        // case 'commissions':
        //   return <CommissionsPage />;
        case 'analytics':
          return <AnalyticsPage />;
        case 'users':
          return <UsersPage />;
        case 'permissions':
          return <PermissionsPage />;
        case 'admin-management':
          return <AdminManagementPage />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <Dashboard />;
      }
    }

    // Sales person pages
    if (isSalesPerson()) {
      switch (currentPage) {
        case 'sales-dashboard':
          return <SalesDashboard />;
        case 'my-users':
          return <MyUsers />;
        case 'my-commissions':
          return <MyCommissions />;
        case 'my-performance':
          return <MyPerformance />;
        case 'register-user':
          return <RegisterUser />;
        case 'sales-profile':
          return <SalesProfile />;
        default:
          return <SalesDashboard />;
      }
    }

    // Fallback
    return <div className="p-6">Page non trouvée</div>;
  };

  // ✅ NEW: Get page title based on current page
  const getPageTitle = () => {
    const titles = {
      // Common pages
      'organization': 'Organigramme',
      
      // Admin pages
      'dashboard': 'Tableau de bord',
      'sales-people': 'Commerciaux',
      'commissions': 'Commissions',
      'analytics': 'Analyses',
      'users': 'Utilisateurs',
      'permissions': 'Permissions',
      'admin-management': 'Gestion des Administrateurs',
      'settings': 'Paramètres',
      
      // Sales person pages
      'sales-dashboard': 'Mon Tableau de bord',
      'my-users': 'Mes Utilisateurs',
      'my-commissions': 'Mes Commissions',
      'my-performance': 'Ma Performance',
      'register-user': 'Inscrire Utilisateur',
      'sales-profile': 'Mon Profil'
    };

    return titles[currentPage] || 'Dashboard';
  };

  // ✅ NEW: Check if current page is new feature
  const isNewFeature = () => {
    return currentPage === 'organization';
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        
        {/* Header */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          currentPageTitle={getPageTitle()}
          isNewFeature={isNewFeature()}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            
            {/* ✅ NEW: New feature announcement for organization chart */}
            {isNewFeature() && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    NOUVEAU
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Organigramme Interactif
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Découvrez la nouvelle vue hiérarchique avec gestion des promotions et rétrogradations en temps réel.
                </p>
              </div>
            )}

            {/* Render current page */}
            {renderCurrentPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
