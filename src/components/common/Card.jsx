import React from 'react';

const Card = ({ children, className = '', ...props }) => (
  <div 
    className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

export default Card;