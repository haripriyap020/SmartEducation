import React from 'react';

const Badge = ({ variant = 'primary', children, icon: Icon, className = '' }) => {
  const normalizedVariant = variant.toLowerCase().replace(/\s+/g, '_');
  return (
    <span className={`badge badge-${normalizedVariant} ${className}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

export default Badge;
