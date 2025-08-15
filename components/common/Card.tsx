import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-card rounded-2xl p-5 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default Card;