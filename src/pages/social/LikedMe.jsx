import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Loading , EmptyStateCard } from '@/components/ui';
import { UserCard } from '@/components/patterns/UserCard';
import { formatDateTime } from '@/utils/dateUtils';

/**
 * LikedMe - Exibe os perfis que deram like no usuário logado mas ainda não houve match.
 */
export const LikedMe = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchCounts, resetLikedMe } = useNotificationStore();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState(new Map());

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchLikedMe = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data: currentUserData } = await supabase
        .from('users')
        .select('latitude, longitude')
        .eq('id', user.id)
        .maybeSingle();

      // Busca likes onde o usuário logado foi curtido (incluindo lidos para não sumirem da lista)
      const { data, error } = await supabase
        .from('likes')
        .select(`
          created_at,
          user_id,
          is_read,
          status,
          user:users!user_id (id, name, profile_image_url, gender, age, city, latitude, longitude, profile_score, is_human)
        `)
        .eq('liked_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const incomingLikes = (data || []).map(m => {
        const otherUser = m.user;
        const distance = calculateDistance(
          currentUserData?.latitude, 
          currentUserData?.longitude, 
          otherUser?.latitude, 
          otherUser?.longitude
        );

        return {
          ...m,
          author: {
            ...otherUser,
            km_away: distance,
            compatibility: otherUser?.profile_score || 85
          }
        };
      });

      setLikes(incomingLikes);
      setUserLikes(new Map(incomingLikes.map(l => [l.author.id, l.status === 'accepted' ? 'accepted' : 'none'])));
    } catch (err) {
      console.error('Erro ao buscar LikedMe:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    // Marca como lido no banco de dados imediatamente
    const { error } = await supabase
      .from('likes')
      .update({ is_read: true })
      .eq('liked_user_id', user.id)
      .eq('is_read', false);
    
    if (!error) {
      // Atualiza os contadores globais após confirmar no banco
      fetchCounts(user.id);
    }
  }, [user?.id, fetchCounts]);

  useEffect(() => {
    const init = async () => {
      await fetchLikedMe();
      // Zera o badge localmente para resposta instantânea
      resetLikedMe();
      // Marca no banco imediatamente para evitar que o realtime sobrescreva com o valor antigo
      await markAsRead();
    };
    
    init();
  }, [fetchLikedMe, resetLikedMe, markAsRead]);

  // Removido o useEffect com setTimeout que causava o "flicker"

  return (
    <div className="w-full">
      <div className="flex items-center gap-6 mb-8 px-4">
        <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">
          QUEM TE CURTIU
        </h1>
        <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
      </div>

      <div className="px-4">
        {loading ? (
          <Loading message="PROCESSANDO_INTERESSES..." />
        ) : likes.length === 0 ? (
          <EmptyStateCard icon="favorite" title="Nenhum interesse novo" description="Continue explorando. Quando alguém te der like, essa lista será atualizada." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {likes.map((like, index) => (
              <div key={`like-${index}`} className="relative group">
                <UserCard 
                  user={like.author}
                  initialStatus={userLikes.get(like.author.id) || 'none'}
                  onClick={() => navigate(`/user/${like.author.id}`)}
                />
                
                {/* Footer Info: Date + New Badge */}
                <div className="mt-2 px-1 flex items-center justify-between min-h-[14px]">
                  <span className="text-[7px] font-black uppercase tracking-widest text-white/20 group-hover:text-primary/60 transition-colors">
                    SINALIZOU EM: {formatDateTime(like.created_at)}
                  </span>
                  
                  {!like.is_read && (
                    <span className="bg-primary text-black text-[7px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,85,0,0.3)] animate-pulse">
                      NOVO
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
