import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppRoutes } from '@/routes';
import { SplashScreen } from '@/components/ui';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { logUserActivity } from '@/utils/activityLogger';
import './index.css';

function App() {
  const { setSession, setLoading, fetchUserProfile, user } = useAuthStore();
  const { fetchCounts, subscribe } = useNotificationStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserProfile(session.user.id);

        if (event === 'SIGNED_IN') {
          logUserActivity(session.user.id, 'LOGIN');
        } else if (event === 'TOKEN_REFRESHED') {
          logUserActivity(session.user.id, 'SESSION_REFRESH');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading, fetchUserProfile]);

  useEffect(() => {
    if (user?.id) {
      fetchCounts(user.id);

      const updateLastActive = async () => {
        try {
          await supabase
            .from('users')
            .update({ last_active: new Date().toISOString() })
            .eq('id', user.id);
        } catch (err) {
          console.warn('[Heartbeat] Failed to update last_active:', err);
        }
      };

      updateLastActive();
      const heartbeatInterval = setInterval(updateLastActive, 120_000);

      const unsubscribe = subscribe(user.id);

      // Fallback polling quando WebSocket falhar (ex: proxy sem suporte a wss://)
      const pollInterval = setInterval(() => {
        fetchCounts(user.id);
      }, 30_000);

      return () => {
        unsubscribe && unsubscribe();
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
      };
    }
  }, [user?.id, fetchCounts, subscribe]);

  return (
    <BrowserRouter>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <Toaster
        theme="dark"
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: '4px',
          },
        }}
      />

      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
