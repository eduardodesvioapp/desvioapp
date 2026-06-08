import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Loading , EmptyStateCard } from '@/components/ui';
import { UserCard } from '@/components/patterns/UserCard';
import { useNotificationStore } from '@/store/useNotificationStore';

/**
 * Matches - Exibe os perfis que deram match com o usuário logado.
 */
export const Matches = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState(new Map());

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchMatches = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data: currentUserData } = await supabase
        .from('users')
        .select('latitude, longitude')
        .eq('id', user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('matches')
        .select(`
          created_at,
          status,
          requester_id,
          is_read,
          user1:users!user1_id (id, name, profile_image_url, gender, age, city, latitude, longitude, profile_score, is_human),
          user2:users!user2_id (id, name, profile_image_url, gender, age, city, latitude, longitude, profile_score, is_human)
        `)
        .eq('status', 'accepted')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const matches = (data || []).map(m => {
        const otherUser = m.user1.id === user.id ? m.user2 : m.user1;
        
        // Calcula distância e sinc
        const distance = calculateDistance(
          currentUserData?.latitude, 
          currentUserData?.longitude, 
          otherUser.latitude, 
          otherUser.longitude
        );

        return {
          ...m,
          author: {
            ...otherUser,
            km_away: distance,
            compatibility: otherUser.profile_score || 85 // Fallback para sinc
          }
        };
      });

      setLikes(matches);
      setUserLikes(new Map(matches.map(s => [s.author.id, s.status])));
    } catch (err) {
      console.error('Erro ao buscar sinais:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);



  const { fetchCounts, resetMatches } = useNotificationStore();

  const markAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    // Zera o badge localmente para resposta instantânea
    resetMatches();

    const { error } = await supabase
      .from('matches')
      .update({ is_read: true })
      .eq('is_read', false)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    
    if (!error) {
      fetchCounts(user.id);
    }
  }, [user?.id, resetMatches, fetchCounts]);

  useEffect(() => {
    const init = async () => {
      await fetchMatches();
      await markAsRead();
    };
    
    init();
  }, [fetchMatches, markAsRead]);

  return (
    <div className="w-full">
      {/* Title Header */}
      <div className="flex items-center gap-6 mb-12 px-4">
        <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">
          MATCHES
        </h1>
        <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
      </div>

      <div className="px-4">
        {loading ? (
          <Loading message="PROCESSANDO_MATCHES..." />
        ) : likes.length === 0 ? (
          <EmptyStateCard 
            icon="visibility_off" 
            title="NENHUM MATCH ENCONTRADO" 
            description="DÊ UM LIKE E AGUARDE A APROVAÇÃO PARA INICIAR UMA CONVERSA." 
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {likes.map((like, index) => (
              <UserCard 
                key={`like-${index}`}
                user={like.author}
                initialStatus={userLikes.get(like.author.id) || 'none'}
                onClick={() => navigate(`/user/${like.author.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
