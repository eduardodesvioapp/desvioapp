import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';

/**
 * BottomNavBar - The main floating navigation bar for the application.
 * Centralized at the bottom with glassmorphic styles.
 */
export const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { unreadMatches, unreadLikedMe, unreadVisitors, unreadMessages, unreadNotifications } = useNotificationStore();
  const pathname = location.pathname;

  if (!user) return null;

  const navItems = [
    { icon: 'search', label: 'Busca', path: '/search' },
    { 
      icon: 'group', 
      label: 'Matches', 
      path: '/matches',
      badge: unreadMatches 
    },
    { 
      icon: 'favorite', 
      label: 'Curtidas', 
      path: '/likedme',
      badge: unreadLikedMe 
    },
    { 
      icon: 'person_search', 
      label: 'Visitantes', 
      path: '/visitors',
      badge: unreadVisitors 
    },
    { 
      icon: 'chat', 
      label: 'Conversas', 
      path: '/conversations',
      badge: unreadMessages 
    },
    { 
      icon: 'notifications', 
      label: 'Alertas', 
      path: '/notifications',
      badge: unreadNotifications 
    },
  ];

  return (
    <nav className="fixed top-[80px] left-0 right-0 z-50 flex justify-around items-center w-full bg-black/95 backdrop-blur-3xl py-2 px-4 min-h-[60px] overflow-visible shadow-none">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path.startsWith('/user/') && pathname.startsWith('/user/'));
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`
              relative flex flex-col items-center justify-center transition-all duration-300 active:scale-90 overflow-visible
              ${isActive ? 'text-primary' : 'text-white/40 hover:text-white/70'}
            `}
          >
            <div className="relative">
              <span 
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              
              {item.badge > 0 && (
                <span className="absolute top-0 -right-1.5 min-w-[14px] h-[14px] bg-[#FF0033] text-white text-[8px] font-black rounded-full flex items-center justify-center px-1 shadow-[0_0_10px_rgba(255,0,51,0.4)] animate-in zoom-in duration-300 z-10">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            

            {isActive && (
              <span className="absolute -top-1 w-1 h-1 bg-primary rounded shadow-[0_0_10px_#ba9eff]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
