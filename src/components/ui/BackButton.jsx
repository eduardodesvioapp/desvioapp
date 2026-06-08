import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * BackButton - Standardized glassmorphic back button matching the admin cockpit design.
 */
export const BackButton = ({ 
  to = null, 
  onClick = null, 
  className = '', 
  title = 'Voltar' 
}) => {
  const navigate = useNavigate();

  const handlePress = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button 
      type="button"
      onClick={handlePress} 
      className={`flex items-center justify-center h-10 w-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all shrink-0 active:scale-95 ${className}`}
      title={title}
    >
      <span className="material-symbols-outlined">arrow_back</span>
    </button>
  );
};
