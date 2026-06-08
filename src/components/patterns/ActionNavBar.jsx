import React from 'react';
import { PremiumButton } from '../ui/PremiumButton';

/**
 * ActionNavBar - Barra de ações flutuante para perfis e chats.
 * Usada para ações rápidas como fechar, curtir ou abrir chat.
 */
export const ActionNavBar = ({ 
  onClose, 
  onChat, 
  onFavorite,
  className = ''
}) => {
  return (
    <div className={`fixed bottom-24 left-0 right-0 z-40 flex justify-center px-4 ${className}`}>
      <div className="w-full max-w-xs bg-black/40 backdrop-blur-3xl border border-white/10 rounded p-2 flex items-center justify-center gap-4 shadow-2xl">
        <PremiumButton 
          variant="circle" 
          icon="close" 
          onClick={onClose}
          className="hover:bg-red-500/20"
        />
        
        <PremiumButton 
          variant="circle" 
          icon="chat_bubble" 
          onClick={onChat}
          className="hover:bg-primary/20"
        />
        
        <PremiumButton 
          variant="circle" 
          icon="star" 
          onClick={onFavorite}
          className="hover:bg-primary/20"
        />
      </div>
    </div>
  );
};
