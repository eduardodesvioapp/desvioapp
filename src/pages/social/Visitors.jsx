import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Loading , EmptyStateCard } from '@/components/ui';
import { UserCard } from '@/components/patterns/UserCard';
import { formatDateTime } from '@/utils/dateUtils';

/**
 * Visitors - Exibe APENAS os novos visitantes (is_read = false).
 */
export const Visitors = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchCounts } = useNotificationStore();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchVisitors = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data: currentUserData } = await supabase
        .from('users')
        .select('latitude, longitude')
        .eq('id', user.id)
        .maybeSingle();

      // Busca apenas visitantes NÃO LIDOS conforme pedido
      const { data, error } = await supabase
        .from('profile_visits')
        .select(`
          id,
          is_read,
          last_visit_at,
          visitor_id
        `)
        .eq('visited_id', user.id)
        .eq('is_read', false)
        .order('last_visit_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setVisitors([]);
        return;
      }

      const visitorIds = [...new Set(data.map(v => v.visitor_id))];
      const { data: profiles, error: pError } = await supabase
        .from('users')
        .select('id, name, profile_image_url, gender, age, city, latitude, longitude, profile_score, is_human')
        .in('id', visitorIds);

      if (pError) throw pError;

      const profilesMap = new Map(profiles?.map(p => {
        const distance = calculateDistance(
          currentUserData?.latitude, 
          currentUserData?.longitude, 
          p.latitude, 
          p.longitude
        );
        return [p.id, {
          ...p,
          km_away: distance,
          compatibility: p.profile_score || 80
        }];
      }) || []);
      
      const uniqueVisitors = [];
      const seenIds = new Set();
      
      data.forEach(v => {
        const profile = profilesMap.get(v.visitor_id);
        if (profile && !seenIds.has(v.visitor_id)) {
          uniqueVisitors.push({
            ...v,
            visitor: profile
          });
          seenIds.add(v.visitor_id);
        }
      });

      setVisitors(uniqueVisitors);
    } catch (err) {
      console.error('Erro ao buscar visitantes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [user?.id]);

  // Marca como lido ao sair ou após carregar? 
  // O usuário pediu para LISTAR os is_read = false. 
  // Geralmente marcamos como lido quando o usuário visualiza.
  useEffect(() => {
    if (!user?.id || visitors.length === 0) return;

    const markAsRead = async () => {
      const { error } = await supabase
        .from('profile_visits')
        .update({ is_read: true })
        .eq('visited_id', user.id)
        .eq('is_read', false);
      
      if (!error) {
        fetchCounts(user.id);
      }
    };

    // Pequeno delay para o usuário ver que é novo antes de sumir na próxima carga
    const timer = setTimeout(markAsRead, 3000);
    return () => clearTimeout(timer);
  }, [visitors, user, fetchCounts]);

  return (
    <div className="max-w-[100%] mx-auto">
      <div className="flex items-center gap-6 mb-8 px-4">
        <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">
          NOVOS VISITANTES
        </h1>
        <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
      </div>

      <div className="px-4">
        {loading ? (
          <Loading message="RASTREANDO_VISITAS..." />
        ) : visitors.length === 0 ? (
          <EmptyStateCard icon="person_search" title="Nenhuma nova visita" description="Você já visualizou todos os seus visitantes recentes." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {visitors.map((visit) => (
              <div key={visit.id} className="relative group">
                <UserCard 
                  user={visit.visitor}
                  onClick={() => navigate(`/user/${visit.visitor.id}`)}
                />
                <div className="mt-2 px-1 flex items-center justify-between min-h-[14px]">
                  <span className="text-[7px] font-black uppercase tracking-widest text-white/20">
                    VISTO EM: {formatDateTime(visit.last_visit_at)}
                  </span>
                  <span className="bg-primary text-black text-[7px] font-black px-2 py-0.5 rounded animate-pulse">
                    NOVO
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
