import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useNotificationStore = create((set, get) => ({
  unreadMatches: 0,
  unreadLikedMe: 0,
  unreadVisitors: 0,
  unreadMessages: 0,
  unreadNotifications: 0,

  activeChatUserId: null,
  setActiveChat: (userId) => set({ activeChatUserId: userId }),

  fetchCounts: async (userId) => {
    if (!userId) return;

    try {
      // 1. Unread Matches, Visitors & Central Notifications
      const [
        { count: matchesCount },
        { count: likedMeCount },
        { count: visitorsCount },
        { count: notificationsCount },
        { data: userData }
      ] = await Promise.all([
        // Matches Aceitos (não lidos)
        supabase.from('matches').select('*', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .eq('is_read', false)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
        
        // Likes Pendentes Recebidos (não lidos)
        supabase.from('likes').select('*', { count: 'exact', head: true })
          .eq('liked_user_id', userId)
          .eq('is_read', false),

        supabase.from('profile_visits').select('*', { count: 'exact', head: true }).eq('visited_id', userId).eq('is_read', false),
        
        // Notificações Centrais (não lidas)
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false),
        
        supabase.from('users').select('last_active').eq('id', userId).maybeSingle()
      ]);

      // 2. Unread Messages (using is_read logic)
      let messagesQuery = supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      const activeChatUserId = get().activeChatUserId;
      if (activeChatUserId) {
        messagesQuery = messagesQuery.neq('sender_id', activeChatUserId);
      }

      const { count: messagesCount } = await messagesQuery;

      set({ 
        unreadMatches: matchesCount || 0,
        unreadLikedMe: likedMeCount || 0, 
        unreadVisitors: visitorsCount || 0,
        unreadMessages: messagesCount || 0,
        unreadNotifications: notificationsCount || 0
      });
    } catch (err) {
      console.error('Error fetching notification counts:', err);
    }
  },

  resetVisitors: () => set({ unreadVisitors: 0 }),
  resetMatches: () => set({ unreadMatches: 0 }),
  resetLikedMe: () => set({ unreadLikedMe: 0 }),
  resetMessages: () => set({ unreadMessages: 0 }),
  resetNotifications: () => set({ unreadNotifications: 0 }),

  subscribe: (userId) => {
    if (!userId) return;

    const channels = [
      supabase.channel(`user-${userId}-likes`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'likes', filter: `liked_user_id=eq.${userId}` }, (payload) => {
          if (payload.eventType === 'INSERT') {
            console.log('💚 [REALTIME] Novo Like Detectado!', payload.new);
          } else if (payload.eventType === 'DELETE') {
            console.log('💔 [REALTIME] Like Removido!', payload.old);
          }
          get().fetchCounts(userId);
        })
        .subscribe(),

      supabase.channel(`user-${userId}-matches`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => get().fetchCounts(userId))
        .subscribe(),
      
      supabase.channel(`user-${userId}-visits`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_visits', filter: `visited_id=eq.${userId}` }, () => get().fetchCounts(userId))
        .subscribe(),
      
      supabase.channel(`user-${userId}-messages`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => get().fetchCounts(userId))
        .subscribe(),

      supabase.channel(`user-${userId}-notifications`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => get().fetchCounts(userId))
        .subscribe(),

      supabase.channel(`user-${userId}-users`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, () => get().fetchCounts(userId))
        .subscribe()
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }
}));
