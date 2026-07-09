import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hoverEffect = true, 
  glass = true,
  ...props 
}) => {
  return (
    <div 
      className={`premium-card ${glass ? 'card-glass' : ''} ${hoverEffect ? 'card-hover' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
