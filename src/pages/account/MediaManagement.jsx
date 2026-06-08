import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { validateImageFace, validateImageUrlFace } from '@/lib/faceDetection';

export function MediaManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState({ id: null, action: null });
  const [error, setError] = useState(null);

  const fetchMedia = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_media')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMedia(data || []);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Erro ao carregar sua galeria.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

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
        }
      }

      const { fetchUserProfile } = useAuthStore.getState();
      await fetchUserProfile(user.id);
      await fetchMedia();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erro ao enviar a imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, url) => {
    if (!confirm('Excluir esta mídia permanentemente?')) return;

    try {
      const path = url.split('/media/')[1];
      if (path) {
        await supabase.storage.from('media').remove([path]);
      }

      const { error: deleteError } = await supabase
        .from('user_media')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      const { data: userData } = await supabase.from('users').select('profile_image_url').eq('id', user.id).single();
      if (userData?.profile_image_url === url) {
        await supabase.from('users').update({ profile_image_url: null }).eq('id', user.id);
        const { fetchUserProfile } = useAuthStore.getState();
        await fetchUserProfile(user.id);
      }

      setMedia(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erro ao excluir a imagem.');
    }
  };

  const handleSetProfile = async (id, url) => {
    try {
      setProcessing({ id, action: 'profile' });
      setError(null);

      const hasFace = await validateImageUrlFace(url);
      if (!hasFace) {
        setError('Esta imagem não pode ser usada como perfil pois nenhum rosto foi detectado.');
        return;
      }

      await supabase.from('user_media').update({ is_profile: false }).eq('user_id', user.id);
      await supabase.from('user_media').update({ is_profile: true }).eq('id', id);
      await supabase.from('users').update({ profile_image_url: url }).eq('id', user.id);
      
      const { fetchUserProfile } = useAuthStore.getState();
      await fetchUserProfile(user.id);
      await fetchMedia();
    } catch (err) {
      console.error('Error setting profile pic:', err);
    } finally {
      setProcessing({ id: null, action: null });
    }
  };

  const handleTogglePrivate = async (id, currentIsPrivate) => {
    try {
      setProcessing({ id, action: 'private' });
      await supabase.from('user_media')
        .update({ 
          is_private: !currentIsPrivate,
          is_profile: false
        })
        .eq('id', id);
      await fetchMedia();
    } catch (err) {
      console.error('Error toggling privacy:', err);
    } finally {
      setProcessing({ id: null, action: null });
    }
  };

  const publicPhotos = media.filter(m => !m.is_private);
  const privatePhotos = media.filter(m => m.is_private);

  return (
    <div className="px-4 max-w-full mx-auto">
      <div className="mb-10 md:mb-16">
        <h1 className="text-4xl md:text-6xl font-headline font-black italic tracking-tighter leading-none mb-4">Gerencie as suas galerias.</h1>
        <p className="text-white/30 text-sm font-medium tracking-wide max-w-xl">Fotos públicas atraem olhares. Fotos privadas criam mistério.</p>
      </div>

      {error && <div className="mb-8 p-6 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</div>}

      {/* Galeria Pública */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Exposição Pública</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">{publicPhotos.length} fotos</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {/* Botão de Upload Público */}
          <label className="aspect-[3/4] rounded md:rounded border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-4 text-white/20 hover:border-primary/50 hover:text-primary transition-all group cursor-pointer">
            <div className="w-14 h-14 rounded bg-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-2xl">{uploading ? 'sync' : 'add'}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Novo Público</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10">JPG, PNG</span>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, false)} disabled={uploading} />
          </label>

          {publicPhotos.map(photo => (
            <div key={photo.id} className={`group relative aspect-[3/4] rounded md:rounded overflow-hidden border transition-all duration-500 ${photo.is_profile ? 'border-primary shadow-[0_20px_40px_rgba(186,158,255,0.1)]' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
              <img src={photo.url} alt="Gallery" className={`w-full h-full object-cover transition-all duration-700 ${photo.is_profile ? 'grayscale-0' : 'grayscale-[40%] group-hover:grayscale-0 group-hover:scale-110'}`} />
              
              {photo.is_profile && (
                <div className="absolute top-4 left-4 bg-primary text-black px-4 py-1.5 rounded shadow-2xl">
                  <span className="text-[9px] font-black uppercase tracking-widest">Digital ID</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4">
                {!photo.is_profile && (
                  <button onClick={() => handleSetProfile(photo.id, photo.url)} className="flex items-center gap-3 bg-white/10 hover:bg-primary hover:text-black px-6 py-3 rounded transition-all">
                    <span className="material-symbols-outlined text-sm">photo_camera_front</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Definir Perfil</span>
                  </button>
                )}
                <button onClick={() => handleTogglePrivate(photo.id, false)} className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-6 py-3 rounded transition-all">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Privatizar</span>
                </button>
                <button onClick={() => handleDelete(photo.id, photo.url)} className="text-red-500/60 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-colors mt-2">Remover Mídia</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Galeria Privada */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">lock</span>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Cofre Exclusivo</h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">{privatePhotos.length} fotos</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {/* Botão de Upload Privado */}
          <label className="aspect-[3/4] rounded md:rounded border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-4 text-white/20 hover:border-primary/50 hover:text-primary transition-all group cursor-pointer">
            <div className="w-14 h-14 rounded bg-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-2xl">{uploading ? 'sync' : 'lock_reset'}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest block mb-1">Novo Privado</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10">Acesso Restrito</span>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, true)} disabled={uploading} />
          </label>

          {privatePhotos.map(photo => (
            <div key={photo.id} className="group relative aspect-[3/4] rounded md:rounded overflow-hidden border border-white/10 bg-white/5 hover:border-white/20 transition-all duration-500">
              <img src={photo.url} alt="Private" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
              
              <div className="absolute top-4 left-4 bg-primary/80 p-1.5 rounded z-10 shadow-2xl">
                <span className="material-symbols-outlined text-[10px] text-black font-black">lock</span>
              </div>

              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4">
                <button onClick={() => handleTogglePrivate(photo.id, true)} className="flex items-center gap-3 bg-white/10 hover:bg-primary hover:text-black px-6 py-3 rounded transition-all">
                  <span className="material-symbols-outlined text-sm">lock_open</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Tornar Público</span>
                </button>
                <button onClick={() => handleDelete(photo.id, photo.url)} className="text-red-500/60 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-colors mt-2">Remover Mídia</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mensagens Flutuantes (Mobile) */}
      {uploading && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-primary text-black px-8 py-3 rounded text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined animate-spin text-sm">sync</span>
          Subindo Mídia...
        </div>
      )}
    </div>
  );
}
