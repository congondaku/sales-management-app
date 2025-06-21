// src/components/Sales/MyPerformance.js
import React, { useState, useEffect } from 'react';
import { 
  Target, 
  TrendingUp, 
  Award, 
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesPersonAuthService } from '../../services/sales-person-auth.service';
import LoadingSpinner, { SectionSpinner } from '../Commons/LoadingSpinner';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import StatCard from '../Dashboard/StatCard';

const MyPerformance = () => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadPerformance();
  }, [selectedPeriod]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await salesPersonAuthService.getPerformance(selectedPeriod);
      
      if (response.success) {
        setPerformance(response.performance);
      } else {
        setError(response.message || 'Erreur lors du chargement des performances');
      }
    } catch (error) {
      console.error('Erreur performance:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAchievementIcon = (percentage) => {
    if (percentage >= 100) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (percentage >= 75) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <Clock className="h-5 w-5 text-red-600" />;
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return <SectionSpinner text="Chargement de vos performances..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPerformance}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ma Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Objectifs, résultats et analyse de performance
          </p>
        </div>
        
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
        </select>
      </div>

      {/* Sales Person Info */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">
              {user?.firstName} {user?.lastName}
            </h3>
            <div className="space-y-1">
              <p className="text-green-100">ID: {user?.salesId}</p>
              <p className="text-green-100">Territoire: {user?.territory}</p>
              {user?.teamName && (
                <p className="text-green-100">Équipe: {user.teamName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-lg p-4">
              <Award className="h-8 w-8 mb-2" />
              <p className="text-sm">Commercial</p>
              <p className="text-lg font-bold">Actif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Inscriptions"
          value={formatNumber(user?.totalRegistrations || 0, 0)}
          icon={Users}
          color="blue"
          subtitle="Depuis le début"
        />
        <StatCard
          title="Clients Payants"
          value={formatNumber(user?.totalPaidRegistrations || 0, 0)}
          icon={CheckCircle}
          color="green"
          subtitle="Ayant effectué un paiement"
        />
        <StatCard
          title="Total Gains"
          value={formatCurrency(user?.totalEarnings || 0)}
          icon={DollarSign}
          color="yellow"
          subtitle="Commissions totales"
        />
        <StatCard
          title="Taux de Conversion"
          value={user?.totalRegistrations > 0 
            ? `${Math.round((user.totalPaidRegistrations / user.totalRegistrations) * 100)}%`
            : '0%'}
          icon={TrendingUp}
          color="purple"
          subtitle="Inscription → Paiement"
        />
      </div>

      {/* Performance for Selected Period */}
      {performance && (
        <>
          {/* Weekly Performance */}
          {performance.weekly && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Performance Hebdomadaire
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Registrations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Inscriptions</h4>
                    {getAchievementIcon(performance.weekly.achievementPercentage)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {performance.weekly.registrations}
                      </span>
                      {performance.weekly.target > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / {performance.weekly.target}
                        </span>
                      )}
                    </div>
                    
                    {performance.weekly.target > 0 && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(performance.weekly.achievementPercentage)}`}
                            style={{ width: `${Math.min(performance.weekly.achievementPercentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${getAchievementColor(performance.weekly.achievementPercentage)}`}>
                            {performance.weekly.achievementPercentage}% de l'objectif
                          </span>
                          {performance.weekly.overAchievement > 0 && (
                            <span className="text-green-600 font-medium">
                              +{performance.weekly.overAchievement} bonus
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Earnings */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Gains</h4>
                    {getAchievementIcon(performance.weekly.earningsAchievementPercentage)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(performance.weekly.earnings)}
                      </span>
                      {performance.weekly.earningsTarget > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / {formatCurrency(performance.weekly.earningsTarget)}
                        </span>
                      )}
                    </div>
                    
                    {performance.weekly.earningsTarget > 0 && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(performance.weekly.earningsAchievementPercentage)}`}
                            style={{ width: `${Math.min(performance.weekly.earningsAchievementPercentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${getAchievementColor(performance.weekly.earningsAchievementPercentage)}`}>
                            {performance.weekly.earningsAchievementPercentage}% de l'objectif
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-6 flex justify-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                  performance.weekly.status === 'achieved' 
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {performance.weekly.status === 'achieved' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  <span>
                    {performance.weekly.status === 'achieved' 
                      ? 'Objectif atteint !' 
                      : 'En cours...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Performance */}
          {performance.monthly && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600" />
                Performance Mensuelle
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Registrations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Inscriptions</h4>
                    {getAchievementIcon(performance.monthly.achievementPercentage)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {performance.monthly.registrations}
                      </span>
                      {performance.monthly.target > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / {performance.monthly.target}
                        </span>
                      )}
                    </div>
                    
                    {performance.monthly.target > 0 && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(performance.monthly.achievementPercentage)}`}
                            style={{ width: `${Math.min(performance.monthly.achievementPercentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${getAchievementColor(performance.monthly.achievementPercentage)}`}>
                            {performance.monthly.achievementPercentage}% de l'objectif
                          </span>
                          {performance.monthly.overAchievement > 0 && (
                            <span className="text-green-600 font-medium">
                              +{performance.monthly.overAchievement} bonus
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Earnings */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Gains</h4>
                    {getAchievementIcon(performance.monthly.earningsAchievementPercentage)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(performance.monthly.earnings)}
                      </span>
                      {performance.monthly.earningsTarget > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / {formatCurrency(performance.monthly.earningsTarget)}
                        </span>
                      )}
                    </div>
                    
                    {performance.monthly.earningsTarget > 0 && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(performance.monthly.earningsAchievementPercentage)}`}
                            style={{ width: `${Math.min(performance.monthly.earningsAchievementPercentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${getAchievementColor(performance.monthly.earningsAchievementPercentage)}`}>
                            {performance.monthly.earningsAchievementPercentage}% de l'objectif
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-6 flex justify-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                  performance.monthly.status === 'achieved' 
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {performance.monthly.status === 'achieved' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  <span>
                    {performance.monthly.status === 'achieved' 
                      ? 'Objectif mensuel atteint !' 
                      : 'En cours...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Performance Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Conseils Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-blue-700 dark:text-blue-300">Pour améliorer vos inscriptions:</h4>
            <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Contactez vos prospects régulièrement</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Utilisez les réseaux sociaux pour élargir votre réseau</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Organisez des événements de présentation</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-blue-700 dark:text-blue-300">Pour augmenter les conversions:</h4>
            <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Suivez vos clients après inscription</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Expliquez clairement les avantages</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Proposez des offres limitées dans le temps</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Historical Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
          Évolution Historique
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user?.totalRegistrations || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Inscriptions
            </div>
            <div className="text-xs text-green-600 mt-1">
              Depuis le début
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCurrency(user?.totalEarnings || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Gains
            </div>
            <div className="text-xs text-green-600 mt-1">
              Commissions cumulées
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user?.totalRegistrations > 0 
                ? Math.round((user.totalPaidRegistrations / user.totalRegistrations) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Taux Conversion Moyen
            </div>
            <div className="text-xs text-green-600 mt-1">
              Performance globale
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white p-6">
        <div className="text-center">
          <Award className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Continuez comme ça !</h3>
          <p className="text-purple-100 mb-4">
            Votre travail acharné porte ses fruits. Chaque inscription compte et vous rapproche de vos objectifs.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">{user?.totalRegistrations || 0}</div>
              <div className="text-purple-200">Inscriptions</div>
            </div>
            <div className="w-px h-8 bg-purple-300"></div>
            <div className="text-center">
              <div className="font-bold text-lg">{user?.totalPaidRegistrations || 0}</div>
              <div className="text-purple-200">Conversions</div>
            </div>
            <div className="w-px h-8 bg-purple-300"></div>
            <div className="text-center">
              <div className="font-bold text-lg">{formatCurrency(user?.totalEarnings || 0)}</div>
              <div className="text-purple-200">Gains</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPerformance;
