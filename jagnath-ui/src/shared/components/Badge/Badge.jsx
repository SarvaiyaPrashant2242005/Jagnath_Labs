import React from 'react';

const Badge = ({ children, className = '', icon: Icon, ...props }) => {
  return (
    <div className={`premium-badge ${className}`} {...props}>
      {Icon && <Icon className="badge-icon" aria-hidden="true" />}
      <span className="badge-text">{children}</span>
    </div>
  );
};

export default Badge;
