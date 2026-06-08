import React from 'react';

/**
 * EmptyStateCard - A reusable component for empty states in lists or sections.
 * Features a branded orange (primary) dashed border and icon container.
 */
export const EmptyStateCard = ({ 
  icon = 'notifications_off', 
  title = 'Tudo limpo por aqui', 
  description = 'Suas notificações aparecerão aqui assim que surgirem.',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-primary/20 rounded-[40px] bg-primary/5 ${className}`}>
      <div className="w-20 h-20 bg-primary/10 rounded flex items-center justify-center mb-6 border border-primary/20">
        <span className="material-symbols-outlined text-4xl text-primary opacity-80">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-primary">{title}</h3>
      {description && (
        <p className="text-primary/70 text-sm mt-2 max-w-xs mx-auto">
          {description}
        </p>
      )}
    </div>
  );
};
