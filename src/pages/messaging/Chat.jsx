import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { formatTime } from '@/utils/dateUtils';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Avatar, Loading, BackButton } from '@/components/ui';
import { PageHeader } from '@/components/patterns';

export function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setActiveChat, fetchCounts } = useNotificationStore();
  const currentUserId = user?.id;

  const [recipient, setRecipient] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const scrollRef = useRef();
  const isInitialLoad = useRef(true);
  const lastMessageIdRef = useRef(null);
  const isTypingSentRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const currentUserAvatar = user?.profile_image_url;
  const recipientAvatar = recipient?.profile_image_url;

  // Inicializa o Reconhecimento de Voz (Web Speech API - 100% Gratuito, Zero Tokens!)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setNewMessage(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      rec.onerror = (event) => {
        console.error('Erro na transcrição de voz:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('[MICROFONE]: Permissão negada. Ative o microfone nas configurações do navegador.');
        } else if (event.error === 'no-speech') {
          console.log('Nenhuma fala detectada.');
        } else {
          setErrorMessage('[MICROFONE]: Erro na captura de voz. Tente novamente.');
        }
        setTimeout(() => setErrorMessage(''), 5000);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const handleToggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('[MICROFONE]: Gravação de voz não é suportada neste navegador.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error('Erro ao iniciar reconhecimento de voz:', err);
      }
    }
  };

  useEffect(() => {
    setActiveChat(id);
    return () => setActiveChat(null);
  }, [id, setActiveChat]);

  const aiSuggestions = useMemo(() => {
    const interests = [
      ...(recipient?.interests || []),
      ...(recipient?.user_interests || []),
    ].map((interest) => (
      typeof interest === 'string' ? interest : interest?.name
    )).filter(Boolean);

    const mainInterest = interests[0];
    const location = recipient?.city || recipient?.location || recipient?.state;
    const lastIncomingMessage = [...messages].reverse().find((msg) => msg.sender_id !== currentUserId);

    // Se já houver histórico de conversa (resposta rápida ou gancho de engajamento)
    if (lastIncomingMessage) {
      return [
        `Gostei do papo! Mas me conta... o que mais você faz da vida quando não está me intrigando por aqui? rs`,
        `Confesso que curti a energia. Qual seria um bom desvio da rotina pra gente hoje? 😉`,
        `Sobre o que você comentou por último: concordo super! O que mais te atrai nesse tipo de situação?`
      ];
    }

    // Se for quebra-gelo inicial (primeira mensagem do chat)
    return [
      mainInterest
        ? `Vi no seu perfil que você curte ${mainInterest.toLowerCase()}. O que te levou a se apaixonar por isso? rs`
        : `Se você pudesse fazer um desvio da sua rotina agora mesmo para fazer qualquer coisa no mundo, o que seria?`,
      location
        ? `Qual é o melhor 'desvio' escondido para tomar um café ou conversar de boa em ${location}? kkk`
        : `Você é do tipo que prefere planejar tudo certinho ou se joga no desvio mais espontâneo que aparecer? rs`,
      `Uma pergunta rápida para quebrar o gelo: qual é a coisa simples que quase sempre salva o seu dia? 😉`
    ];
  }, [messages, recipient, currentUserId]);

  const handleUseSuggestion = (suggestion) => {
    setNewMessage(suggestion);
    setShowAiSuggestions(false);
  };

  const sendTypingStatus = useCallback(async (typing) => {
    if (!currentMatch?.id || !currentUserId) return;
    try {
      await supabase
        .from('matches')
        .update({ typing_user_id: typing ? currentUserId : null })
        .eq('id', currentMatch.id);
      isTypingSentRef.current = typing;
    } catch (err) {
      console.error('Error sending typing status:', err);
    }
  }, [currentMatch?.id, currentUserId]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!currentUserId || !currentMatch) return;

    // Se começou a digitar e ainda não enviou o sinal, envia
    if (!isTypingSentRef.current && value.trim().length > 0) {
      sendTypingStatus(true);
    }

    // Se o usuário apagou o texto completamente, limpa o sinal imediatamente
    if (value.trim().length === 0 && isTypingSentRef.current) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
      return;
    }

    // Reinicia o temporizador (debounce) de 3 segundos para limpar o sinal se parar de digitar
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingSentRef.current) {
        sendTypingStatus(false);
      }
    }, 3000);
  };

  // Garante a limpeza do status de digitação ao sair da conversa (desmontar)
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingSentRef.current && currentMatch?.id && currentUserId) {
        supabase
          .from('matches')
          .update({ typing_user_id: null })
          .eq('id', currentMatch.id)
          .then(() => { });
      }
    };
  }, [currentMatch?.id, currentUserId]);

  const fetchChatData = useCallback(async () => {
    if (!currentUserId || !id) {
      setLoading(false);
      return;
    }

    // Buscar destinatário e match em paralelo
    const [{ data: recipientData }, { data: matchData }] = await Promise.all([
      supabase.from('users').select('*').eq('id', id).single(),
      supabase.from('matches')
        .select('*')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${currentUserId})`)
        .maybeSingle()
    ]);

    if (recipientData) setRecipient(recipientData);

    if (matchData) {
      // Verifica se o match está aceito
      if (matchData.status !== 'accepted') {
        setErrorMessage('CONEXÃO_PENDENTE: Você só pode conversar após o match ser aprovado.');
        setLoading(false);
        return;
      }
      setCurrentMatch(matchData);
      setIsTyping(matchData.typing_user_id === id);

      // Carrega apenas as últimas 10 mensagens
      const { data: initialMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (initialMsgs) {
        // Inverte para ficar em ordem cronológica antes de exibir
        const sortedMsgs = [...initialMsgs].reverse();
        setMessages(sortedMsgs);
        setHasMore(initialMsgs.length === 10);
      }

      // Marca as mensagens recebidas como lidas
      const { error: readError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchData.id)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);

      if (!readError) {
        fetchCounts(currentUserId);
      }
    } else {
      setErrorMessage('SEM_CONEXÃO: Envie um sinal e aguarde a aprovação para conversar.');
    }
    setLoading(false);
  }, [currentUserId, id, fetchCounts]);

  const fetchOlderMessages = async () => {
    if (!currentMatch?.id || loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);

    // Captura o contêiner de scroll
    const container = scrollRef.current?.parentNode;
    const previousScrollHeight = container ? container.scrollHeight : 0;
    const previousScrollTop = container ? container.scrollTop : 0;

    try {
      const oldestMessage = messages[0];
      const { data: olderMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', currentMatch.id)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(10);

      if (olderMsgs && olderMsgs.length > 0) {
        const sortedOlder = [...olderMsgs].reverse();
        setMessages(prev => [...sortedOlder, ...prev]);
        setHasMore(olderMsgs.length === 10);

        // Mantém a posição do scroll estática para evitar pulo visual
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - previousScrollHeight + previousScrollTop;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error('Erro ao carregar mensagens antigas:', e);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    // Se chegou perto do topo e tem mais mensagens, busca as mais antigas
    if (scrollTop <= 5 && hasMore && !loadingOlder && messages.length > 0) {
      fetchOlderMessages();
    }
  };

  useEffect(() => {
    fetchChatData();
  }, [fetchChatData]);

  useEffect(() => {
    if (!currentMatch?.id) return;

    // Inscrição em tempo real focada apenas neste match
    const channel = supabase
      .channel(`chat-${currentMatch.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async payload => {
          console.log('⚡ Realtime Message Insert:', payload);
          if (payload.new.match_id !== currentMatch.id) return;

          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });

          // Se a mensagem for do outro usuário, marca como lida e limpa o badge
          if (payload.new.sender_id !== currentUserId) {
            const { error: readError } = await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', payload.new.id);
            if (!readError) {
              fetchCounts(currentUserId);
            }
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${currentMatch.id}`
        },
        payload => {
          console.log('⚡ Realtime Matches Update:', payload);
          const typingId = payload.new.typing_user_id;
          console.log(`🤖 Is recipient typing? Match typing ID: ${typingId}, Recipient ID: ${id}`);
          setIsTyping(typingId === id);
        }
      )
      .subscribe((status, err) => {
        console.log(`🔌 Realtime Subscription [chat-${currentMatch.id}] Status:`, status);
        if (err) console.error('🔌 Realtime Subscription Error:', err);
      });

    return () => { supabase.removeChannel(channel); };
  }, [currentMatch?.id, currentUserId, id, fetchCounts]);

  // Polling fallback para garantir sincronização do chat mesmo se os WebSockets falharem na VPS
  const fetchNewMessages = useCallback(async () => {
    if (!currentMatch?.id) return;
    try {
      // 1. Busca apenas a última mensagem para detecção rápida e o status de digitação
      const [{ data: lastMsgData }, { data: matchData }] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('match_id', currentMatch.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('matches')
          .select('typing_user_id')
          .eq('id', currentMatch.id)
          .maybeSingle()
      ]);

      if (matchData) {
        setIsTyping(matchData.typing_user_id === id);
      }

      const lastMsg = lastMsgData?.[0];
      if (lastMsg) {
        setMessages(prev => {
          // Se a última mensagem do banco de dados não está no state local, faz o delta
          if (prev.length === 0 || !prev.some(m => m.id === lastMsg.id)) {
            console.log('🔄 Novas mensagens detectadas via polling fallback!');
            if (prev.length === 0) {
              fetchChatData();
              return prev;
            }
            const newestLocal = prev[prev.length - 1];
            // Busca apenas o delta
            supabase
              .from('messages')
              .select('*')
              .eq('match_id', currentMatch.id)
              .gt('created_at', newestLocal.created_at)
              .order('created_at', { ascending: true })
              .then(({ data: deltaMsgs }) => {
                if (deltaMsgs && deltaMsgs.length > 0) {
                  setMessages(current => {
                    const unique = deltaMsgs.filter(dm => !current.some(c => c.id === dm.id));
                    return [...current, ...unique];
                  });

                  // Se houver mensagens do outro usuário, marca como lidas e atualiza contadores
                  const incomingIds = deltaMsgs
                    .filter(dm => dm.sender_id !== currentUserId)
                    .map(dm => dm.id);

                  if (incomingIds.length > 0) {
                    supabase
                      .from('messages')
                      .update({ is_read: true })
                      .in('id', incomingIds)
                      .then(({ error: readError }) => {
                        if (!readError) {
                          fetchCounts(currentUserId);
                        }
                      });
                  }
                }
              });
          }
          return prev;
        });
      }
    } catch (e) {
      console.error('Erro no polling do chat:', e);
    }
  }, [currentMatch?.id, id, fetchChatData, currentUserId, fetchCounts]);

  useEffect(() => {
    if (!currentMatch?.id) return;
    const interval = setInterval(fetchNewMessages, 3000);
    return () => clearInterval(interval);
  }, [currentMatch?.id, fetchNewMessages]);

  useEffect(() => {
    if (recipient?.name) {
      document.title = `${recipient.name.toUpperCase()} | DESVIO`;
    }
    return () => {
      document.title = 'Desvio';
    };
  }, [recipient]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const textToSend = newMessage.trim();
    if (!textToSend || !currentUserId || !currentMatch) return;

    // Limpa o temporizador e o status de digitação no envio
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingSentRef.current) {
      sendTypingStatus(false);
    }

    // 0. Validação Cliente-Side (Escudo 1)
    const cleanText = textToSend.toLowerCase();

    // a. E-mails (normais e obfuscados com "at" e "dot")
    const emailRegex = /([a-z0-9._%+-]+)\s*(@|\[at\]|\(at\)|at)\s*([a-z0-9.-]+)\s*(\.|\[dot\]|\(dot\)|dot)\s*([a-z]{2,})/gi;

    // b. Redes Sociais comuns e handles
    const socialRegex = /(insta(gram)?|face(book)?|whats(app)?|wpp|zap|telegram|tg|snap(chat)?|twitter|tt|tiktok|discord|dc)\s*(:|é|e|:|handle|user|perfil)?\s*(@?[a-z0-9._-]+)|(instagram\.com|facebook\.com|wa\.me|t\.me)/gi;

    // c. Telefones normalizados (remove tudo que não for dígito e checa se tem entre 8 e 12 números)
    const numbersOnly = cleanText.replace(/[^0-9]/g, '');

    // d. Telefones escritos por extenso
    let phoneticText = cleanText;
    phoneticText = phoneticText.replace(/zero/g, '0');
    phoneticText = phoneticText.replace(/um/g, '1');
    phoneticText = phoneticText.replace(/dois/g, '2');
    phoneticText = phoneticText.replace(/três/g, '3');
    phoneticText = phoneticText.replace(/quatro/g, '4');
    phoneticText = phoneticText.replace(/cinco/g, '5');
    phoneticText = phoneticText.replace(/seis/g, '6');
    phoneticText = phoneticText.replace(/sete/g, '7');
    phoneticText = phoneticText.replace(/oito/g, '8');
    phoneticText = phoneticText.replace(/nove/g, '9');
    const phoneticNumbers = phoneticText.replace(/[^0-9]/g, '');

    const hasEmail = emailRegex.test(cleanText);
    const hasSocial = socialRegex.test(cleanText);
    const hasPhone = (numbersOnly.length >= 8 && numbersOnly.length <= 12) ||
      (phoneticNumbers.length >= 8 && phoneticNumbers.length <= 12);

    if (hasEmail || hasSocial || hasPhone) {
      let detectType = 'dados de contato';
      if (hasEmail) detectType = 'e-mail';
      else if (hasPhone) detectType = 'número de telefone';
      else if (hasSocial) detectType = 'perfil de rede social';

      setErrorMessage(`[SEGURANÇA]: Não é permitido compartilhar ${detectType} no chat.`);
      setTimeout(() => setErrorMessage(''), 6000);
      return;
    }

    // 1. Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      match_id: currentMatch.id,
      sender_id: currentUserId,
      content: textToSend,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setIsTyping(false);

    try {
      setErrorMessage('');

      // 2. Real Insert
      const { data: insertedMsg, error: sendError } = await supabase
        .from('messages')
        .insert({
          match_id: currentMatch.id,
          sender_id: currentUserId,
          content: textToSend
        })
        .select()
        .single();

      if (sendError) {
        // Rollback on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(textToSend);

        if (sendError.message.includes('Segurança:')) {
          setErrorMessage('[ALERTA]: Bloqueio de segurança. Dados sensíveis são proibidos.');
        } else {
          throw sendError;
        }
        setTimeout(() => setErrorMessage(''), 6000);
        return;
      }

      // 3. Replace temp message with real message from DB (to get correct UUID and timestamp)
      setMessages(prev => prev.map(m => m.id === tempId ? insertedMsg : m));

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(textToSend);
      setErrorMessage('Erro de conexão ao enviar a mensagem. Tente novamente.');
      setTimeout(() => setErrorMessage(''), 6000);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const newestMessage = messages[messages.length - 1];
      const isNewMessageAtBottom = newestMessage.id !== lastMessageIdRef.current;

      if (isInitialLoad.current) {
        // Atraso de 100ms garante que o layout e as imagens terminaram de renderizar
        const timer = setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'auto' });
          isInitialLoad.current = false;
        }, 100);
        lastMessageIdRef.current = newestMessage.id;
        return () => clearTimeout(timer);
      } else if (isNewMessageAtBottom) {
        // Deslocamento suave APENAS se uma nova mensagem realmente chegou ao final (digitada ou recebida)
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        lastMessageIdRef.current = newestMessage.id;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping]);

  if (loading) return <Loading fullScreen message="INICIANDO CONVERSAS ..." />;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-180px)] overflow-hidden">
      {/* Title Row */}
      <div className="flex items-center gap-6 px-4 pt-2 pb-4 shrink-0">
        <BackButton to="/conversations" title="Voltar para Conversas" />
        <div
          className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity flex-1"
          onClick={() => navigate(`/user/${id}`)}
        >
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">
            {recipient?.name || 'CARREGANDO...'}
          </h1>
          <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
        </div>
      </div>

      {/* Message Area - Scrollable */}
      <main
        onScroll={handleScroll}
        className="subtle-scrollbar flex-1 overflow-y-auto p-4 space-y-4 md:space-y-6"
      >
        {loadingOlder && (
          <div className="flex justify-center items-center py-2 animate-pulse">
            <span className="text-[7px] font-black tracking-[0.3em] uppercase text-primary animate-bounce">CARREGANDO_MENSAGENS_ANTIGAS...</span>
          </div>
        )}

        {messages.map((msg) => {
          const isOwnMessage = msg.sender_id === currentUserId;
          const avatarSrc = isOwnMessage ? currentUserAvatar : recipientAvatar;
          const avatarAlt = isOwnMessage ? (user?.name || 'Voce') : (recipient?.name || 'Contato');

          return (
            <div key={msg.id} className={`flex items-start gap-2 md:gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              {!isOwnMessage && (
                <div onClick={() => navigate(`/user/${id}`)} className="cursor-pointer hover:scale-105 transition-transform active:scale-95">
                  <Avatar
                    src={avatarSrc}
                    alt={avatarAlt}
                    size="sm"
                    variant="glass"
                    className="md:w-10 md:h-10 grayscale-[25%]"
                  />
                </div>
              )}

              <div className={`max-w-[calc(100%-44px)] sm:max-w-[75%] md:max-w-[60%] p-4 md:p-5 rounded md:rounded shadow-2xl ${isOwnMessage
                ? 'bg-primary text-black rounded-tr-none font-bold'
                : 'bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-tl-none'
                }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <span className={`text-[7px] md:text-[8px] font-black mt-2 block opacity-40 uppercase tracking-widest ${isOwnMessage ? 'text-black' : 'text-white'}`}>
                  {formatTime(msg.created_at)}
                </span>
              </div>

            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-white/5 w-fit rounded border border-white/10 ml-2 animate-pulse">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </main>

      {/* Footer - Optimized for Mobile Bottom Safe Area */}
      <footer className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-3xl border-t border-white/5 shrink-0">
        <div className="max-w-[1000px] mx-auto w-full relative">
          {/* IA Suggestions Dropdown (Absolute above input) */}
          {showAiSuggestions && (
            <div className="absolute bottom-full left-0 right-0 mb-4 z-50">
              <div className="subtle-scrollbar flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-3">
                {aiSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleUseSuggestion(suggestion)}
                    className="snap-center shrink-0 w-[260px] min-h-[48px] px-5 py-3 flex items-center justify-center bg-black/80 backdrop-blur-xl border border-white/10 rounded text-left text-[10px] font-bold leading-snug text-white/70 hover:bg-white/10 hover:text-white hover:border-primary/40 transition-all active:scale-95 sm:w-[280px] lg:w-full shadow-2xl"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Alert - Compact */}
          {errorMessage && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-3 animate-fade-in">
              <span className="material-symbols-outlined text-red-500 text-lg">error</span>
              <p className="text-[8px] font-black uppercase tracking-widest text-red-500 leading-tight">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 items-center">
            {/* AI Button (Left) */}
            <button
              type="button"
              onClick={() => setShowAiSuggestions((isOpen) => !isOpen)}
              className={`w-14 h-14 md:w-16 md:h-16 shrink-0 rounded border flex items-center justify-center transition-all active:scale-95 ${showAiSuggestions
                ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20'
                : 'bg-white/5 text-primary border-white/10 hover:bg-white/10'
                }`}
            >
              <span className="material-symbols-outlined text-xl md:text-2xl">auto_awesome</span>
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={isListening ? "Ouvindo... Fale agora." : "Escreva algo inteligente..."}
                className="w-full bg-white/5 border border-white/10 rounded pl-4 pr-11 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20 sm:pl-6 sm:pr-12 md:py-5"
              />
              <button
                type="button"
                onClick={handleToggleListening}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all active:scale-90 ${isListening ? 'text-[#FF5500] scale-110' : 'text-white/20 hover:text-white/50'
                  }`}
                title="Gravar Áudio para Texto (Sem gastar tokens!)"
              >
                <span className={`material-symbols-outlined text-xl ${isListening ? 'animate-pulse font-bold' : ''}`}>
                  mic
                </span>
              </button>
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-14 h-14 md:w-16 md:h-16 bg-primary text-black rounded flex shrink-0 items-center justify-center shadow-xl shadow-primary/20 disabled:opacity-20 active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined font-black text-xl md:text-2xl">send</span>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
