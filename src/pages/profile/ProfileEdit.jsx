import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { validateImageFace } from '@/lib/faceDetection';
import { generateEmbedding } from '@/lib/embeddings';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { toast } from 'sonner';

const genderOptions = ['Mulher', 'Homem', 'Não-binário', 'Prefiro não dizer'];
const interestOptions = ['Mulheres', 'Homens', 'Todos'];
const eyesOptions = ['Castanho', 'Azul', 'Verde', 'Preto', 'Mel'];
const hairOptions = ['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Colorido', 'Grisalho'];
const skinColorOptions = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não dizer'];
const weightOptions = ['Magro(a)', 'Normal', 'Gordo(a)', 'Prefiro não dizer'];

function getPendingSignupName() {
  try {
    const pending = JSON.parse(localStorage.getItem('desvio_pending_signup') || '{}');
    return pending.name || '';
  } catch {
    return '';
  }
}



export function ProfileEdit() {
  const { session, user } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    age: '',
    city: '',
    latitude: null,
    longitude: null,
    gender: genderOptions[0],
    searchFor: [interestOptions[0]],
    bio: '',
    userInterests: [],
    hairColor: 'Preto',
    eyesColor: 'Castanho',
    skinColor: 'Prefiro não dizer',
    weight: 'Prefiro não dizer',
    height: 170,
    invisibleMode: false,
    showDistance: true,
  });
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingCities, setSearchingCities] = useState(false);
  const [allInterests, setAllInterests] = useState([]);

  const currentUser = user || session?.user;

  // Cálculo de progresso simplificado para garantir atualização em tempo real
  let completion = 0;
  
  // Essenciais (60%)
  if (form.name && form.name.trim().length > 0) completion += 10;
  if (form.avatarUrl) completion += 10;
  const ageNum = parseInt(form.age);
  if (!isNaN(ageNum) && ageNum >= 18) completion += 10;
  if (form.bio && form.bio.trim().length >= 20) completion += 10;
  if (form.city && form.city.trim().length > 0) completion += 10;
  if (form.gender && form.gender.length > 0) completion += 10;
  
  // Preferências e Localização (20%)
  if (Array.isArray(form.searchFor) && form.searchFor.length > 0) completion += 10;
  if (form.latitude && form.longitude) completion += 10;
  
  // Traços Físicos (20%)
  if (form.height && form.height >= 100) completion += 4;
  if (form.weight && form.weight !== 'Prefiro não dizer') completion += 4;
  if (form.hairColor && form.hairColor !== 'Prefiro não dizer') completion += 4;
  if (form.eyesColor && form.eyesColor !== 'Prefiro não dizer') completion += 4;
  if (form.skinColor && form.skinColor !== 'Prefiro não dizer') completion += 4;

  completion = Math.min(100, completion);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser?.id) return;

      const [userRes, interestsRes, userInterestsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', currentUser.id).single(),
        supabase.from('interests').select('*'),
        supabase.from('user_interests').select('interest_id').eq('user_id', currentUser.id)
      ]);

      if (interestsRes.data) {
        setAllInterests(interestsRes.data);
      }

      if (userRes.data && !userRes.error) {
        setForm({
          name: userRes.data.name || '',
          age: userRes.data.age || '',
          city: userRes.data.city || '',
          latitude: userRes.data.latitude || null,
          longitude: userRes.data.longitude || null,
          gender: userRes.data.gender || genderOptions[0],
          searchFor: userRes.data.search_for || [interestOptions[0]],
          bio: userRes.data.bio?.split('\n\nVibe: ')[0] || '',
          userInterests: userInterestsRes.data?.map(ui => ui.interest_id) || [],
          hairColor: userRes.data.hair_color || 'Preto',
          eyesColor: userRes.data.eyes_color || 'Castanho',
          skinColor: userRes.data.skin_color || 'Prefiro não dizer',
          weight: userRes.data.weight || 'Prefiro não dizer',
          height: userRes.data.height || 170,
          avatarUrl: userRes.data.profile_image_url || '',
          invisibleMode: false,
          showDistance: true,
        });
      } else {
        const metadataName = currentUser?.user_metadata?.name || currentUser?.user_metadata?.full_name;
        const pendingName = getPendingSignupName();
        setForm(prev => ({
          ...prev,
          name: prev.name || pendingName || metadataName || '',
        }));
      }
    };

    fetchProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!form.city || form.city.length < 3 || form.latitude) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCities(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.city)}&format=json&limit=5&addressdetails=1&featuretype=city`,
          { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'DesvioApp/1.0' } }
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Error fetching cities:', err);
      } finally {
        setSearchingCities(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [form.city, form.latitude]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectCity = (cityData) => {
    const cityName = cityData.display_name.split(',')[0];
    setForm(prev => ({
      ...prev,
      city: cityName,
      latitude: parseFloat(cityData.lat),
      longitude: parseFloat(cityData.lon)
    }));
    setSuggestions([]);
  };

  const toggleArrayValue = (field, value) => {
    setForm((current) => {
      const values = current[field];
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      return { ...current, [field]: nextValues };
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ARQUIVO MUITO GRANDE', {
        description: 'A imagem deve ter no máximo 5MB.'
      });
      return;
    }

    setSaving(true);
    try {
      const facePromise = validateImageFace(file);
      toast.promise(facePromise, {
        loading: 'ESCANEANDO FACE HUMANA...',
        success: 'FACE CONFIRMADA!',
        error: 'ROSTO NÃO DETECTADO'
      });

      const hasFace = await facePromise;
      if (!hasFace) {
        setSaving(false);
        return;
      }

      setMessage('Face confirmada! Sincronizando...');
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 1. Upload para o Storage (Bucket 'avatars')
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 2. Desmarcar fotos de perfil anteriores na tabela CORRETA (user_media)
      await supabase
        .from('user_media')
        .update({ is_profile: false })
        .eq('user_id', currentUser.id);

      // 3. Inserir na galeria REAL (user_media) como foto de perfil pública
      const { error: imgError } = await supabase
        .from('user_media')
        .insert([{
          user_id: currentUser.id,
          url: publicUrl,
          is_profile: true,
          is_private: false
        }]);

      if (imgError) throw imgError;

      // 4. Atualizar o campo profile_image_url na tabela users IMEDIATAMENTE
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', currentUser.id);

      if (userUpdateError) throw userUpdateError;

      // 5. Atualizar o estado local
      updateField('avatarUrl', publicUrl);
      toast.success('IDENTIDADE DIGITAL SINCRONIZADA');
      
    } catch (err) {
      console.error('Erro detalhado no upload:', err);
      toast.error('FALHA NA SINCRONIZAÇÃO');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();

    if (!currentUser?.id) {
      toast.error('ACESSO NEGADO', {
        description: 'Entre na sua conta para completar o perfil.'
      });
      return;
    }

    if (!form.name.trim()) {
      toast.error('CAMPO OBRIGATÓRIO', {
        description: 'Informe seu nome ou apelido.'
      });
      return;
    }

    if (Number(form.age) < 18) {
      toast.error('IDADE INVÁLIDA', {
        description: 'O Desvio é exclusivo para maiores de 18 anos.'
      });
      return;
    }

    if (!form.city.trim() || !form.latitude) {
      toast.error('LOCALIZAÇÃO PENDENTE', {
        description: 'Selecione uma cidade válida da lista de sugestões.'
      });
      return;
    }

    if (form.searchFor.length === 0) {
      toast.error('PREFERÊNCIAS PENDENTES', {
        description: 'Escolha pelo menos uma preferência de conexão.'
      });
      return;
    }

    if (form.bio.trim().length < 20) {
      toast.error('NARRATIVA CURTA', {
        description: 'Escreva uma bio com pelo menos 20 caracteres.'
      });
      return;
    }

    setSaving(true);

    try {
      // 1. Gera Embedding Semântico (IA) a partir da bio
      const embeddingPromise = generateEmbedding(form.bio.trim());
      toast.promise(embeddingPromise, {
        loading: 'IA ANALISANDO NARRATIVA...',
        success: 'NARRATIVA MAPEADA!',
        error: 'ERRO NA ANÁLISE SEMÂNTICA'
      });
      const embedding = await embeddingPromise;

      // 2. Colunas baseadas no schema.sql real — sem colunas inventadas
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id:           currentUser.id,
          name:         form.name.trim(),
          age:          Number(form.age),
          bio:          form.bio.trim(),
          city:         form.city.trim(),
          gender:       form.gender,
          search_for:    form.searchFor,
          latitude:     form.latitude,
          longitude:    form.longitude,
          hair_color:   form.hairColor,
          eyes_color:   form.eyesColor,
          skin_color:   form.skinColor,
          weight:       form.weight,
          height:       Number(form.height),
          profile_image_url: form.avatarUrl,
          compatibility_embedding:    embedding,
          profile_score: completion,
          last_active:   new Date().toISOString(),
        });

      if (profileError) {
        setSaving(false);
        toast.error('ERRO AO SALVAR', {
          description: profileError.message || 'Não foi possível salvar seu perfil.'
        });
        return;
      }

      await supabase.from('user_interests').delete().eq('user_id', currentUser.id);
      if (form.userInterests.length > 0) {
        const interestRecords = form.userInterests.map(id => ({ user_id: currentUser.id, interest_id: id }));
        await supabase.from('user_interests').insert(interestRecords);
      }

      // Salva configurações de privacidade na tabela user_settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id:        currentUser.id,
          invisible_mode: form.invisibleMode,
          show_distance:  form.showDistance,
        });

      const { fetchUserProfile } = useAuthStore.getState();
      await fetchUserProfile(currentUser.id);

      localStorage.removeItem('desvio_pending_signup');
      setSaving(false);
      toast.success('PERFIL SINCRONIZADO');
      setTimeout(() => { navigate('/search'); }, 1500);
    } catch (err) {
      setSaving(false);
      toast.error('FALHA NA GRAVAÇÃO');
      console.error(err);
    }
  };

  return (
    <>
      {/* Title Row - Standard Pattern */}
      <div className="w-full pt-6">
        <div className="flex items-center gap-6 mb-12 px-4">
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5500] whitespace-nowrap">
            PERFIL
          </h1>
          <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
        </div>
      </div>

      <div className="px-4 py-6 md:py-8 max-w-full mx-auto">

        <div className="grid lg:grid-cols-[400px_1fr] gap-8 md:gap-12">
          {/* Sidebar / Progress */}
          <aside className="space-y-6">
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl p-8 md:p-10 sticky top-8">
              <div className="relative mb-10 group">
                <label className="relative block aspect-[3/4] w-full rounded-[2rem] border-2 border-dashed border-primary/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/40 transition-all cursor-pointer overflow-hidden">
                  {form.avatarUrl ? (
                    <div className="relative w-full h-full">
                      <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                        <div className="h-14 w-14 rounded bg-primary/20 backdrop-blur-xl flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-primary text-3xl">add</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Alterar Foto</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="h-14 w-14 rounded bg-primary/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-primary text-3xl">add</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Novo Público</span>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10">JPG, PNG</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
                
                {form.avatarUrl && (
                  <div className="absolute -bottom-3 -right-3 h-12 w-12 rounded bg-primary flex items-center justify-center text-black shadow-[0_10px_30px_rgba(186,158,255,0.3)]">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40 px-2">
                  <span>Progresso do perfil</span>
                  <span className={completion < 85 ? 'text-red-500' : 'text-primary'}>{completion}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded overflow-hidden">
                  <div 
                    className="h-full rounded transition-all duration-1000 ease-out deviation-gradient" 
                    style={{ width: `${completion}%` }}
                  ></div>
                </div>
                {completion < 85 && (
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-red-500/60 bg-red-500/5 p-4 rounded border border-red-500/10">
                    Sincronize pelo menos 85% para liberar interações.
                  </p>
                )}
              </div>

              <div className="mt-10 grid gap-3">
                <button 
                  onClick={() => navigate('/profile/media')}
                  className="flex items-center justify-between w-full h-14 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary">grid_view</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Galeria</span>
                  </div>
                  <span className="material-symbols-outlined text-white/20 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Form Content */}
          <div className="space-y-8">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Seção: Identidade */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-10 space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">fingerprint</span>
                  </div>
                  <h3 className="text-lg font-headline font-black italic tracking-tighter">Identidade</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Apelido</span>
                    <input className="w-full h-14 rounded-xl border border-white/10 bg-white/[0.02] px-8 text-sm text-white outline-none focus:border-primary transition-all" type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Idade Real</span>
                    <input className="w-full h-14 rounded-xl border border-white/10 bg-white/[0.02] px-8 text-sm text-white outline-none focus:border-primary transition-all" type="number" min="18" value={form.age} onChange={(e) => updateField('age', e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Eu sou</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {genderOptions.map((o) => (
                      <button key={o} type="button" onClick={() => updateField('gender', o)} className={`h-14 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${form.gender === o ? 'bg-primary border-primary text-black' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seção: Traços Físicos */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-10 space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">straighten</span>
                  </div>
                  <h3 className="text-lg font-headline font-black italic tracking-tighter">Traços Físicos</h3>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Altura (cm)</span>
                      <input className="w-full h-14 rounded-xl border border-white/10 bg-white/[0.02] px-8 text-sm text-white outline-none focus:border-primary" type="number" value={form.height} onChange={(e) => updateField('height', parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Peso</span>
                      <CustomSelect 
                        value={form.weight} 
                        onChange={(val) => updateField('weight', val)} 
                        options={weightOptions} 
                        placeholder="Selecione" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Pele</span>
                      <CustomSelect 
                        value={form.skinColor} 
                        onChange={(val) => updateField('skinColor', val)} 
                        options={skinColorOptions} 
                        placeholder="Selecione" 
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Cabelo</span>
                      <CustomSelect 
                        value={form.hairColor} 
                        onChange={(val) => updateField('hairColor', val)} 
                        options={hairOptions} 
                        placeholder="Selecione" 
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Olhos</span>
                      <CustomSelect 
                        value={form.eyesColor} 
                        onChange={(val) => updateField('eyesColor', val)} 
                        options={eyesOptions} 
                        placeholder="Selecione" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Relacionamento */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-10 space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">star</span>
                  </div>
                  <h3 className="text-lg font-headline font-black italic tracking-tighter">Meus interesses</h3>
                </div>

                <div className="pt-2">
                  <div className="grid grid-cols-3 gap-3">
                    {interestOptions.map((o) => (
                      <button key={o} type="button" onClick={() => toggleArrayValue('searchFor', o)} className={`h-14 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${form.searchFor.includes(o) ? 'bg-primary border-primary text-black' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seção: Meus interesses */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-10 space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">sensors</span>
                  </div>
                  <h3 className="text-lg font-headline font-black italic tracking-tighter">Relacionamento</h3>
                </div>

                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map((interest) => (
                      <button key={interest.id} type="button" onClick={() => toggleArrayValue('userInterests', interest.id)} className={`px-6 h-14 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${form.userInterests.includes(interest.id) ? 'bg-primary border-primary text-black shadow-[0_10px_30px_rgba(186,158,255,0.2)]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>{interest.name}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seção: Bio */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-10 space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
                  </div>
                  <h3 className="text-lg font-headline font-black italic tracking-tighter">Um pouco sobre mim</h3>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4">Sua Narrativa (Bio)</span>
                  <textarea className="w-full min-h-[160px] rounded-xl border border-white/10 bg-white/[0.02] px-8 py-6 text-sm text-white outline-none focus:border-primary resize-none placeholder:text-white/10" value={form.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="Revele apenas o necessário..." required />
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-4">Mínimo 20 caracteres</div>
                </div>
              </div>

              {/* Seção: Localização */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-10 space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                  </div>
                  <h3 className="text-lg font-headline font-black italic tracking-tighter">Geolocalização</h3>
                </div>

                <div className="relative">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-4 mb-2 block">Ponto de Encontro (Cidade)</span>
                  <div className="relative">
                    <input className="w-full h-14 rounded-xl border border-white/10 bg-white/[0.02] px-8 text-sm text-white outline-none focus:border-primary transition-all" type="text" value={form.city} onChange={(e) => { updateField('city', e.target.value); setForm(prev => ({ ...prev, latitude: null, longitude: null })); }} placeholder="Ex: São Paulo" required autoComplete="off" />
                    {searchingCities && <div className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded"></div>}
                  </div>
                  {suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 z-[100] mt-4 max-h-60 overflow-auto rounded border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-3xl animate-fade-in">
                      {suggestions.map((c, idx) => (
                        <li key={idx}>
                          <button type="button" className="w-full h-14 rounded-xl px-6 text-left hover:bg-primary group transition-all" onClick={() => selectCity(c)}>
                            <span className="block text-xs font-black uppercase tracking-widest text-white group-hover:text-black">{c.display_name.split(',')[0]}</span>
                            <span className="text-[10px] text-white/40 group-hover:text-black/60 truncate block">{c.display_name.split(',').slice(1).join(',')}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Invisibilidade</span>
                    <input className="h-5 w-5 accent-primary" type="checkbox" checked={form.invisibleMode} onChange={(e) => updateField('invisibleMode', e.target.checked)} />
                  </label>
                  <label className="flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Proximidade</span>
                    <input className="h-5 w-5 accent-primary" type="checkbox" checked={form.showDistance} onChange={(e) => updateField('showDistance', e.target.checked)} />
                  </label>
                </div>
              </div>

              {/* Desktop Save Button (Hidden on Mobile) */}
              <div className="hidden md:flex gap-4 pt-4">
                <button className="flex-1 h-14 rounded-xl text-xs font-black uppercase tracking-[0.3em] text-black bg-primary shadow-[0_20px_60px_rgba(186,158,255,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50" type="submit" disabled={saving}>{saving ? 'Sincronizando...' : 'Confirmar Identidade'}</button>
                <button type="button" onClick={() => navigate('/search')} className="px-10 h-14 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Pular</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] p-6 bg-gradient-to-t from-black via-black/90 to-transparent md:hidden">
        <div className="flex gap-3">
          <button 
            onClick={() => handleSubmit()}
            className="flex-1 h-14 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-black bg-primary shadow-[0_10px_30px_rgba(186,158,255,0.3)] active:scale-95"
            disabled={saving}
          >
            {saving ? 'Gravando...' : 'Salvar Perfil'}
          </button>
          <button 
            onClick={() => navigate('/search')}
            className="h-14 w-14 rounded-xl border border-white/10 flex items-center justify-center bg-black/40 backdrop-blur-xl"
          >
            <span className="material-symbols-outlined text-white/40">arrow_forward</span>
          </button>
        </div>
      </div>

    </>
  );
}
