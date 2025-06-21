import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  trend = null,
  subtitle = null,
  className = ''
}) => {
  // Configuration des couleurs
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      iconText: 'text-blue-600',
      cardBg: 'bg-blue-50'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-500',
      iconText: 'text-green-600',
      cardBg: 'bg-green-50'
    },
    yellow: {
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-500',
      iconText: 'text-yellow-600',
      cardBg: 'bg-yellow-50'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-500',
      iconText: 'text-red-600',
      cardBg: 'bg-red-50'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-500',
      iconText: 'text-purple-600',
      cardBg: 'bg-purple-50'
    },
    gray: {
      bg: 'bg-gray-50',
      iconBg: 'bg-gray-500',
      iconText: 'text-gray-600',
      cardBg: 'bg-gray-50'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  // Analyser la tendance
  const getTrendInfo = () => {
    if (!trend || typeof trend !== 'object') return null;

    const { value: trendValue, period } = trend;
    const isPositive = trendValue > 0;
    const isNegative = trendValue < 0;

    return {
      value: Math.abs(trendValue),
      isPositive,
      isNegative,
      period: period || 'vs mois dernier',
      color: isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600',
      icon: isPositive ? TrendingUp : isNegative ? TrendingDown : null
    };
  };

  const trendInfo = getTrendInfo();

  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 
      p-6 hover:shadow-md transition-shadow duration-200 ${className}
    `}>
      <div className="flex items-center justify-between">
        
        {/* Contenu principal */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </p>
          
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          
          {/* Indicateur de tendance */}
          {trendInfo && (
            <div className={`flex items-center space-x-1 mt-2 ${trendInfo.color}`}>
              {trendInfo.icon && (
                <trendInfo.icon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {trendInfo.isPositive && '+'}
                {trendInfo.value}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {trendInfo.period}
              </span>
            </div>
          )}
        </div>

        {/* Icône */}
        <div className={`p-3 rounded-lg ${colors.cardBg} dark:bg-gray-700`}>
          <Icon className={`h-6 w-6 ${colors.iconText} dark:text-gray-300`} />
        </div>
      </div>
    </div>
  );
};

// Variante de carte avec graphique intégré
export const StatCardWithChart = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  chartData = [],
  trend = null
}) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700`}>
          <Icon className={`h-5 w-5 ${colorClasses[color]} dark:text-gray-300`} />
        </div>
      </div>

      {/* Mini graphique */}
      {chartData.length > 0 && (
        <div className="h-16 flex items-end space-x-1">
          {chartData.slice(-10).map((point, index) => (
            <div
              key={index}
              className={`flex-1 bg-${color}-200 dark:bg-${color}-800 rounded-t`}
              style={{
                height: `${Math.max((point / Math.max(...chartData)) * 100, 5)}%`
              }}
            />
          ))}
        </div>
      )}

      {/* Tendance */}
      {trend && (
        <div className="mt-3 flex items-center space-x-1">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs(trend)}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            vs mois dernier
          </span>
        </div>
      )}
    </div>
  );
};

// Variante compacte pour les petits espaces
export const CompactStatCard = ({ title, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} dark:bg-gray-700 dark:border-gray-600`}>
      <p className="text-xs font-medium opacity-75 dark:text-gray-300">
        {title}
      </p>
      <p className="text-lg font-bold dark:text-white">
        {value}
      </p>
    </div>
  );
};

export default StatCard;
