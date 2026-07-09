import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', // 'primary' | 'secondary' | 'glass' | 'outline'
  className = '', 
  icon: Icon,
  iconPosition = 'right',
  ...props 
}) => {
  return (
    <button 
      className={`premium-btn btn-${variant} ${className}`} 
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="btn-icon icon-left" aria-hidden="true" />}
      <span className="btn-text">{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="btn-icon icon-right" aria-hidden="true" />}
    </button>
  );
};

export default Button;
