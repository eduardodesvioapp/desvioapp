import React from 'react';

/**
 * PremiumButton - Interactive elements with tactile feedback and high-fidelity styles.
 */
export const PremiumButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  icon = null,
  onClick,
  disabled = false,
  fullWidth = false
}) => {
  const variants = {
    primary: 'bg-primary text-black hover:scale-[1.02] shadow-primary/20',
    secondary: 'bg-white/5 text-white border-white/10 hover:bg-white/10',
    ghost: 'bg-transparent text-white/60 hover:text-white',
    danger: 'bg-red-500/10 text-red-500 border-red-500/10 hover:bg-red-500/20',
    circle: 'w-12 h-12 md:w-14 md:h-14 rounded bg-white/5 border border-white/10 items-center justify-center'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[9px]',
    md: 'px-8 py-4 text-[10px] md:text-xs',
    lg: 'px-12 py-5 text-xs md:text-sm',
    none: ''
  };

  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`
        rounded
        flex items-center justify-center gap-3
        font-bold uppercase tracking-[0.2em]
        transition-all duration-300 active:scale-95
        disabled:opacity-20 disabled:pointer-events-none
        ${variants[variant]} 
        ${variant !== 'circle' ? sizes[size] : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {icon && <span className="material-symbols-outlined text-xl md:text-2xl">{icon}</span>}
      {children}
    </button>
  );
};
