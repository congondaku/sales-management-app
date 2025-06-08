import React from 'react';
import { TrendingUp } from 'lucide-react';
import Card from './Card';

const StatCard = ({ title, value, icon: Icon, change, changeType, subtitle, className = '' }) => (
  <Card className={`p-6 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        {change && (
          <div className={`flex items-center mt-2 text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${changeType === 'negative' ? 'transform rotate-180' : ''}`} />
            {change}
          </div>
        )}
      </div>
      {Icon && (
        <div className="p-3 bg-green-100 rounded-lg">
          <Icon className="w-6 h-6 text-green-600" />
        </div>
      )}
    </div>
  </Card>
);

export default StatCard;