import React from 'react';
import { Logo } from './Logo';

/**
 * Loading - Standardized loading component that maintains the brand's 
 * brutalist-premium aesthetic using the same animations as the Splash Screen.
 */
export const Loading = ({ fullScreen = false, message = "SINCRONIZANDO..." }) => {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center"
    : "flex flex-col items-center justify-center p-12 w-full min-h-[50vh] flex-1";

  return (
    <div className={containerClasses}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse"></div>
        <Logo 
          size="sm" 
          className="relative z-10 animate-float opacity-80"
        />
        {/* Scan line effect */}
        <div className="absolute inset-0 w-full h-[1px] bg-primary/50 shadow-[0_0_10px_#ba9eff] z-20 animate-scan"></div>
      </div>
      
      {message && (
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#FF5500] animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
};
