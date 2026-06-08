import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Loading, Avatar , EmptyStateCard } from '@/components/ui';
import { formatDate } from '@/utils/dateUtils';

/**
 * Notifications - Notification Center
 * Initially focused on Match alerts (Friendships initiated).
 */
export const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchCounts, resetNotifications } = useNotificationStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const { data: notifs, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (notifError) throw notifError;
      
      // Coleta todos os IDs de atores (quem gerou a notificação)
      const actorIds = [...new Set(notifs?.map(n => 
        n.metadata?.other_user_id || n.metadata?.author_id || n.metadata?.visitor_id
      ).filter(Boolean))];

      // Busca os perfis desses atores em lote
      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from('users')
          .select('id, name, profile_image_url')
          .in('id', actorIds);

        const actorsMap = new Map(actors?.map(a => [a.id, a]));
        
        const enrichedNotifs = notifs.map(n => ({
          ...n,
          actor: actorsMap.get(n.metadata?.other_user_id || n.metadata?.author_id || n.metadata?.visitor_id)
        }));
        
        setNotifications(enrichedNotifs);
      } else {
        setNotifications(notifs || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleNotificationClick = async (notif) => {
    if (!user?.id) return;
    
    // Determina o link de destino
    let targetLink = notif.link || `/search`;
    
    const actorId = notif.metadata?.other_user_id || notif.metadata?.author_id || notif.metadata?.visitor_id;
    
    if (notif.type === 'match' && actorId) {
      targetLink = `/user/${actorId}`;
    } else if (notif.type === 'visit' && actorId) {
      targetLink = `/user/${actorId}`;
    } else if (notif.type === 'like' && actorId) {
      targetLink = `/user/${actorId}`;
    }

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notif.id);
      
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      fetchCounts(user.id);
      navigate(targetLink);
    } catch (err) {
      console.error('Error handling notification click:', err);
      navigate(targetLink);
    }
  };

  useEffect(() => {
    fetchNotifications();
    resetNotifications();
  }, [fetchNotifications, resetNotifications]);

  // Mark in DB
  useEffect(() => {
    if (!user?.id || notifications.length === 0) return;

    const markAsRead = async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (!error) {
        fetchCounts(user.id);
      }
    };

    const timer = setTimeout(markAsRead, 1000);
    return () => clearTimeout(timer);
  }, [notifications, user, fetchCounts]);

  return (
    <div className="max-w-full mx-auto px-4">
      <div className="flex items-center gap-6 mb-8 px-4">
        <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">
          NOTIFICAÇÕES
        </h1>
        <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
      </div>

      {loading ? (
        <Loading message="SINCRONIZANDO_ALERTAS..." />
      ) : notifications.length === 0 ? (
        <EmptyStateCard icon="notifications_off" title="Tudo limpo por aqui" description="Suas notificações aparecerão aqui assim que surgirem." />
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const iconMap = {
              'match': 'sensors',
              'like': 'favorite',
              'visit': 'person_search',
              'message': 'chat'
            };

            return (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="relative">
                  {notif.actor ? (
                    <Avatar 
                      src={notif.actor.profile_image_url} 
                      alt={notif.actor.name} 
                      size="lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all">
                      <span className="material-symbols-outlined text-2xl">
                        {iconMap[notif.type] || 'notifications'}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay icon for clarity */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>
                      {iconMap[notif.type] || 'notifications'}
                    </span>
                  </div>

                  {!notif.is_read && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-black z-10" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {notif.title}
                    </h4>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">
                    {notif.content}
                  </p>
                </div>
                
                <span className="material-symbols-outlined text-white/10 group-hover:text-primary/50 transition-colors">
                  chevron_right
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
