import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export const LikedButton = ({ targetUserId, className = '', size = 'md', initialStatus = null }) => {
  const { user: currentUser } = useAuthStore();
  const [status, setStatus] = useState(initialStatus || 'none');
  const [loading, setLoading] = useState(false);

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
    window.dispatchEvent(new CustomEvent('likeStatusChanged', { 
      detail: { userId: targetUserId, status: newStatus } 
    }));
  };

  useEffect(() => {
    if (!currentUser?.id || !targetUserId) return;

    const checkLikeStatus = async () => {
      // Busca bidirecional: Eu curti ela OU ela me curtiu
      const { data, error } = await supabase
        .from('likes')
        .select('id, status, user_id')
        .or(`and(user_id.eq.${currentUser.id},liked_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},liked_user_id.eq.${currentUser.id})`)
        .maybeSingle();
      
      if (!error && data) {
        // Se eu sou o user_id e status é pending, eu dei o like
        // Se o status é accepted, é match (independente de quem começou)
        if (data.status === 'accepted') {
          updateStatus('accepted');
        } else if (data.user_id === currentUser.id) {
          updateStatus('liked');
        } else {
          // Ela me curtiu mas eu ainda não curti de volta (no meu ponto de vista, ainda é 'none')
          updateStatus('none');
        }
      } else {
        updateStatus('none');
      }
    };

    if (!initialStatus || initialStatus === 'none') {
      checkLikeStatus();
    } else {
      updateStatus(initialStatus);
    }
  }, [currentUser, targetUserId, initialStatus]);

  const toggleLike = async (e) => {
    if (e) e.stopPropagation();
    if (!currentUser?.id || !targetUserId || loading) return;

    setLoading(true);
    try {
      if (status === 'liked' || status === 'accepted') {
        // Para descurtir, removemos qualquer registro entre os dois
        const { error } = await supabase
          .from('likes')
          .delete()
          .or(`and(user_id.eq.${currentUser.id},liked_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},liked_user_id.eq.${currentUser.id})`);
        
        if (error) throw error;
        updateStatus('none');
      } else {
        // Usamos a RPC inteligente para dar like/match
        const { data, error } = await supabase.rpc('handle_like', { 
          p_target_user_id: targetUserId 
        });
        
        if (error) throw error;
        
        if (data === 'match') {
          updateStatus('accepted');
        } else {
          updateStatus('liked');
        }
      }
    } catch (err) {
      console.error('[LikedButton] Erro ao alternar like:', err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 rounded',
    md: 'w-10 h-10 md:w-12 md:h-12 rounded',
    lg: 'w-14 h-14 md:w-16 md:h-16 rounded'
  };

  const iconClasses = {
    sm: 'text-lg',
    md: 'text-xl md:text-2xl',
    lg: 'text-2xl md:text-3xl'
  };

  let visualClasses = 'bg-black/20 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20';
  let iconName = 'favorite';

  if (status === 'liked' || status === 'accepted') {
    visualClasses = 'bg-[#FF0033]/10 border-[#FF0033]/40 text-[#FF0033] shadow-[0_0_20px_rgba(255,0,51,0.2)]';
    iconName = 'favorite';
  }

  return (
    <button 
      onClick={toggleLike}
      disabled={loading}
      className={`
        flex items-center justify-center backdrop-blur-xl border transition-all duration-500
        ${sizeClasses[size] || sizeClasses.md}
        ${visualClasses}
        ${loading ? 'opacity-70 cursor-wait' : ''}
        ${className}
      `}
    >
      <span 
        className={`material-symbols-outlined transition-all duration-300 ${iconClasses[size] || iconClasses.md}`}
        style={status !== 'none' ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {loading ? 'hourglass_top' : iconName}
      </span>
    </button>
  );
};
