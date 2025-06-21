import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Target, 
  TrendingUp, 
  Calendar,
  Edit,
  DollarSign,
  Users,
  Award,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { salesService } from '../../services/sales.service';
import { hasPermission } from '../../utils/permissions';
import { 
  formatFullName, 
  formatPhoneDisplay, 
  formatTerritory,
  formatCommissionAmount,
  formatPerformanceTarget
} from '../../utils/formatters';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import LoadingSpinner from '../Commons/LoadingSpinner';

const SalesPersonDetails = ({ salesPerson, onClose, onEdit }) => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPerformanceData();
    loadUsers();
  }, [salesPerson._id]);

  const loadPerformanceData = async () => {
    try {
      const response = await salesService.getSalesPersonPerformance(salesPerson._id);
      if (response.success) {
        setPerformance(response.performance);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la performance:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await salesService.getSalesPersonUsers(salesPerson._id, { limit: 10 });
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'history', label: 'Historique', icon: Calendar }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">
                {salesPerson.firstName?.[0]}{salesPerson.lastName?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatFullName(salesPerson.firstName, salesPerson.lastName)}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID: {salesPerson.salesId} • {formatTerritory(salesPerson.territory)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasPermission(user, 'canEditSalesPeople') && (
              <button
                onClick={onEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Navigation des onglets */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" text="Chargement des détails..." />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab salesPerson={salesPerson} performance={performance} />
              )}
              {activeTab === 'performance' && (
                <PerformanceTab salesPerson={salesPerson} performance={performance} />
              )}
              {activeTab === 'users' && (
                <UsersTab users={users} />
              )}
              {activeTab === 'history' && (
                <HistoryTab salesPerson={salesPerson} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Onglet Vue d'ensemble
const OverviewTab = ({ salesPerson, performance }) => {
  return (
    <div className="space-y-6">
      
      {/* Informations personnelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Informations Personnelles
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Email:</span>
              <span className="text-sm text-gray-900 dark:text-white">{salesPerson.email}</span>
            </div>
            
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Téléphone:</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {formatPhoneDisplay(salesPerson.phoneNumber)}
              </span>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Territoire:</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {formatTerritory(salesPerson.territory)}
              </span>
            </div>
            
            {salesPerson.teamName && (
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Équipe:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {salesPerson.teamName}
                </span>
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Inscrit:</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {formatDate(salesPerson.createdAt)}
              </span>
            </div>
            
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Statut:</span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                salesPerson.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {salesPerson.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>

        {/* Résumé de performance */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Résumé de Performance
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {salesPerson.totalRegistrations || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total inscriptions
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {salesPerson.totalPaidRegistrations || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Inscriptions payées
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {salesPerson.totalCommissions || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Commissions
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {performance?.conversionRate ? `${performance.conversionRate.toFixed(1)}%` : '0%'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taux de conversion
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Objectifs actuels */}
      {salesPerson.currentTargets && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Objectifs Actuels
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {salesPerson.currentTargets.monthlyRegistrations && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Inscriptions Mensuelles
                </h4>
                {(() => {
                  const target = formatPerformanceTarget(
                    performance?.currentMonth?.registrations || 0,
                    salesPerson.currentTargets.monthlyRegistrations
                  );
                  return (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{target.display}</span>
                        <span>{target.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            target.status === 'achieved' ? 'bg-green-500' :
                            target.status === 'close' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(target.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            
            {salesPerson.currentTargets.monthlyEarnings && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Gains Mensuels
                </h4>
                {(() => {
                  const target = formatPerformanceTarget(
                    performance?.currentMonth?.earnings || 0,
                    salesPerson.currentTargets.monthlyEarnings,
                    'currency'
                  );
                  return (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{target.display}</span>
                        <span>{target.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            target.status === 'achieved' ? 'bg-green-500' :
                            target.status === 'close' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(target.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes du manager */}
      {salesPerson.managerNotes && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notes du Manager
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {salesPerson.managerNotes}
          </p>
        </div>
      )}
    </div>
  );
};

// Onglet Performance
const PerformanceTab = ({ salesPerson, performance }) => {
  return (
    <div className="space-y-6">
      
      {/* Métriques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
          <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCommissionAmount(performance?.totalEarnings || 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total des gains
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
          <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {performance?.totalCustomers || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total clients
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center">
          <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {performance?.conversionRate ? `${performance.conversionRate.toFixed(1)}%` : '0%'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Taux de conversion
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 text-center">
          <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            #{performance?.rank || 'N/A'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Classement équipe
          </div>
        </div>
      </div>

      {/* Performance mensuelle */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance de ce Mois
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Inscriptions
            </h4>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {performance?.currentMonth?.registrations || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {performance?.previousMonth?.registrations && (
                <>
                  {performance.currentMonth.registrations > performance.previousMonth.registrations ? '+' : ''}
                  {((performance.currentMonth.registrations - performance.previousMonth.registrations) / performance.previousMonth.registrations * 100).toFixed(1)}%
                  vs mois dernier
                </>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Gains
            </h4>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCommissionAmount(performance?.currentMonth?.earnings || 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {performance?.previousMonth?.earnings && (
                <>
                  {performance.currentMonth.earnings > performance.previousMonth.earnings ? '+' : ''}
                  {((performance.currentMonth.earnings - performance.previousMonth.earnings) / performance.previousMonth.earnings * 100).toFixed(1)}%
                  vs mois dernier
                </>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Commissions
            </h4>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {performance?.currentMonth?.commissions || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              commissions générées
            </div>
          </div>
        </div>
      </div>

      {/* Historique des performances */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historique des 6 Derniers Mois
        </h3>
        
        {performance?.monthlyHistory ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mois
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Inscriptions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gains
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conversion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {performance.monthlyHistory.map((month, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {month.registrations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCommissionAmount(month.earnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {month.conversionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucun historique disponible
          </div>
        )}
      </div>
    </div>
  );
};

// Onglet Utilisateurs
const UsersTab = ({ users }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Utilisateurs Référés ({users.length})
        </h3>
      </div>

      {users.length > 0 ? (
        <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commandes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-purple-600">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatFullName(user.firstName, user.lastName)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      {user.phoneNumber && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatPhoneDisplay(user.phoneNumber)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.totalOrders || 0} commande{(user.totalOrders || 0) !== 1 ? 's' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun utilisateur référé
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Ce commercial n'a pas encore référé d'utilisateurs.
          </p>
        </div>
      )}
    </div>
  );
};

// Onglet Historique
const HistoryTab = ({ salesPerson }) => {
  const activities = [
    {
      type: 'creation',
      date: salesPerson.createdAt,
      description: 'Commercial créé dans le système'
    },
    {
      type: 'activation',
      date: salesPerson.updatedAt,
      description: 'Profil mis à jour'
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Historique des Activités
      </h3>

      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, activityIdx) => (
            <li key={activityIdx}>
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                      <Calendar className="h-4 w-4 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {formatDate(activity.date)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SalesPersonDetails;
