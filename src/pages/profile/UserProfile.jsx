import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard, PremiumButton, Badge, MatchedButton, LikedButton, Avatar, Loading, ReportModal, BackButton } from '@/components/ui';
import { ActionNavBar, PageHeader, UserProfileDetail } from '@/components/patterns';
import { validateImageFace, validateImageUrlFace } from '@/lib/faceDetection';
import { toast } from 'sonner';

export function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getProfileProgress, signOut } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [media, setMedia] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myScore, setMyScore] = useState(0);
  const [isBlocked, setIsBlocked] = useState(true);
  const [checkingScore, setCheckingScore] = useState(true);
  const [metrics, setMetrics] = useState({
    entropy: 0,
    pulse: 0,
    resonance: 0,
    hex: ''
  });
  const [matchStatus, setMatchStatus] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [accessRequest, setAccessRequest] = useState(null);
  const [galleryRequests, setGalleryRequests] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState({ id: null, action: null });
  const [error, setError] = useState(null);
  const [hasPrivateGallery, setHasPrivateGallery] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [likeStatus, setLikeStatus] = useState('none');

  const isOwnProfile = user?.id === id;
  const hasAccess = isOwnProfile || accessRequest?.status === 'approved';
  const isBlockedByOwner = accessRequest?.status === 'blocked';

  const filteredMedia = media.filter(m => m.url !== profile?.profile_image_url);
  const publicPhotos = filteredMedia.filter(m => !m.is_private);
  const privatePhotos = filteredMedia.filter(m => m.is_private);
  const visibleMedia = hasAccess ? filteredMedia : publicPhotos;

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    if (!selectedImage) return;
    const currentIndex = visibleMedia.findIndex(m => m.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % visibleMedia.length;
    setSelectedImage(visibleMedia[nextIndex]);
  }, [selectedImage, visibleMedia]);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    if (!selectedImage) return;
    const currentIndex = visibleMedia.findIndex(m => m.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + visibleMedia.length) % visibleMedia.length;
    setSelectedImage(visibleMedia[prevIndex]);
  }, [selectedImage, visibleMedia]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Listeners for match/like card synchronization
    const handleMatchChange = (e) => {
      if (e.detail?.userId === id) setMatchStatus(e.detail.status);
    };
    const handleLikeChange = (e) => {
      if (e.detail?.userId === id) setLikeStatus(e.detail.status);
    };
    
    window.addEventListener('matchStatusChanged', handleMatchChange);
    window.addEventListener('likeStatusChanged', handleLikeChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('matchStatusChanged', handleMatchChange);
      window.removeEventListener('likeStatusChanged', handleLikeChange);
    };
  }, [selectedImage, handleNext, handlePrev, id]);

  const fetchData = useCallback(async () => {
    if (!user?.id || !id) return;

    try {
      setLoading(true);

      const seed = id.split('-')[0];
      const resonanceBase = parseInt(seed, 16) % 30 + 70;
      setMetrics({
        entropy: (parseInt(seed, 16) % 40) + 40,
        pulse: (parseInt(seed, 16) % 15) + 2,
        resonance: resonanceBase,
        hex: '0x' + seed.toUpperCase()
      });

      const score = await getProfileProgress(user.id);
      setMyScore(score);
      setCheckingScore(false);

      if (score >= 85) {
        setIsBlocked(false);

        const [{ data: userData, error: userError }, { data: distData }, { data: mediaData }, { data: interestsData }, { data: hasPrivate }] = await Promise.all([
          supabase.from('users').select('*').eq('id', id).maybeSingle(),
          supabase.rpc('get_safe_distance', { target_user_id: id }),
          supabase.from('user_media').select('*').eq('user_id', id).order('created_at', { ascending: false }),
          supabase.from('user_interests').select('interest:interests(name)').eq('user_id', id),
          !isOwnProfile ? supabase.rpc('check_user_has_private_gallery', { p_user_id: id }) : Promise.resolve({ data: true })
        ]);

        if (userError) throw userError;
        setProfile({ ...userData, kmAway: distData ? Math.round(distData) : null });
        setMedia(mediaData || []);
        setInterests(interestsData?.map(i => i.interest?.name) || []);
        setHasPrivateGallery(hasPrivate === true);

        // Busca status do match
        const { data: matchData } = await supabase
          .from('matches')
          .select('status')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${user.id})`)
          .maybeSingle();

        setMatchStatus(matchData?.status || 'none');

        // Busca status do like
        const { data: likeData } = await supabase
          .from('likes')
          .select('status, user_id')
          .or(`and(user_id.eq.${user.id},liked_user_id.eq.${id}),and(user_id.eq.${id},liked_user_id.eq.${user.id})`)
          .maybeSingle();

        if (likeData) {
          if (likeData.status === 'accepted') {
            setLikeStatus('accepted');
          } else if (likeData.user_id === user.id) {
            setLikeStatus('liked');
          } else {
            setLikeStatus('none');
          }
        } else {
          setLikeStatus('none');
        }
        if (!isOwnProfile) {
          const { data: requestData } = await supabase
            .from('gallery_access_requests')
            .select('*')
            .eq('requester_id', user.id)
            .eq('owner_id', id)
            .maybeSingle();
          setAccessRequest(requestData);
        } else {
          // Se for dono, busca solicitações pendentes
          const { data: requestsData } = await supabase
            .from('gallery_access_requests')
            .select('*, requester:users!requester_id(id, name, profile_image_url)')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });
          setGalleryRequests(requestsData || []);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [id, user, getProfileProgress, isOwnProfile]);

  const handleUpload = async (event, isPrivate = false) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setUploading(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('user_media')
        .insert({
          user_id: user.id,
          url: publicUrl,
          is_private: isPrivate,
          is_profile: false
        });

      if (dbError) throw dbError;

      if (media.length === 0 && !isPrivate) {
        const hasFace = await validateImageFace(file);
        if (hasFace) {
          await supabase.from('user_media').update({ is_profile: true }).eq('url', publicUrl);
          await supabase.from('users').update({ profile_image_url: publicUrl }).eq('id', user.id);
          toast.success('PERFIL ATUALIZADO COM SUCESSO');
        }
      }

      toast.success(isPrivate ? 'MÍDIA ADICIONADA AO COFRE' : 'MÍDIA PUBLICADA COM SUCESSO');
      const { fetchUserProfile } = useAuthStore.getState();
      await fetchUserProfile(user.id);
      await fetchData();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('FALHA NO UPLOAD DA MÍDIA');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (idToDelete, url) => {
    if (!confirm('Excluir esta mídia permanentemente?')) return;

    try {
      setProcessing({ id: idToDelete, action: 'delete' });
      const path = url.split('/media/')[1];
      if (path) {
        await supabase.storage.from('media').remove([path]);
      }

      const { error: deleteError } = await supabase
        .from('user_media')
        .delete()
        .eq('id', idToDelete);

      if (deleteError) throw deleteError;

      const { data: userData } = await supabase.from('users').select('profile_image_url').eq('id', user.id).single();
      if (userData?.profile_image_url === url) {
        await supabase.from('users').update({ profile_image_url: null }).eq('id', user.id);
        const { fetchUserProfile } = useAuthStore.getState();
        await fetchUserProfile(user.id);
      }

      toast.success('MÍDIA EXCLUÍDA');
      setMedia(prev => prev.filter(m => m.id !== idToDelete));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('ERRO AO EXCLUIR MÍDIA');
    } finally {
      setProcessing({ id: null, action: null });
    }
  };

  const handleSetProfile = async (mediaId, url) => {
    try {
      setProcessing({ id: mediaId, action: 'profile' });
      setError(null);

      const hasFace = await validateImageUrlFace(url);
      if (!hasFace) {
        toast.error('NENHUM ROSTO DETECTADO', {
          description: 'Esta imagem não atende aos requisitos de ID Digital.'
        });
        return;
      }

      await supabase.from('user_media').update({ is_profile: false }).eq('user_id', user.id);
      await supabase.from('user_media').update({ is_profile: true }).eq('id', mediaId);
      await supabase.from('users').update({ profile_image_url: url }).eq('id', user.id);
      
      toast.success('FOTO DE PERFIL ATUALIZADA');
      const { fetchUserProfile } = useAuthStore.getState();
      await fetchUserProfile(user.id);
      await fetchData();
    } catch (err) {
      console.error('Error setting profile pic:', err);
      toast.error('ERRO AO DEFINIR PERFIL');
    } finally {
      setProcessing({ id: null, action: null });
    }
  };

  const handleTogglePrivate = async (mediaId, currentIsPrivate) => {
    try {
      setProcessing({ id: mediaId, action: 'private' });
      await supabase.from('user_media')
        .update({ 
          is_private: !currentIsPrivate,
          is_profile: false
        })
        .eq('id', mediaId);
      
      toast.success(currentIsPrivate ? 'MÍDIA TORNADA PÚBLICA' : 'MÍDIA MOVIDA PARA O COFRE');
      await fetchData();
    } catch (err) {
      console.error('Error toggling privacy:', err);
      toast.error('ERRO AO ALTERAR PRIVACIDADE');
    } finally {
      setProcessing({ id: null, action: null });
    }
  };

  const recordVisit = useCallback(async () => {
    if (!user?.id || !id || isOwnProfile) return;
    
    try {
      // Usa upsert para inserir ou atualizar a última visita em uma única chamada
      // Isso evita erros de concorrência e chave duplicada (23505)
      const { error } = await supabase
        .from('profile_visits')
        .upsert({
          visitor_id: user.id,
          visited_id: id,
          last_visit_at: new Date().toISOString(),
          is_read: false // Opcional: define como não lido em novas visitas se desejar
        }, { 
          onConflict: 'visitor_id,visited_id',
          ignoreDuplicates: false // Queremos atualizar o last_visit_at
        });

      if (error && error.code !== '23505') throw error;
    } catch (err) {
      console.error('[UserProfile] Falha ao gerenciar registro de visita:', err);
    }
  }, [id, user?.id, isOwnProfile]);

  useEffect(() => {
    fetchData();
    recordVisit();
    
    // Realtime subscription inalterado...
    const channel = supabase
      .channel(`access-refresh-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gallery_access_requests',
        filter: `owner_id=eq.${id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, id, recordVisit]);

  const handleRequestAccess = async () => {
    if (!user?.id || !id || isOwnProfile) return;

    try {
      const { data, error } = await supabase
        .from('gallery_access_requests')
        .insert({
          requester_id: user.id,
          owner_id: id,
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      setAccessRequest(data);
    } catch (err) {
      console.error('Error requesting access:', err);
    }
  };

  const handleUpdateAccessRequest = async (requestId, status) => {
    try {
      const { error } = await supabase
        .from('gallery_access_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      setGalleryRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, status } : req
      ));
    } catch (err) {
      console.error('Error updating access request:', err);
    }
  };



  if (loading || checkingScore) return <Loading fullScreen message="CARREGANDO PERFIL ..." />;

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center text-center">
        <GlassCard variant="intense" padding="p-8 md:p-12" className="max-w-md text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded">
            <span className="material-symbols-outlined text-primary text-3xl md:text-4xl">lock</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-black italic mb-4 tracking-tighter">Acesso Restrito</h1>
          <p className="text-white/40 mb-10 text-sm leading-relaxed">
            Sua ressonância atual é de <span className="text-primary font-bold">{myScore}%</span>. <br />
            A política do Desvio exige no mínimo <span className="text-white font-bold">85%</span> para desbloquear galerias.
          </p>
          <PremiumButton fullWidth onClick={() => navigate('/profile/edit')}>
            Completar Meu Perfil
          </PremiumButton>
        </GlassCard>
      </div>
    );
  }


  return (
    <>
      <div className="w-full">
        <div className="flex items-center gap-6 mb-6 px-4">
          <BackButton />
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5500] whitespace-nowrap">
            PERFIL
          </h1>
          <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
        </div>

        {isOwnProfile && (
          <div className="px-4 mb-8 flex flex-wrap gap-2">
            <Link
              to="/profile/edit"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 flex items-center gap-2 rounded transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Editar Perfil
            </Link>

            <Link
              to="/settings/security"
              title="Segurança"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 p-2 flex items-center justify-center rounded transition-all"
            >
              <span className="material-symbols-outlined text-sm">security</span>
            </Link>
            <Link
              to="/safety"
              title="Central de Segurança"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-primary p-2 flex items-center justify-center rounded transition-all"
            >
              <span className="material-symbols-outlined text-sm">shield</span>
            </Link>
            <Link
              to="/profile/verify"
              title="Verificar Perfil"
              className={`bg-white/5 hover:bg-white/10 border p-2 flex items-center justify-center rounded transition-all ${
                profile?.verification_status === 'verified' ? 'border-green-500/30 text-green-500' : 'border-white/10 text-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {profile?.verification_status === 'verified' ? 'verified' : 'verified_user'}
              </span>
            </Link>

            <button
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
              className="bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-white/40 hover:text-red-400 px-4 py-2 flex items-center gap-2 rounded transition-all text-[10px] font-black uppercase tracking-widest ml-auto"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sair
            </button>
          </div>
        )}

        {!isOwnProfile && (
          <div className="hidden">
            <MatchedButton targetUserId={id} size="md" initialStatus={matchStatus} isAi={profile?.is_human === false} className="profile-match-btn" />
            <LikedButton targetUserId={id} size="md" className="profile-like-btn" />
          </div>
        )}
        
        {error && (
          <div className="mx-4 md:mx-6 mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-4">
            {error}
          </div>
        )}
      </div>

      <div className="px-4 max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Lado Esquerdo: Visual Principal */}
        <div className="lg:col-span-5 space-y-6 md:space-y-8">
          <div className="relative aspect-[4/5] md:aspect-[3/4] rounded overflow-hidden border border-white/10 group shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/50 shadow-[0_0_10px_rgba(186,158,255,0.5)] z-20 animate-scan"></div>

            <img
              src={profile?.profile_image_url || 'https://i.pravatar.cc/800'}
              alt={profile?.name}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/30 to-transparent"></div>
            <div className="absolute bottom-8 left-4 right-4 md:bottom-12 md:left-12 md:right-12 text-[#ffffff]">
              <h1 className="text-5xl md:text-7xl font-headline font-black italic tracking-tighter mb-4 leading-none flex items-center gap-4 text-[#ffffff]">
                {profile?.name}
                {profile?.is_human === false && (
                  <div className="flex items-center gap-1.5 bg-primary/20 text-primary text-xs px-2 py-1 rounded border border-primary/30 not-italic tracking-normal h-fit">
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    <span>IA</span>
                  </div>
                )}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-primary/80">
                  <span>{profile?.age} ANOS</span>
                  <span className="w-1 h-1 bg-[#ffffff]/20 rounded"></span>
                  <span>{profile?.city}</span>
                  {profile?.kmAway !== null && !isOwnProfile && (
                    <>
                      <span className="w-1 h-1 bg-[#ffffff]/20 rounded"></span>
                      <span>{profile.kmAway} KM</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="flex items-center justify-between w-full">
              {profile?.is_human !== false && (
                <Badge variant="primary" icon="verified" className="!bg-primary !text-black">
                  Verificado
                </Badge>
              )}

              {profile?.is_human !== false && (
                <button
                  onClick={() => setShowReport(true)}
                  title="Denunciar perfil"
                  className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>flag</span>
                  Denunciar
                </button>
              )}
            </div>
          )}

          {/* Métricas Estilo Premium */}
          {isOwnProfile ? (
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[
                { label: 'Entropia', value: `${metrics.entropy}%`, color: 'text-white' },
                { label: 'Pulso', value: `${metrics.pulse} Hz`, color: 'text-white' },
                { label: 'Sinc', value: `${metrics.resonance}%`, color: 'text-primary' }
              ].map((m, i) => (
                <GlassCard key={i} padding="p-4 md:p-5" className="flex flex-col items-center">
                  <span className="text-[7px] md:text-[8px] font-black text-white/20 uppercase mb-1 md:mb-2 tracking-widest">{m.label}</span>
                  <span className={`text-base md:text-xl font-black tracking-tighter ${m.color}`}>{m.value}</span>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              {/* Match Card */}
              <GlassCard 
                padding="p-4 md:p-5" 
                className={`flex flex-col items-center justify-center cursor-pointer border transition-all duration-300 group
                  ${matchStatus === 'accepted' ? 'border-[#00FF66]/30 bg-[#00FF66]/5' : 
                    matchStatus === 'pending' ? 'border-[#FF5500]/30 bg-[#FF5500]/5' :
                    matchStatus === 'rejected' ? 'border-[#FF0033]/30 bg-[#FF0033]/5' :
                    'border-white/5 hover:border-primary/40'}`}
                onClick={() => document.querySelector('.profile-match-btn')?.click()}
              >
                <span className="text-[6px] md:text-[8px] font-black text-white/20 uppercase mb-2 tracking-widest group-hover:text-primary transition-colors truncate max-w-full">
                  {matchStatus === 'accepted' ? 'Conectado' : 
                   matchStatus === 'pending' ? 'Sinal Enviado' : 
                   matchStatus === 'rejected' ? 'Bloqueado' : 'Match'}
                </span>
                <span 
                  className={`material-symbols-outlined text-2xl transition-all duration-300 
                    ${matchStatus === 'accepted' ? 'text-[#00FF66]' : 
                      matchStatus === 'pending' ? 'text-[#FF5500] animate-pulse' : 
                      matchStatus === 'rejected' ? 'text-[#FF0033]' : 
                      'text-white/40 group-hover:text-primary'}`}
                  style={matchStatus !== 'none' && matchStatus !== null ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {matchStatus === 'accepted' ? (profile?.is_human === false ? 'smart_toy' : 'group') : 
                   matchStatus === 'rejected' ? 'block' : 'sensors'}
                </span>
              </GlassCard>

              {/* Like Card */}
              <GlassCard 
                padding="p-4 md:p-5" 
                className={`flex flex-col items-center justify-center cursor-pointer border transition-all duration-300 group
                  ${likeStatus === 'liked' || likeStatus === 'accepted' ? 'border-[#FF0033]/30 bg-[#FF0033]/5' : 'border-white/5 hover:border-primary/40'}`}
                onClick={() => document.querySelector('.profile-like-btn')?.click()}
              >
                <span className="text-[6px] md:text-[8px] font-black text-white/20 uppercase mb-2 tracking-widest group-hover:text-primary transition-colors truncate max-w-full">
                  {likeStatus === 'liked' ? 'Curtido' : likeStatus === 'accepted' ? 'Match!' : 'Like'}
                </span>
                <span 
                  className={`material-symbols-outlined text-2xl transition-all duration-300 
                    ${likeStatus === 'liked' || likeStatus === 'accepted' ? 'text-[#FF0033]' : 'text-white/40 group-hover:text-primary'}`}
                  style={likeStatus !== 'none' ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  favorite
                </span>
              </GlassCard>

              {/* Compatibilidade Card */}
              <GlassCard padding="p-4 md:p-5" className="flex flex-col items-center justify-center border border-white/5">
                <span className="text-[6px] md:text-[8px] font-black text-white/20 uppercase mb-2 tracking-widest truncate max-w-full">Compatibilidade</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                  <span className="text-sm md:text-base font-black tracking-tighter text-primary">{metrics.resonance}%</span>
                </div>
              </GlassCard>

              {/* Chat Card */}
              <GlassCard 
                padding="p-4 md:p-5" 
                className={`flex flex-col items-center justify-center cursor-pointer border transition-all duration-300 group border-white/5 hover:border-primary/40`}
                onClick={() => navigate(`/chat/${id}`)}
              >
                <span className="text-[6px] md:text-[8px] font-black text-white/20 uppercase mb-2 tracking-widest group-hover:text-primary transition-colors truncate max-w-full">Chat</span>
                <span className="material-symbols-outlined text-2xl text-white/40 group-hover:text-primary transition-all">chat</span>
              </GlassCard>
            </div>
          )}

          {/* Checklist de Completude (Apenas para o Dono) */}
          {isOwnProfile && profile.profile_score < 100 && (
            <GlassCard className="p-5 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Próximos Passos</h3>
                <span className="text-xl font-black italic text-white">{profile.profile_score}%</span>
              </div>
              <div className="space-y-3">
                {profile.verification_status !== 'verified' && (
                  <div 
                    onClick={() => navigate('/profile/verify')}
                    className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">verified_user</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Verificar Identidade (+15%)</span>
                    </div>
                    <span className="material-symbols-outlined text-white/20">chevron_right</span>
                  </div>
                )}
                {!profile.bio && (
                  <div 
                    onClick={() => navigate('/profile/edit')}
                    className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-white/40">edit_note</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Adicionar Biografia (+15%)</span>
                    </div>
                    <span className="material-symbols-outlined text-white/20">chevron_right</span>
                  </div>
                )}
                {!profile.profile_image_url && (
                  <div 
                    className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5 cursor-pointer hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-white/40">add_a_photo</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Foto de Perfil (+15%)</span>
                    </div>
                    <span className="material-symbols-outlined text-white/20">chevron_right</span>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          <UserProfileDetail profile={profile} interests={interests} />
        </div>

        {/* Lado Direito: Conteúdo e Manifesto */}
        <div className="lg:col-span-7 space-y-12 md:space-y-16">
          <section>
            <div className="flex items-center gap-6 mb-6 md:mb-8">
              <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">UM POUCO SOBRE MIM</h2>
              <div className="flex-1 h-[1px] bg-primary"></div>
            </div>
            <div className="relative p-8 md:p-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded shadow-xl">
              <p className="text-xl md:text-3xl leading-snug text-white/90 italic font-light font-headline tracking-tight">
                "{profile?.bio}"
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12">
              {isOwnProfile && (
                <label className="aspect-square rounded border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-4 text-white/20 hover:border-primary/50 hover:text-primary transition-all group cursor-pointer">
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                    <span className="material-symbols-outlined text-xl">{uploading ? 'sync' : 'add'}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest block">Upload</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, false)} disabled={uploading} />
                </label>
              )}

              {publicPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  onClick={() => !isOwnProfile && setSelectedImage(photo)}
                  className="group relative aspect-square rounded overflow-hidden border border-white/5 bg-white/5 cursor-pointer"
                >
                  <img
                    src={photo.url}
                    className={`w-full h-full object-cover transition-all duration-700 ${!isOwnProfile ? 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105' : 'group-hover:scale-105'}`}
                    alt={`Fragment ${i}`}
                  />
                  
                  {isOwnProfile ? (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(photo); }}
                        className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"
                        title="Ver Foto"
                      >
                        <span className="material-symbols-outlined text-sm text-white">visibility</span>
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSetProfile(photo.id, photo.url); }}
                          className="w-10 h-10 flex items-center justify-center bg-primary/20 hover:bg-primary text-primary hover:text-black rounded-full transition-all"
                          title="Usar no Perfil"
                        >
                          <span className="material-symbols-outlined text-sm">account_circle</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleTogglePrivate(photo.id, false); }}
                          className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"
                          title="Privatizar"
                        >
                          <span className="material-symbols-outlined text-sm text-white">lock</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.url); }}
                          className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 transition-all duration-500">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-black text-primary bg-black/60 px-2 py-0.5 rounded">LVL_02</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {!isBlockedByOwner && (isOwnProfile || hasPrivateGallery) && (
            <section className="pb-10">
              <div className="flex items-center gap-6 mb-8">
                <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">GALERIA PRIVADA</h2>
                <div className="flex-1 h-[1px] bg-primary"></div>
              </div>

              {isOwnProfile ? (
                <div className="space-y-8">
                  {/* Solicitações Pendentes - Seção Destacada */}
                  {galleryRequests.some(r => r.status === 'pending') && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(186,158,255,0.8)]"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Solicitações de Acesso</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {galleryRequests.filter(r => r.status === 'pending').map(req => (
                          <div key={req.id} className="bg-white/[0.03] border border-white/10 p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4">
                              <Avatar src={req.requester?.profile_image_url} alt={req.requester?.name} size="lg" />
                              <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-widest text-white">{req.requester?.name}</span>
                                <span className="text-[9px] text-white/40 uppercase tracking-widest">Requisitou sua Galeria</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateAccessRequest(req.id, 'approved')}
                                className="w-10 h-10 flex items-center justify-center bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all rounded"
                                title="Aprovar"
                              >
                                <span className="material-symbols-outlined text-sm">check</span>
                              </button>
                              <button
                                onClick={() => handleUpdateAccessRequest(req.id, 'rejected')}
                                className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-white/5 hover:bg-red-500 hover:text-white transition-all rounded"
                                title="Recusar"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista de Aprovados - Horizontal */}
                  {galleryRequests.some(r => r.status === 'approved') && (
                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-lg">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Usuários com Acesso</h3>
                      
                      <div className="flex gap-8 overflow-x-auto pb-4 scrollbar-hide">
                        {galleryRequests.filter(r => r.status === 'approved').map(req => (
                          <div key={req.id} className="flex flex-col items-center gap-3 shrink-0 group">
                            <div className="relative">
                              <Avatar 
                                src={req.requester?.profile_image_url} 
                                alt={req.requester?.name} 
                                size="xl" 
                                className="ring-1 ring-primary/30 ring-offset-4 ring-offset-black transition-all group-hover:ring-primary"
                              />
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-black border-2 border-black">
                                <span className="material-symbols-outlined text-[10px] font-black">verified_user</span>
                              </div>
                            </div>
                            
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-primary transition-colors">
                              {req.requester?.name}
                            </span>

                            <button
                              onClick={() => handleUpdateAccessRequest(req.id, 'rejected')}
                              className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-red-500/40 hover:text-red-500 transition-colors"
                            >
                              Revogar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    <label className="aspect-square rounded border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-4 text-primary/40 hover:border-primary hover:text-primary transition-all group cursor-pointer">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                        <span className="material-symbols-outlined text-xl">{uploading ? 'sync' : 'lock_reset'}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] font-black uppercase tracking-widest block">Privado</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, true)} disabled={uploading} />
                    </label>

                    {privatePhotos.map((photo, i) => (
                      <div
                        key={photo.id}
                        className="group relative aspect-square rounded overflow-hidden border border-primary/20 bg-primary/5 cursor-pointer"
                      >
                        <img
                          src={photo.url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                          alt={`Private ${i}`}
                          onClick={() => setSelectedImage(photo)}
                        />
                        <div className="absolute top-4 right-4 bg-primary/80 p-1.5 rounded z-10">
                          <span className="material-symbols-outlined text-[10px] text-black font-black">lock</span>
                        </div>
                        
                        {/* Action Menu for Private Images */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(photo); }}
                            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"
                            title="Ver Foto"
                          >
                            <span className="material-symbols-outlined text-sm text-white">visibility</span>
                          </button>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleTogglePrivate(photo.id, true); }}
                              className="w-10 h-10 flex items-center justify-center bg-primary/20 hover:bg-primary text-primary hover:text-black rounded-full transition-all"
                              title="Tornar Público"
                            >
                              <span className="material-symbols-outlined text-sm">lock_open</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.url); }}
                              className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all"
                              title="Excluir"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : hasAccess ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {privatePhotos.map((photo, i) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedImage(photo)}
                      className="group relative aspect-square rounded overflow-hidden border border-primary/20 bg-primary/5 cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                        alt={`Private ${i}`}
                      />
                      <div className="absolute top-4 right-4 bg-primary/80 p-1.5 rounded">
                        <span className="material-symbols-outlined text-[10px] text-black font-black">lock</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <GlassCard variant="premium" padding="p-8 md:p-16" className="text-center relative overflow-hidden group shadow-2xl">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded flex items-center justify-center mx-auto mb-6 md:mb-8 border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-3xl md:text-4xl">verified_user</span>
                    </div>
                    <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-8 md:mb-12">
                      {accessRequest?.status === 'rejected' ? 'REQUISIÇÃO NEGADA' : 'ACESSO NÃO AUTORIZADO'}
                    </h3>

                    <PremiumButton
                      onClick={handleRequestAccess}
                      disabled={accessRequest?.status === 'pending' || accessRequest?.status === 'rejected'}
                    >
                      {accessRequest?.status === 'pending' ? 'REQUISIÇÃO ENVIADA' :
                        accessRequest?.status === 'rejected' ? 'REQUISIÇÃO NEGADA' : 'REQUISITAR ACESSO'}
                    </PremiumButton>
                  </div>
                </GlassCard>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Lightbox / Dossier View */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl"></div>

          <div className="absolute top-8 left-8 right-8 z-[210] flex justify-between items-center pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <Avatar
                src={profile?.profile_image_url}
                alt={profile?.name}
                size="lg"
                variant="glass"
              />
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mt-1">
                {selectedImage.is_private ? 'Galeria_Privada' : 'Galeria_Pública'}
              </span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="h-12 w-12 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/50 transition-all pointer-events-auto group"
            >
              <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-90">close</span>
            </button>
          </div>

          {/* Navigation Arrows - Desktop */}
          <button
            onClick={handlePrev}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-[210] h-16 w-16 rounded bg-white/5 border border-white/10 hidden md:flex items-center justify-center text-white/20 hover:text-primary hover:border-primary/50 transition-all group"
          >
            <span className="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">arrow_back_ios_new</span>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-[210] h-16 w-16 rounded bg-white/5 border border-white/10 hidden md:flex items-center justify-center text-white/20 hover:text-primary hover:border-primary/50 transition-all group"
          >
            <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
          </button>

          <div className="relative max-w-[95vw] max-h-[90vh] flex flex-col gap-4 items-center mx-auto" onClick={e => e.stopPropagation()}>
            {/* Main Image Content */}
            <div className="relative group/image overflow-hidden rounded bg-black shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-primary shadow-[0_0_15px_rgba(255,59,0,0.8)] z-20 animate-scan"></div>

              {/* Corner Brackets */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-primary/40 z-10"></div>
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-primary/40 z-10"></div>
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-primary/40 z-10"></div>
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-primary/40 z-10"></div>

              <img
                src={selectedImage.url}
                className="max-h-[80vh] w-auto object-contain transition-opacity duration-300"
                alt="Enlarged dossier fragment"
              />

              {/* Mobile Arrows Overlay */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:hidden">
                <button onClick={handlePrev} className="h-10 w-10 rounded bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60">
                  <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
                </button>
                <button onClick={handleNext} className="h-10 w-10 rounded bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60">
                  <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                </button>
              </div>
            </div>

            {/* Pagination Info Below Image */}
            <div className="flex justify-center items-center gap-4 w-full">
              <div className="h-[1px] flex-1 bg-white/5"></div>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.6em] py-2">
                {visibleMedia.findIndex(m => m.id === selectedImage.id) + 1} <span className="text-primary/40">/</span> {visibleMedia.length}
              </span>
              <div className="h-[1px] flex-1 bg-white/5"></div>
            </div>
          </div>
        </div>
      )}
      {/* Mensagens Flutuantes (Mobile) */}
      {uploading && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] bg-primary text-black px-8 py-3 rounded text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined animate-spin text-sm">sync</span>
          Subindo Mídia...
        </div>
      )}

      {processing.id && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] bg-white text-black px-8 py-3 rounded text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-pulse">
          <span className="material-symbols-outlined animate-spin text-sm">sync</span>
          Processando...
        </div>
      )}

      {showReport && (
        <ReportModal
          targetUserId={id}
          targetName={profile?.name}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
