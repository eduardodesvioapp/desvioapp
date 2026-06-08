import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ConfirmModal } from './ConfirmModal';

export const MatchedButton = ({ targetUserId, className = '', size = 'md', initialStatus = null, isAi = false }) => {
  const { user: currentUser } = useAuthStore();
  const [status, setStatus] = useState(initialStatus || 'none');
  const [loading, setLoading] = useState(false);
  
  const updateStatus = (newStatus) => {
    setStatus(newStatus);
    window.dispatchEvent(new CustomEvent('matchStatusChanged', { 
      detail: { userId: targetUserId, status: newStatus } 
    }));
  };
  const [isIncoming, setIsIncoming] = useState(false);
  const [matchId, setMatchId] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'reject' | 'unmatch'

  useEffect(() => {
    if (!currentUser?.id || !targetUserId) return;

    const checkMatchStatus = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUser.id})`)
        .maybeSingle();
      
      if (data) {
        setMatchId(data.id);
        updateStatus(data.status);
        setIsIncoming(data.requester_id !== currentUser.id && data.status === 'pending');
      } else {
        setMatchId(null);
        updateStatus('none');
        setIsIncoming(false);
      }
    };

    checkMatchStatus();
  }, [currentUser, targetUserId]);

  const handleOpenModal = (e, type) => {
    if (e) e.stopPropagation();
    setModalAction(type);
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    setShowModal(false);
    if (modalAction === 'unmatch') {
      await performUnmatch();
    } else if (modalAction === 'reject') {
      await handleAction('rejected');
    }
  };

  const performUnmatch = async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      await supabase.from('matches').delete().eq('id', matchId);
      updateStatus('none');
      setMatchId(null);
    } catch (err) {
      console.error('Erro ao remover match:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMatch = async (e) => {
    if (e) e.stopPropagation();
    if (!currentUser?.id || !targetUserId || loading) return;

    if (status === 'accepted') {
      handleOpenModal(e, 'unmatch');
      return;
    }

    if (status === 'pending' && !isIncoming) {
      setLoading(true);
      try {
        await supabase.from('matches').delete().eq('id', matchId);
        updateStatus('none');
        setMatchId(null);
      } catch (err) {} finally { setLoading(false); }
      return;
    }

    if (status === 'pending' && isIncoming) {
      handleAction('accepted');
      return;
    }

    if (status === 'none' || status === 'rejected') {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('matches')
          .insert({ 
            user1_id: currentUser.id < targetUserId ? currentUser.id : targetUserId, 
            user2_id: currentUser.id < targetUserId ? targetUserId : currentUser.id, 
            requester_id: currentUser.id,
            status: 'pending' 
          })
          .select()
          .single();
        
        if (error) throw error;
        updateStatus('pending');
        setMatchId(data.id);
        setIsIncoming(false);
      } catch (err) {
        console.error('[MatchedButton] Erro ao enviar sinal:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAction = async (newStatus) => {
    if (loading || !matchId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: newStatus })
        .eq('id', matchId);
      
      if (error) throw error;
      updateStatus(newStatus);
      if (newStatus === 'accepted') setIsIncoming(false);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
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
  let iconName = 'person_add';

  if (status === 'pending') {
    visualClasses = 'bg-[#FF5500]/10 border-[#FF5500]/40 text-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.2)]';
    iconName = 'person_add';
  } else if (status === 'accepted') {
    visualClasses = 'bg-[#00FF66]/10 border-[#00FF66]/40 text-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.2)]';
    iconName = isAi ? 'smart_toy' : 'group';
  } else if (status === 'rejected') {
    visualClasses = 'bg-[#FF0033]/10 border-[#FF0033]/40 text-[#FF0033] shadow-[0_0_20px_rgba(255,0,51,0.2)]';
    iconName = 'block';
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={toggleMatch}
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

        {status === 'pending' && isIncoming && !loading && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction('accepted'); }}
              className="w-8 h-8 rounded bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] flex items-center justify-center hover:bg-[#00FF66]/40 transition-all"
              title="Aprovar"
            >
              <span className="material-symbols-outlined text-sm">check</span>
            </button>
            <button 
              onClick={(e) => handleOpenModal(e, 'reject')}
              className="w-8 h-8 rounded bg-[#FF0033]/20 border border-[#FF0033]/40 text-[#FF0033] flex items-center justify-center hover:bg-[#FF0033]/40 transition-all"
              title="Reprovar"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmAction}
        title={modalAction === 'unmatch' ? 'REMOVER_CANAL' : 'REPROVAR_SINAL'}
        message={modalAction === 'unmatch' 
          ? 'Deseja realmente encerrar este desvio? Os envios de mensagens serao bloqueadas.' 
          : 'Deseja realmente ignorar este sinal? Os envios de mensagens serao bloqueadas.'
        }
        confirmText={modalAction === 'unmatch' ? 'REMOVER' : 'REPROVAR'}
        variant="danger"
      />
    </>
  );
};
