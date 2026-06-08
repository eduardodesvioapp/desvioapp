import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PremiumButton } from './PremiumButton';

/**
 * ConfirmModal - A premium brutalist modal for critical confirmations.
 */
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'CONFIRMAR_AÇÃO', 
  message = 'Deseja prosseguir com esta operação?',
  confirmText = 'CONFIRMAR',
  cancelText = 'CANCELAR',
  variant = 'danger' // 'danger', 'primary', 'warning'
}) => {
  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variants = {
    danger: {
      border: 'border-[#FF0033]/30',
      text: 'text-[#FF0033]',
      glow: 'shadow-[0_0_50px_rgba(255,0,51,0.15)]',
      btn: 'bg-[#FF0033] text-white hover:bg-[#CC0022]'
    },
    primary: {
      border: 'border-[#FF5500]/30',
      text: 'text-[#FF5500]',
      glow: 'shadow-[0_0_50px_rgba(255,85,0,0.15)]',
      btn: 'bg-[#FF5500] text-black hover:bg-[#E64D00]'
    },
    success: {
      border: 'border-[#00FF66]/30',
      text: 'text-[#00FF66]',
      glow: 'shadow-[0_0_50px_rgba(0,255,102,0.15)]',
      btn: 'bg-[#00FF66] text-black hover:bg-[#00CC52]'
    }
  };

  const style = variants[variant] || variants.primary;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 outline-none focus:outline-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Modal Content Container */}
      <div className="relative z-[10000] w-full max-w-md mx-auto pointer-events-none">
        <div className={`
          relative w-full bg-black border ${style.border} p-8 md:p-12
          ${style.glow} animate-in zoom-in-95 fade-in duration-500 pointer-events-auto
        `}>
          {/* Decorative Corner */}
          <div className={`absolute -top-[1px] -left-[1px] w-8 h-8 border-t-2 border-l-2 ${style.border.replace('/30', '')}`} />
          
          <div className="mb-8">
            <h2 className={`text-xs font-black uppercase tracking-[0.4em] mb-4 ${style.text}`}>
              {title}
            </h2>
            <div className="h-[1px] w-12 bg-white/20 mb-6" />
            <p className="text-white/60 text-sm leading-relaxed font-medium">
              {message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <PremiumButton 
              fullWidth 
              onClick={onConfirm}
              className={style.btn}
            >
              {confirmText}
            </PremiumButton>
            
            <button 
              onClick={onClose}
              className="flex-1 min-h-[48px] px-6 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
