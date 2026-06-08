import React from 'react';

/**
 * Badge - Small visual indicators for status, scores, and categories.
 */
export const Badge = ({ 
  children, 
  variant = 'default', 
  className = '', 
  icon = null 
}) => {
  const variants = {
    default: 'bg-white/10 text-white/60 border-white/10',
    primary: 'bg-primary/20 text-primary border-primary/20 italic font-black',
    online: 'bg-green-500/20 text-green-500 border-green-500/20',
    glass: 'bg-black/60 backdrop-blur-md text-white/90 border-white/10'
  };

  return (
    <div className={`
      inline-flex items-center gap-2 
      px-3 py-1.5 
      rounded 
      border 
      text-[9px] md:text-[10px] 
      uppercase tracking-wider 
      ${variants[variant]} 
      ${className}
    `}>
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </div>
  );
};
