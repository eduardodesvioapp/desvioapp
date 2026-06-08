import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { PremiumButton, Avatar, Logo, ConfirmModal } from '../ui';

/**
 * PageHeader - A unified, high-fidelity header for all pages.
 * Focuses on Brand, Contextual Info, and Profile.
 */
export const PageHeader = ({ 
  children, 
  leftContent, 
  rightContent, 
  transparent = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
    const { user } = useAuthStore();
  
  const isPublic = !user;

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-[60] 
      flex justify-between items-center w-full 
      px-4 md:px-8 py-3 md:py-4 
      border-b-0 shadow-none
      ${transparent ? 'bg-transparent' : 'bg-black'}
      ${className}
    `}>
      <div className="flex items-center gap-4 md:gap-12">
        <Logo 
          className="cursor-pointer py-2 pl-[1px]" 
          onClick={() => navigate('/search')}
        />

        {leftContent && (
          <div className="flex items-center border-l border-white/10 pl-4 ml-2">
            {leftContent}
          </div>
        )}
      </div>

      <div className="flex-1 px-8 flex justify-center">
        {children}
      </div>

      <div className="flex items-center gap-3">
        {rightContent || (
          isPublic ? (
            <div className="flex items-center gap-2">
              <Link to="/signin" className="flex items-center justify-center min-h-[44px] px-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Entrar</Link>
              <PremiumButton size="sm" onClick={() => navigate('/signup')}>Fazer Parte</PremiumButton>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/60 hover:text-white"
                title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              >
                <span className="material-symbols-outlined text-sm">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <Avatar
                src={user?.profile_image_url}
                alt={user?.name || 'Me'}
                size="lg"
                variant="raw"
                className="cursor-pointer border-2 border-primary/20 hover:border-primary hover:scale-105 transition-all"
                onClick={() => navigate(`/user/${user.id}`)}
              />
            </div>
          )
        )}
      </div>
    </header>
  );
};
