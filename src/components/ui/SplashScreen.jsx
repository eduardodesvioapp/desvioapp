import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';

/**
 * SplashScreen - A high-fidelity, brutalist-premium entry animation.
 * Features a scan-line effect, technical progress indicators, and glitch transitions.
 */
export const SplashScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('INICIANDO APP');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const statuses = [
      'INICIANDO APP',
      'ATUALIZANDO NOVOS DESVIOS',
      'AJUSTANDO O ALCANCE',
      'ATUALIZANDO PERFIS',
      'ENTRANDO ...'
    ];

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(onFinish, 800); // Wait for exit animation
          }, 500);
          return 100;
        }
        
        // Update status text based on progress
        const statusIdx = Math.floor((prev / 100) * statuses.length);
        setStatus(statuses[statusIdx] || statuses[statuses.length - 1]);
        
        return prev + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center transition-all duration-700 ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ba9eff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with Glitch Effect */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
          <Logo 
            size="lg" 
            className="relative z-10 animate-float"
          />
          {/* Scan line effect */}
          <div className="absolute inset-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#ba9eff] z-20 animate-scan"></div>
        </div>

        {/* Technical Progress Container */}
        <div className="w-64 md:w-80">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF5500] animate-pulse">
              {status}
            </span>
            <span className="text-[10px] font-black italic text-white/40">
              {Math.floor(progress)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
            <div 
              className="absolute h-full bg-primary shadow-[0_0_10px_#ba9eff] transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Decorative bits */}
          <div className="flex justify-between mt-1">
            <div className="w-1 h-1 bg-white/20"></div>
            <div className="w-1 h-1 bg-white/20"></div>
            <div className="w-1 h-1 bg-white/20"></div>
          </div>
        </div>
      </div>

      {/* Edge overlays */}
      <div className="absolute top-8 left-8 text-[8px] font-black text-white/10 tracking-[0.5em] vertical-rl">
        RADAR_OS_V2.0.25
      </div>
      <div className="absolute bottom-8 right-8 text-[8px] font-black text-white/10 tracking-[0.5em]">
        © 2026_ESTUDIO_RADAR
      </div>
    </div>
  );
};
