import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { analyticsService } from '../../services/analytics.service';
import StatCard from '../Dashboard/StatCard';
import { SectionSpinner } from '../Commons/LoadingSpinner';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/helpers';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getAnalyticsOverview(period);
      
      if (response.success) {
        setAnalyticsData(response.analytics);
      } else {
        setError(response.message || 'Erreur lors du chargement des analyses');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour exporter en CSV
  const exportToCSV = () => {
    if (!analyticsData) return;

    setExporting(true);
    
    try {
      // Préparer les données pour l'export
      const csvData = [];
      
      // En-tête du rapport
      csvData.push(['Rapport d\'Analyses - ' + getPeriodLabel(period)]);
      csvData.push(['Généré le:', new Date().toLocaleDateString('fr-FR')]);
      csvData.push(['Utilisateur:', user?.firstName + ' ' + user?.lastName]);
      csvData.push([]); // Ligne vide

      // Métriques principales
      csvData.push(['MÉTRIQUES PRINCIPALES']);
      csvData.push(['Métrique', 'Valeur']);
      csvData.push(['Revenus Totaux', formatCurrency(analyticsData.totalRevenue || 0)]);
      csvData.push(['Nouveaux Clients', formatNumber(analyticsData.newCustomers || 0, 0)]);
      csvData.push(['Taux de Conversion', formatPercentage(analyticsData.conversionRate || 0)]);
      csvData.push(['Commissions Payées', formatCurrency(analyticsData.totalCommissions || 0)]);
      csvData.push([]); // Ligne vide

      // Performance par commercial
      if (analyticsData.salesPerformance && analyticsData.salesPerformance.length > 0) {
        csvData.push(['PERFORMANCE PAR COMMERCIAL']);
        csvData.push(['Rang', 'Nom', 'Territoire', 'Revenus', 'Clients']);
        analyticsData.salesPerformance.forEach((performer, index) => {
          csvData.push([
            index + 1,
            performer.name,
            performer.territory,
            formatCurrency(performer.revenue),
            performer.customers
          ]);
        });
        csvData.push([]); // Ligne vide
      }

      // Performance par territoire
      if (analyticsData.territoryPerformance && analyticsData.territoryPerformance.length > 0) {
        csvData.push(['PERFORMANCE PAR TERRITOIRE']);
        csvData.push(['Territoire', 'Commerciaux', 'Clients', 'Revenus', 'Taux de Conversion']);
        analyticsData.territoryPerformance.forEach((territory) => {
          csvData.push([
            territory.name,
            territory.salesPeople,
            territory.customers,
            formatCurrency(territory.revenue),
            formatPercentage(territory.conversionRate)
          ]);
        });
        csvData.push([]); // Ligne vide
      }

      // Croissance mensuelle
      if (analyticsData.monthlyGrowth) {
        csvData.push(['CROISSANCE MENSUELLE']);
        csvData.push(['Métrique', 'Croissance']);
        csvData.push(['Revenus', formatPercentage(analyticsData.monthlyGrowth.revenue || 0)]);
        csvData.push(['Clients', formatPercentage(analyticsData.monthlyGrowth.customers || 0)]);
        csvData.push(['Commissions', formatPercentage(analyticsData.monthlyGrowth.commissions || 0)]);
        csvData.push([]); // Ligne vide
      }

      // Résumé des commissions
      if (analyticsData.commissionsSummary) {
        csvData.push(['RÉSUMÉ DES COMMISSIONS']);
        csvData.push(['Statut', 'Montant']);
        csvData.push(['En attente', formatCurrency(analyticsData.commissionsSummary.pending || 0)]);
        csvData.push(['Confirmées', formatCurrency(analyticsData.commissionsSummary.confirmed || 0)]);
        csvData.push(['Payées', formatCurrency(analyticsData.commissionsSummary.paid || 0)]);
        csvData.push(['Total', formatCurrency(
          (analyticsData.commissionsSummary.pending || 0) +
          (analyticsData.commissionsSummary.confirmed || 0) +
          (analyticsData.commissionsSummary.paid || 0)
        )]);
      }

      // Convertir en CSV
      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // Télécharger le fichier
      downloadFile(csvContent, `analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      alert('Erreur lors de l\'export CSV');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // Fonction pour exporter en JSON
  const exportToJSON = () => {
    if (!analyticsData) return;

    setExporting(true);
    
    try {
      const exportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          period: period,
          periodLabel: getPeriodLabel(period),
          generatedBy: {
            id: user?._id,
            name: user?.firstName + ' ' + user?.lastName,
            role: user?.role
          }
        },
        analytics: analyticsData,
        summary: {
          totalRevenue: analyticsData.totalRevenue || 0,
          newCustomers: analyticsData.newCustomers || 0,
          conversionRate: analyticsData.conversionRate || 0,
          totalCommissions: analyticsData.totalCommissions || 0
        }
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      downloadFile(jsonContent, `analytics_${period}_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      alert('Erreur lors de l\'export JSON');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // Fonction pour exporter un rapport PDF simple (format texte)
  const exportToPDF = () => {
    if (!analyticsData) return;

    setExporting(true);
    
    try {
      let reportContent = `RAPPORT D'ANALYSES - ${getPeriodLabel(period).toUpperCase()}\n`;
      reportContent += `${'='.repeat(60)}\n\n`;
      reportContent += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n`;
      reportContent += `Utilisateur: ${user?.firstName} ${user?.lastName}\n`;
      reportContent += `Période: ${getPeriodLabel(period)}\n\n`;

      // Métriques principales
      reportContent += `MÉTRIQUES PRINCIPALES\n`;
      reportContent += `${'-'.repeat(30)}\n`;
      reportContent += `Revenus Totaux: ${formatCurrency(analyticsData.totalRevenue || 0)}\n`;
      reportContent += `Nouveaux Clients: ${formatNumber(analyticsData.newCustomers || 0, 0)}\n`;
      reportContent += `Taux de Conversion: ${formatPercentage(analyticsData.conversionRate || 0)}\n`;
      reportContent += `Commissions Payées: ${formatCurrency(analyticsData.totalCommissions || 0)}\n\n`;

      // Top performers
      if (analyticsData.salesPerformance && analyticsData.salesPerformance.length > 0) {
        reportContent += `TOP PERFORMERS\n`;
        reportContent += `${'-'.repeat(30)}\n`;
        analyticsData.salesPerformance.slice(0, 5).forEach((performer, index) => {
          reportContent += `${index + 1}. ${performer.name} (${performer.territory})\n`;
          reportContent += `   Revenus: ${formatCurrency(performer.revenue)} | Clients: ${performer.customers}\n`;
        });
        reportContent += '\n';
      }

      // Croissance
      if (analyticsData.monthlyGrowth) {
        reportContent += `CROISSANCE MENSUELLE\n`;
        reportContent += `${'-'.repeat(30)}\n`;
        reportContent += `Revenus: ${formatPercentage(analyticsData.monthlyGrowth.revenue || 0)}\n`;
        reportContent += `Clients: ${formatPercentage(analyticsData.monthlyGrowth.customers || 0)}\n`;
        reportContent += `Commissions: ${formatPercentage(analyticsData.monthlyGrowth.commissions || 0)}\n\n`;
      }

      downloadFile(reportContent, `rapport_analytics_${period}_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export du rapport');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // Fonction utilitaire pour télécharger un fichier
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Fonction utilitaire pour obtenir le label de la période
  const getPeriodLabel = (period) => {
    const labels = {
      week: 'Cette semaine',
      month: 'Ce mois',
      quarter: 'Ce trimestre',
      year: 'Cette année'
    };
    return labels[period] || period;
  };

  if (loading) {
    return <SectionSpinner text="Chargement des analyses..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
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
      {/* En-tête avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Analyses de Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez les métriques clés de votre équipe de vente
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
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
          
          {/* Menu d'export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting || !analyticsData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? 'Export...' : 'Exporter'}</span>
            </button>

            {/* Menu déroulant d'export */}
            {showExportMenu && (
              <>
                {/* Overlay pour fermer le menu */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={exportToCSV}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={exportToJSON}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Export JSON</span>
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Rapport texte</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenus Totaux"
          value={formatCurrency(analyticsData?.totalRevenue || 0)}
          icon={DollarSign}
          color="green"
          trend={analyticsData?.revenueTrend}
        />
        <StatCard
          title="Nouveaux Clients"
          value={formatNumber(analyticsData?.newCustomers || 0, 0)}
          icon={Users}
          color="blue"
          trend={analyticsData?.customersTrend}
        />
        <StatCard
          title="Taux de Conversion"
          value={formatPercentage(analyticsData?.conversionRate || 0)}
          icon={TrendingUp}
          color="purple"
          trend={analyticsData?.conversionTrend}
        />
        <StatCard
          title="Commissions Payées"
          value={formatCurrency(analyticsData?.totalCommissions || 0)}
          icon={BarChart3}
          color="yellow"
          trend={analyticsData?.commissionsTrend}
        />
      </div>

      {/* Graphiques et analyses détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Performance par commercial */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance par Commercial
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          
          {analyticsData?.salesPerformance ? (
            <div className="space-y-4">
              {analyticsData.salesPerformance.slice(0, 5).map((performer, index) => (
                <div key={performer.salesPersonId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {performer.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {performer.territory}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(performer.revenue)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {performer.customers} clients
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
            </div>
          )}
        </div>

        {/* Évolution des ventes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Évolution des Ventes
            </h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">Graphique des ventes</p>
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-500">
                {period === 'week' ? '7 derniers jours' : 
                 period === 'month' ? '30 derniers jours' :
                 period === 'quarter' ? '3 derniers mois' : 'Cette année'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analyses par territoire */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance par Territoire
        </h3>
        
        {analyticsData?.territoryPerformance ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Territoire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commerciaux
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Revenus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Taux de conversion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {analyticsData.territoryPerformance.map((territory, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {territory.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {territory.salesPeople}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {territory.customers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(territory.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatPercentage(territory.conversionRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500 dark:text-gray-400">Aucune donnée de territoire disponible</p>
          </div>
        )}
      </div>

      {/* Métriques additionnelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Croissance mensuelle */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Croissance Mensuelle
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Revenus</span>
              <span className={`text-sm font-medium ${
                (analyticsData?.monthlyGrowth?.revenue || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(analyticsData?.monthlyGrowth?.revenue || 0) >= 0 ? '+' : ''}
                {formatPercentage(analyticsData?.monthlyGrowth?.revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Clients</span>
              <span className={`text-sm font-medium ${
                (analyticsData?.monthlyGrowth?.customers || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(analyticsData?.monthlyGrowth?.customers || 0) >= 0 ? '+' : ''}
                {formatPercentage(analyticsData?.monthlyGrowth?.customers || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Commissions</span>
              <span className={`text-sm font-medium ${
                (analyticsData?.monthlyGrowth?.commissions || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(analyticsData?.monthlyGrowth?.commissions || 0) >= 0 ? '+' : ''}
                {formatPercentage(analyticsData?.monthlyGrowth?.commissions || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Objectifs vs Réalisations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Objectifs vs Réalisations
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Revenus</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatPercentage((analyticsData?.targetCompletion?.revenue || 0) * 100)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((analyticsData?.targetCompletion?.revenue || 0) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Clients</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatPercentage((analyticsData?.targetCompletion?.customers || 0) * 100)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((analyticsData?.targetCompletion?.customers || 0) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Résumé des commissions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Résumé des Commissions
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">En attente</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(analyticsData?.commissionsSummary?.pending || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Confirmées</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(analyticsData?.commissionsSummary?.confirmed || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Payées</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(analyticsData?.commissionsSummary?.paid || 0)}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(
                    (analyticsData?.commissionsSummary?.pending || 0) +
                    (analyticsData?.commissionsSummary?.confirmed || 0) +
                    (analyticsData?.commissionsSummary?.paid || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
