import React from 'react';

/**
 * Avatar - Standardized avatar component for the Desvio ecosystem.
 * Supports different sizes and brutalist frame styles.
 */
export const Avatar = ({ 
  src, 
  alt = "User Avatar", 
  size = "md", 
  className = "",
  variant = "standard",
  onClick
}) => {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    xxl: "w-24 h-24",
    custom: ""
  };

  const variantClasses = {
    standard: "rounded-full",
    glass: "rounded-full bg-white/5 backdrop-blur-md",
    raw: "rounded-full"
  };

  const frameClasses = {
    standard: "border border-white/10",
    glass: "border border-white/10",
    raw: ""
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${alt || 'default'}`;

  return (
    <div 
      className={`relative flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      <img 
        src={src || defaultAvatar} 
        alt={alt} 
        className="absolute inset-0 block w-full h-full object-cover" 
      />
      {frameClasses[variant] && (
        <span className={`pointer-events-none absolute inset-0 ${frameClasses[variant]}`} />
      )}
    </div>
  );
};
