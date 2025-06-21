import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = null, 
  centered = true,
  overlay = false,
  className = ''
}) => {
  // Tailles disponibles
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  // Couleurs disponibles
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  const spinnerClasses = `animate-spin ${sizes[size]} ${colors[color]} ${className}`;

  const content = (
    <div className={`flex items-center space-x-2 ${centered ? 'justify-center' : ''}`}>
      <Loader2 className={spinnerClasses} />
      {text && (
        <span className={`text-sm font-medium ${colors[color]} animate-pulse`}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};

// Composant pour un spinner en ligne
export const InlineSpinner = ({ size = 'sm', color = 'blue', className = '' }) => (
  <LoadingSpinner 
    size={size} 
    color={color} 
    centered={false} 
    className={className}
  />
);

// Composant pour un spinner de page entière
export const PageSpinner = ({ text = 'Chargement...', color = 'blue' }) => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner 
      size="xl" 
      color={color} 
      text={text} 
      centered={true}
    />
  </div>
);

// Composant pour un spinner de section
export const SectionSpinner = ({ text = null, height = 'h-64', color = 'blue' }) => (
  <div className={`${height} flex items-center justify-center`}>
    <LoadingSpinner 
      size="lg" 
      color={color} 
      text={text} 
      centered={true}
    />
  </div>
);

// Composant pour un spinner de bouton
export const ButtonSpinner = ({ size = 'sm', color = 'white', className = '' }) => (
  <LoadingSpinner 
    size={size} 
    color={color} 
    centered={false} 
    className={className}
  />
);

// Composant pour un spinner avec overlay
export const OverlaySpinner = ({ text = 'Traitement en cours...', color = 'blue' }) => (
  <LoadingSpinner 
    size="lg" 
    color={color} 
    text={text} 
    overlay={true}
  />
);

// Composant pour un skeleton loader (alternative au spinner)
export const SkeletonLoader = ({ 
  lines = 3, 
  height = 'h-4', 
  className = '' 
}) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: lines }, (_, index) => (
      <div
        key={index}
        className={`bg-gray-200 rounded ${height} ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

// Composant pour un skeleton de carte
export const CardSkeleton = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

// Composant pour un skeleton de tableau
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    <div className="animate-pulse">
      {/* En-tête */}
      <div className="bg-gray-50 border-b border-gray-200 p-6">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Lignes */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-200 p-6">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSpinner;
