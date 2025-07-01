import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  TrendingUp, 
  UserCheck,
  Calendar,
  Award
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesPersonAuthService } from '../../services/sales-person-auth.service';
import { apiHelpers } from '../../services/api';
import StatCard from '../Dashboard/StatCard';
import LoadingSpinner, { SectionSpinner } from '../Commons/LoadingSpinner';
import { formatNumber } from '../../utils/helpers';

const SalesDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await salesPersonAuthService.getDashboard();
      
      if (response.success) {
        setDashboardData(response.dashboard);
      } else {
        setError(response.message || 'Erreur lors du chargement du tableau de bord');
      }
    } catch (error) {
      console.error('Erreur dashboard commercial:', error);
      setError(apiHelpers.formatError(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SectionSpinner text="Chargement de votre tableau de bord..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Bonjour, {user?.firstName} {user?.lastName}! 👋
            </h2>
            <p className="text-green-100">
              ID Commercial: {user?.salesId} • Territoire: {user?.territory}
            </p>
            {user?.teamName && (
              <p className="text-green-100 text-sm">
                Équipe: {user.teamName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-green-100">Dernière connexion</p>
            <p className="text-lg font-semibold">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Première connexion'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Mes Inscriptions"
          value={formatNumber(dashboardData?.stats?.totalRegistrations || 0, 0)}
          icon={Users}
          color="blue"
          subtitle="Total enregistré"
        />
        <StatCard
          title="Clients Payants"
          value={formatNumber(dashboardData?.stats?.totalPaidRegistrations || 0, 0)}
          icon={UserCheck}
          color="green"
          subtitle="Ayant effectué un paiement"
        />
        <StatCard
          title="Performance"
          value={`${dashboardData?.performance?.weekly?.achievementPercentage || 0}%`}
          icon={Target}
          color="purple"
          subtitle="Objectif hebdomadaire"
        />
      </div>

      {/* Performance Overview */}
      {dashboardData?.performance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Weekly Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Performance Hebdomadaire
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Inscriptions</span>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {dashboardData.performance.weekly?.registrations || 0}
                  </span>
                  {dashboardData.performance.weekly?.target > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      / {dashboardData.performance.weekly.target}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              {dashboardData.performance.weekly?.target > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Progression</span>
                    <span className="text-xs text-gray-500">
                      {dashboardData.performance.weekly.achievementPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(dashboardData.performance.weekly.achievementPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-green-600" />
              Performance Mensuelle
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Inscriptions</span>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {dashboardData.performance.monthly?.registrations || 0}
                  </span>
                  {dashboardData.performance.monthly?.target > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      / {dashboardData.performance.monthly.target}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              {dashboardData.performance.monthly?.target > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Progression</span>
                    <span className="text-xs text-gray-500">
                      {dashboardData.performance.monthly.achievementPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(dashboardData.performance.monthly.achievementPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Users */}
        {dashboardData?.myUsers && dashboardData.myUsers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Utilisateurs Récents
            </h3>
            
            <div className="space-y-4">
              {dashboardData.myUsers.slice(0, 5).map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {user.hasPayment && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Payant
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Inscrit
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
                Voir tous mes utilisateurs →
              </button>
            </div>
          </div>
        )}

        {/* Recent Achievements */}
        {dashboardData?.recentCommissions && dashboardData.recentCommissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Réussites Récentes
            </h3>
            
            <div className="space-y-4">
              {dashboardData.recentCommissions.slice(0, 5).map((commission) => (
                <div key={commission._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {commission.userId?.firstName} {commission.userId?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(commission.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ✓ Réussite
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {commission.status === 'confirmed' ? 'Confirmée' : 
                       commission.status === 'paid_out' ? 'Validée' : 'En attente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-sm text-green-600 hover:text-green-800 dark:text-green-400 font-medium">
                Voir toutes mes réussites →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Performance Trend */}
      {dashboardData?.performanceTrend && dashboardData.performanceTrend.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            Tendance des Performances (30 derniers jours)
          </h3>
          
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                Graphique des performances
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Total sur la période: {dashboardData.performanceTrend.reduce((sum, day) => sum + (day.registrations || 0), 0)} inscriptions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Actions Rapides
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '#register-user'}
            className="p-4 text-left bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-colors"
          >
            <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Inscrire un Client
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Enregistrer un nouveau utilisateur
            </p>
          </button>
          
          <button 
            onClick={() => window.location.href = '#my-users'}
            className="p-4 text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
          >
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Mes Utilisateurs
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Gérer mes clients inscrits
            </p>
          </button>
          
          <button 
            onClick={() => window.location.href = '#my-performance'}
            className="p-4 text-left bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors"
          >
            <Target className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
            <h4 className="font-medium text-purple-800 dark:text-purple-200">
              Ma Performance
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              Voir mes objectifs et résultats
            </p>
          </button>
        </div>
      </div> */}

      {/* Manager Info */}
      {user?.manager && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Mon Manager
          </h3>
          <p className="text-blue-700 dark:text-blue-300">
            {user.manager.name} • {user.manager.role}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Pour toute question, n'hésitez pas à contacter votre manager.
          </p>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;