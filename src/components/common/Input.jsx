import React from 'react';

const Input = ({ label, error, className = '', icon, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={`w-full px-3 py-2 ${icon ? 'pl-10' : ''} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && (
      <p className="text-sm text-red-600">{error}</p>
    )}
  </div>
);

export default Input;