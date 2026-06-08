import React from 'react';

/**
 * GlassCard - The fundamental building block of the Desvio design system.
 * Implements a high-fidelity glassmorphism effect with semantic tokens.
 */
export const GlassCard = ({ 
  children, 
  className = '', 
  hover = false, 
  onClick, 
  padding = 'p-6',
  variant = 'default' 
}) => {
  const variants = {
    default: 'bg-white/[0.03] border-white/10',
    premium: 'bg-primary/5 border-primary/20 shadow-none',
    intense: 'bg-[#0e0e0e] border-white/10',
    ghost: 'bg-transparent border-white/5'
  };

  const baseStyles = `
    rounded-2xl 
    border 
    transition-all 
    duration-500 
    overflow-hidden
    ${variants[variant]}
    ${hover ? 'hover:scale-[1.02] hover:bg-white/[0.05] hover:border-white/20' : ''}
    ${onClick ? 'cursor-pointer active:scale-95' : ''}
    ${padding}
    ${className}
  `;

  return (
    <div className={baseStyles} onClick={onClick}>
      {children}
    </div>
  );
};
