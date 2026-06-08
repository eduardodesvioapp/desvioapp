import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/patterns/PageHeader';
import { Avatar, Loading } from '@/components/ui';
import { formatConversationTime } from '@/utils/dateUtils';

/**
 * Conversations - Lista todas as conversas abertas do usuário.
 * Baseado em matches existentes (criados automaticamente ao enviar mensagem).
 */
export const Conversations = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingMatches, setPendingMatches] = useState([]);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      // 1. Pegar todos os matches do usuário
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id, 
          user1_id, 
          user2_id, 
          created_at, 
          status, 
          requester_id,
          user1:users!user1_id (id, name, profile_image_url, is_human),
          user2:users!user2_id (id, name, profile_image_url, is_human)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error || !matches?.length) {
        setChats([]);
        setPendingMatches([]);
        setLoading(false);
        return;
      }

      // Separa matches aceitos (chats) e pendentes (todos)
      const accepted = matches.filter(m => m.status === 'accepted');
      const pending = matches.filter(m => m.status === 'pending');

      // Mapeia os dados dos usuários pendentes
      const pendingUsers = pending.map(m => {
        const isOtherUser1 = m.user1_id !== user.id;
        const otherUser = isOtherUser1 ? m.user1 : m.user2;
        return {
          ...otherUser,
          matchId: m.id,
          badgeIcon: isOtherUser1 ? 'upload' : 'download'
        };
      });

      setPendingMatches(pendingUsers);

      if (!accepted.length) {
        setChats([]);
        setLoading(false);
        return;
      }

      // 2. Enriquecer cada match aceito com última mensagem + unread
      const enriched = await Promise.all(
        accepted.map(async (match) => {
          const otherUser = match.user1_id === user.id ? match.user2 : match.user1;

          if (!otherUser || otherUser.id === user.id) return null;

          const { data: lastMsgs } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          return {
            matchId: match.id,
            otherUser,
            lastMessage: lastMsgs?.[0] ?? null,
            unreadCount: unreadCount ?? 0,
            lastActivity: lastMsgs?.[0]?.created_at ?? match.created_at,
          };
        })
      );

      const validChats = enriched.filter(Boolean);
      validChats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      setChats(validChats);
    } catch (err) {
      console.error('[Conversations] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchConversations();

    const channel = supabase
      .channel(`conversations-${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchConversations)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchConversations, user?.id]);

  // Filtro local por nome
  const filtered = useMemo(
    () =>
      chats.filter((c) =>
        c.otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [chats, searchQuery]
  );



  const totalUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="max-w-[100%] mx-auto">
      {/* Title Row - Immediately below header */}
      <div className="flex items-center gap-4 mb-8 px-4">
        <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5500] whitespace-nowrap">
          CONVERSAS
        </h1>
        <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
      </div>

      <div className="px-4">
        {/* Horizontal Pending List (Matches) - Only Avatars */}
        {pendingMatches.length > 0 && (
          <div className="mb-10">
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
              {pendingMatches.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/user/${p.id}`)}
                  className="relative shrink-0 cursor-pointer group"
                >
                  <Avatar
                    src={p.profile_image_url}
                    alt={p.name}
                    size="custom"
                    variant="raw"
                    className="w-[70px] h-[70px] border-2 border-primary grayscale group-hover:grayscale-0 transition-all duration-500 hover:scale-105"
                  />

                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-transparent flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-[20px] text-primary drop-shadow-[0_0_10px_rgba(255,85,0,0.8)]"
                      style={{ fontVariationSettings: "'WGHT' 900, 'GRAD' 200" }}
                    >
                      {p.badgeIcon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de pesquisa */}
        <div className="flex justify-end mb-8 md:mb-12">
          <div className="relative w-full md:w-64 shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-lg">search</span>
            <input
              type="text"
              placeholder="PESQUISAR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 py-3 pl-10 pr-8 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/40 transition-all placeholder:text-white/20 rounded-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <Loading message="CARREGANDO CONVERSAS ..." />
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5">
            <span className="material-symbols-outlined text-5xl text-white/10 mb-4">person_add</span>
            <h3 className="text-base font-bold text-white/40">Nenhuma conexão aprovada ainda</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhum resultado para "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((chat) => (
              <div
                key={chat.matchId}
                onClick={() => navigate(`/chat/${chat.otherUser.id}`)}
                className="group relative flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all cursor-pointer overflow-hidden rounded-2xl"
              >
                {/* Barra de não lida */}
                {chat.unreadCount > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary shadow-[2px_0_12px_rgba(255,80,0,0.6)]" />
                )}

                {/* Avatar + badge */}
                <div className="relative shrink-0">
                  <Avatar
                    src={chat.otherUser.profile_image_url}
                    alt={chat.otherUser.name}
                    size="lg"
                    variant="raw"
                    className={`border-2 transition-colors ${chat.unreadCount > 0
                        ? 'border-primary'
                        : 'border-white/10 group-hover:border-primary/40'
                      }`}
                  />
                  {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-black text-[9px] font-black flex items-center justify-center">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-bold text-base truncate flex items-center gap-2 ${chat.unreadCount > 0 ? 'text-white' : 'text-white/70'}`}>
                      {chat.otherUser.name}
                      {chat.otherUser.is_human === false && (
                        <span className="bg-primary/20 text-primary text-[8px] px-1 py-0.5 rounded border border-primary/30 font-black">IA</span>
                      )}
                    </h3>
                    <span className="text-[10px] font-mono text-white/20 whitespace-nowrap ml-3">
                      {formatConversationTime(chat.lastActivity)}
                    </span>
                  </div>
                  <p className={`text-xs truncate leading-snug ${chat.unreadCount > 0 ? 'text-white/80 font-medium' : 'text-white/30'}`}>
                    {chat.lastMessage ? (
                      <>
                        {chat.lastMessage.sender_id === user.id && (
                          <span className="text-primary/50 mr-1">Você:</span>
                        )}
                        {chat.lastMessage.content}
                      </>
                    ) : (
                      <span className="italic">Sem mensagens ainda...</span>
                    )}
                  </p>
                </div>

                {/* Arrow */}
                <span className="material-symbols-outlined text-white/10 group-hover:text-primary text-base shrink-0 transition-colors">
                  arrow_forward_ios
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
