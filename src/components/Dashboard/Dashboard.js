import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { analyticsService } from '../../services/analytics.service';
import { hasPermission } from '../../utils/permissions';
import StatCard from './StatCard';
import LoadingSpinner, { SectionSpinner } from '../Commons/LoadingSpinner';
import { formatCurrency, formatNumber } from '../../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user has analytics permission
      if (hasPermission(user, 'canViewAnalytics')) {
        const response = await analyticsService.getAnalyticsOverview(period);

        if (response.success) {
          const analyticsData = response.analytics;

          // Map the backend data to dashboard format
          const dashboardData = {
            salesPeople: analyticsData.overview?.totalSalesPeople || 0,
            totalUsers: analyticsData.overview?.totalUsers || 0,
            totalCommissions: analyticsData.overview?.totalCommissionAmount || 0,
            conversionRate: analyticsData.overview?.conversionRate || 0,

            commissionStats: analyticsData.commissionsByStatus || [],
            topPerformers: analyticsData.topPerformers || [],
            userRegistrationTrend: analyticsData.registrationTrend || [],

            // Trend calculations (placeholder)
            salesPeopleTrend: null,
            usersTrend: null,
            commissionsTrend: null,
            conversionTrend: null,

            hideDetailedEarnings: analyticsData.hideDetailedEarnings || false
          };

          setDashboardData(dashboardData);
        } else {
          setError(response.message || 'Erreur lors du chargement du tableau de bord');
        }
      } else {
        // Load basic dashboard data for users without analytics permission
        await loadBasicDashboardData();
      }
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Load basic dashboard data for users without analytics permission
  const loadBasicDashboardData = async () => {
    try {
      // Create a basic dashboard with limited data
      const basicData = {
        salesPeople: 0,
        totalUsers: 0,
        totalCommissions: 0,
        conversionRate: 0,
        commissionStats: [],
        topPerformers: [],
        userRegistrationTrend: [],
        salesPeopleTrend: null,
        usersTrend: null,
        commissionsTrend: null,
        conversionTrend: null,
        hasLimitedAccess: true
      };

      setDashboardData(basicData);
    } catch (error) {
      console.error('Erreur lors du chargement des données de base:', error);
      setError('Erreur lors du chargement des données de base');
    }
  };

  if (loading) {
    return <SectionSpinner text="Chargement du tableau de bord..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Vue d'ensemble
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {dashboardData?.hasLimitedAccess
              ? "Vue limitée - contactez votre administrateur pour plus de détails"
              : "Résumé des performances de votre équipe de vente"
            }
          </p>
        </div>

        {/* Only show period selector if user has analytics permission */}
        {hasPermission(user, 'canViewAnalytics') && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
        )}
      </div>

      {/* Alert for limited access */}
      {dashboardData?.hasLimitedAccess && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Accès limité au tableau de bord
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Vous n'avez pas la permission "canViewAnalytics". Contactez votre administrateur pour obtenir l'accès complet aux analyses.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Commerciaux Actifs"
          value={dashboardData?.hasLimitedAccess ? "N/A" : formatNumber(dashboardData?.salesPeople || 0, 0)}
          icon={Users}
          color="blue"
          trend={dashboardData?.salesPeopleTrend}
        />
        <StatCard
          title="Utilisateurs Total"
          value={dashboardData?.hasLimitedAccess ? "N/A" : formatNumber(dashboardData?.totalUsers || 0, 0)}
          icon={User}
          color="green"
          trend={dashboardData?.usersTrend}
        />
        <StatCard
          title="Commissions Totales"
          value={dashboardData?.hasLimitedAccess ? "N/A" : formatCurrency(dashboardData?.totalCommissions || 0)}
          icon={DollarSign}
          color="yellow"
          trend={dashboardData?.commissionsTrend}
        />
        <StatCard
          title="Taux de Conversion"
          value={dashboardData?.hasLimitedAccess ? "N/A" : `${formatNumber(dashboardData?.conversionRate || 0, 1)}%`}
          icon={TrendingUp}
          color="purple"
          trend={dashboardData?.conversionTrend}
        />
      </div>

      {/* Only show charts and detailed data if user has analytics permission */}
      {hasPermission(user, 'canViewAnalytics') ? (
        <>
          {/* Graphiques et widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Tendance des inscriptions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tendance des Inscriptions
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {period === 'week' ? '7 derniers jours' :
                    period === 'month' ? '30 derniers jours' :
                      period === 'quarter' ? '3 derniers mois' : 'Cette année'}
                </div>
              </div>

              {dashboardData?.userRegistrationTrend && dashboardData.userRegistrationTrend.length > 0 ? (
                <div className="h-64">
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Graphique des inscriptions</p>
                      <p className="text-sm mt-2">
                        Total sur la période: {dashboardData.userRegistrationTrend.reduce((sum, day) => sum + (day.count || 0), 0)} inscriptions
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
                </div>
              )}
            </div>

            {/* État des commissions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                État des Commissions
              </h3>

              <div className="space-y-4">
                {dashboardData?.commissionStats?.length > 0 ? (
                  dashboardData.commissionStats.map((stat) => (
                    <div key={stat._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${stat._id === 'confirmed' ? 'bg-green-500' :
                          stat._id === 'paid_out' ? 'bg-blue-500' :
                            stat._id === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stat._id === 'confirmed' ? 'Confirmées' :
                            stat._id === 'paid_out' ? 'Payées' :
                              stat._id === 'pending' ? 'En attente' :
                                stat._id === 'cancelled' ? 'Annulées' : stat._id}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {typeof stat.total === 'number' ? formatCurrency(stat.total) : String(stat.total || 'N/A')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {stat.count || 0} commission{(stat.count || 0) > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">Aucune commission trouvée</p>
                  </div>
                )}
              </div>

              {/* Total général */}
              {dashboardData?.commissionStats && dashboardData.commissionStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Général
                    </span>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(
                          dashboardData.commissionStats.reduce((sum, stat) => {
                            return sum + (typeof stat.total === 'number' ? stat.total : 0);
                          }, 0)
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dashboardData.commissionStats.reduce((sum, stat) => sum + (stat.count || 0), 0)} commissions
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top performers */}
          {dashboardData?.topPerformers && dashboardData.topPerformers.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Performers
              </h3>

              <div className="space-y-4">
                {dashboardData.topPerformers.slice(0, 5).map((performer, index) => (
                  <div key={performer.salesPersonId || index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {String(performer.name || 'Nom non disponible')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {performer.salesId ? `${performer.salesId} • ` : ''}{String(performer.territory || 'Territoire non défini')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {typeof performer.totalEarnings === 'number'
                          ? formatCurrency(performer.totalEarnings)
                          : String(performer.totalEarnings || 'N/A')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {performer.totalCommissions || 0} commission{(performer.totalCommissions || 0) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Limited access view */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Fonctionnalités Disponibles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Gestion des Utilisateurs</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {hasPermission(user, 'canViewAllData') ? 'Accès disponible' : 'Accès limité'}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
              <h4 className="font-medium text-green-800 dark:text-green-200">Commissions</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {hasPermission(user, 'canViewCommissions') ? 'Accès disponible' : 'Accès limité'}
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Analyses</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                {hasPermission(user, 'canViewAnalytics') ? 'Accès disponible' : 'Permission requise'}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <User className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Gestion Équipe</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {hasPermission(user, 'canEditSalesPeople') ? 'Accès disponible' : 'Accès limité'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alertes et notifications importantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Alertes système */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informations du Compte
          </h3>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Rôle: {String(user?.role || 'Non défini')}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Permissions actives: {user?.permissions ? Object.values(user.permissions).filter(p => p === true).length : 0}
                </p>
              </div>
            </div>

            {!hasPermission(user, 'canViewAnalytics') && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Accès limité aux analyses
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Contactez votre administrateur pour obtenir la permission "canViewAnalytics"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions Rapides
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {hasPermission(user, 'canCreateSalesPeople') && (
              <button className="p-3 text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Créer un nouveau commercial
                </p>
              </button>
            )}

            {hasPermission(user, 'canProcessPayouts') && (
              <button className="p-3 text-left bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-colors">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Traiter les commissions
                </p>
              </button>
            )}

            {hasPermission(user, 'canViewAnalytics') && (
              <button className="p-3 text-left bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Voir les analyses détaillées
                </p>
              </button>
            )}

            <button className="p-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Consulter mon profil
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
