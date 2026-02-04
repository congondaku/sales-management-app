import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

// Admin Components
import Dashboard from '../Dashboard/Dashboard';
import SalesPeoplePage from '../SalesPeople/SalesPeoplePage';
import CommissionsPage from '../Commissions/CommissionsPage';
import AnalyticsPage from '../Analytics/AnalyticsPage';
import UsersPage from '../Users/UsersPage';
import PermissionsPage from '../Permissions/PermissionsPage';
import SettingsPage from '../Settings/SettingsPage';

// Sales Person Components (you'll need to create these)
import SalesDashboard from '../Sales/SalesDashboard';
import MyUsers from '../Sales/MyUsers';
import MyCommissions from '../Sales/MyCommissions';
import MyPerformance from '../Sales/MyPerformance';
import RegisterUser from '../Sales/RegisterUser';
import SalesProfile from '../Sales/SalesProfile.js';
import Communes from '../Sales/Communes.js'
import { ListingsManagement } from '@congondaku/listings-management';



const MainLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userType, isAdmin, isSalesPerson } = useAuth();

  // ✅ ENHANCED: Different page configurations based on user type
  const getPageConfigurations = () => {
    if (isAdmin()) {
      return {
        dashboard: {
          title: 'Tableau de Bord',
          component: Dashboard
        },
        communes: {
          title: 'Communes',
          component: Communes
        },
        annoces: {
          title: 'Annoces',
          component: ListingsManagement
        },
        'sales-people': {
          title: 'Gestion des Commerciaux',
          component: SalesPeoplePage
        },
        commissions: {
          title: 'Gestion des Commissions',
          component: CommissionsPage
        },
        analytics: {
          title: 'Analyses de Performance',
          component: AnalyticsPage
        },
        users: {
          title: 'Gestion des Utilisateurs',
          component: UsersPage
        },
        permissions: {
          title: 'Gestion des Permissions',
          component: PermissionsPage
        },
        settings: {
          title: 'Paramètres',
          component: SettingsPage
        }
      };
    } else if (isSalesPerson()) {
      return {
        'sales-dashboard': {
          title: 'Mon Tableau de Bord',
          component: SalesDashboard
        },
        'communes': {
          title: 'Communes',
          component: Communes
        },
        'annoces': {
          title: 'Annoces',
          component: ListingsManagement
        },
        'my-users': {
          title: 'Mes Utilisateurs',
          component: MyUsers
        },
        'my-commissions': {
          title: 'Mes Commissions',
          component: MyCommissions
        },
        'my-performance': {
          title: 'Ma Performance',
          component: MyPerformance
        },
        'register-user': {
          title: 'Inscrire un Utilisateur',
          component: RegisterUser
        },
        'sales-profile': {
          title: 'Mon Profil',
          component: SalesProfile
        }
      };
    }
    return {};
  };

  const pages = getPageConfigurations();

  // ✅ ENHANCED: Set default page based on user type
  React.useEffect(() => {
    if (isSalesPerson() && currentPage === 'dashboard') {
      setCurrentPage('sales-dashboard');
    } else if (isAdmin() && currentPage === 'sales-dashboard') {
      setCurrentPage('dashboard');
    }
  }, [userType, isAdmin, isSalesPerson, currentPage]);

  // ✅ ENHANCED: Fallback handling
  const getCurrentPageConfig = () => {
    const pageConfig = pages[currentPage];

    if (pageConfig) {
      return pageConfig;
    }

    // Fallback to appropriate default based on user type
    // if (isSalesPerson()) {
    //   return pages['sales-dashboard'] || { title: 'Dashboard', component: SalesDashboard };
    // } else if (isAdmin()) {
    //   return pages['dashboard'] || { title: 'Dashboard', component: Dashboard };
    // }

    // Ultimate fallback
    return {
      title: 'Page non trouvée',
      component: () => (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Page non trouvée</h2>
            <p className="text-gray-600">Cette page n'existe pas ou vous n'y avez pas accès.</p>
          </div>
        </div>
      )
    };
  };

  const currentPageConfig = getCurrentPageConfig();
  const PageComponent = currentPageConfig.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Contenu principal */}
      <div className="lg:ml-64">
        {/* Header */}
        <Header
          title={currentPageConfig.title}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Contenu de la page */}
        <main className="p-6">
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Chargement...</p>
                </div>
              </div>
            }
          >
            <PageComponent />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
