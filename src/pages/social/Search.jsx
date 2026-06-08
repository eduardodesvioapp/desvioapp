import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { PremiumButton, Loading } from '@/components/ui';
import { UserCard } from '@/components/patterns';
import { toast } from 'sonner';

export function Search() {
  const navigate = useNavigate();
  const { user: currentUserData } = useAuthStore();
  const [results, setResults] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState(new Map());

  // Perfil incompleto?
  const currentUserScore = currentUserData?.profile_score || 0;
  const isBlocked = currentUserScore < 85;

  const userId = currentUserData?.id;
  const STORAGE_KEY = userId ? `desvio:filters:${userId}` : null;

  const DEFAULT_FILTERS = {
    minAge: 18,
    maxAge: 50,
    maxDistance: 50,
    gender: 'all',
    minHeight: 140,
    maxHeight: 220,
    eyes: [],
    hair: [],
    interests: [],
    type: 'all', // human, ai, all
    minCompatibility: 50,
    maxCompatibility: 100,
    weights: [],
    skinColors: []
  };

  const loadFilters = () => {
    if (!STORAGE_KEY) return DEFAULT_FILTERS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  };

  // Filtros
  const [filters, setFilters] = useState(loadFilters);
  const [allInterests, setAllInterests] = useState([]);

  // Persiste filtros no localStorage sempre que mudarem
  useEffect(() => {
    if (STORAGE_KEY) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters, STORAGE_KEY]);

  const [spawning, setSpawning] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchInterests();
  }, []);

  async function fetchInterests() {
    const { data } = await supabase.from('interests').select('*');
    if (data) setAllInterests(data);
  }

  async function fetchUsers(isRetry = false) {
    if (isBlocked) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) setLoading(true);
      
      // Chama a RPC segura que criamos no Postgres
      const { data, error } = await supabase.rpc('search_users_safe', {
        p_user_id: currentUserData?.id,
        p_min_age: filters.minAge,
        p_max_age: filters.maxAge,
        p_max_dist: filters.maxDistance,
        p_type: filters.type,
        p_gender: filters.gender,
        p_hair_colors: filters.hair,
        p_eyes_colors: filters.eyes,
        p_skin_colors: filters.skinColors,
        p_weights: filters.weights,
        p_min_height: filters.minHeight,
        p_max_height: filters.maxHeight,
        p_min_compat: filters.minCompatibility,
        p_max_compat: filters.maxCompatibility
      });

      if (error) throw error;

      let filtered = data || [];

      // Filtro de Interesses (Vibe) - Mantemos no client por enquanto pois exige busca em outra tabela
      if (filters.interests.length > 0 && filtered.length > 0) {
        const { data: uiData } = await supabase
          .from('user_interests')
          .select('user_id, interest_id')
          .in('user_id', filtered.map(u => u.id));
        
        const userInterestsMap = new Map();
        if (uiData) {
            uiData.forEach(row => {
                if (!userInterestsMap.has(row.user_id)) {
                    userInterestsMap.set(row.user_id, []);
                }
                userInterestsMap.get(row.user_id).push(row.interest_id);
            });
        }

        filtered = filtered.filter(u => {
            const uInts = userInterestsMap.get(u.id) || [];
            return filters.interests.some(fid => uInts.includes(fid));
        });
      }

      // Lógica de Liquidez On-Demand
      console.log('[Radar] Buscando liquidez...', {
        results: filtered.length,
        isRetry,
        spawning,
        type: filters.type,
        dist: filters.maxDistance
      });

      if (filtered.length === 0 && !isRetry && !spawning && filters.type !== 'human' && filters.maxDistance >= 5) {
        console.log('[Radar] Gatilho de liquidez ativado.');
        setSpawning(true);
        toast.info('SINTONIZANDO SINAIS PROFUNDOS...', {
          description: 'Aguarde enquanto buscamos novos desvios para você.'
        });

        try {
          const { error: spawnError } = await supabase.rpc('spawn_synthetic_user', { 
            p_filters: {
              ...filters,
              latitude: currentUserData?.latitude,
              longitude: currentUserData?.longitude,
              city: currentUserData?.city
            } 
          });
          
          if (spawnError) throw spawnError;

          // Re-tenta a busca após 1.5s
          setTimeout(() => {
            setSpawning(false);
            fetchUsers(true);
          }, 1500);
          return;
        } catch (spawnErr) {
          console.error('[Radar] Falha ao gerar perfil IA:', spawnErr);
          toast.error('ERRO NA SINTONIA', {
            description: 'Não foi possível gerar novos desvios agora.'
          });
          setSpawning(false);
        }
      }

      // Busca interações (likes enviados ou matches)
      const { data: likesData } = await supabase
        .from('likes')
        .select('user_id, liked_user_id, status')
        .or(`user_id.eq.${currentUserData.id},liked_user_id.eq.${currentUserData.id}`);

      const likesMap = new Map();
      if (likesData) {
        likesData.forEach(l => {
          if (l.status === 'accepted') {
            const targetId = l.user_id === currentUserData.id ? l.liked_user_id : l.user_id;
            likesMap.set(targetId, 'accepted');
          } else if (l.user_id === currentUserData.id) {
            // Eu dei o like
            likesMap.set(l.liked_user_id, 'liked');
          }
        });
      }

      setUserLikes(likesMap);
      setResults(filtered);
    } catch (err) {
      console.error('[Radar] Erro fatal na busca:', err);
      toast.error('FALHA NA SÍNTESE', {
        description: 'Não foi possível sintonizar os sinais agora. Verifique sua conexão.'
      });
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleMultiFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="w-full">
      {/* Title Row - Immediately below header */}
      <div className="flex items-center gap-6 mb-6 px-4">
        <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5500] whitespace-nowrap">
          RADAR
        </h1>
        <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
      </div>

      {/* Actions Row - Above results */}
      <div className="flex justify-between items-center mb-8 px-4">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded hover:bg-white/10 transition-all group shrink-0"
        >
          <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors">tune</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Buscar</span>
        </button>

        {!loading && !isBlocked && (
          <div className="text-sm font-black text-primary flex items-center gap-1.5 text-right">
            <span>{results.length}</span>
            <span className="material-symbols-outlined text-lg">sensors</span>
          </div>
        )}
      </div>

      <div className="px-4">

        {/* Sidebar Filtros (Drawer) */}
        {isFilterOpen && (
          <aside className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
            <div className="relative w-full max-w-md bg-black border-l border-white/10 h-full p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-2xl font-headline font-black italic uppercase tracking-tighter text-primary">ESBARRAR COM ALGUEM NO SEU CAMINHO</h2>
                <PremiumButton
                  variant="circle"
                  icon="close"
                  onClick={() => setIsFilterOpen(false)}
                />
              </div>

              <div className="space-y-10">
                {/* Alcance */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Raio de Alcance ({filters.maxDistance}km)</label>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={filters.maxDistance}
                    onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                    className="w-full accent-primary bg-white/10 h-1.5 rounded appearance-none cursor-pointer"
                  />
                </section>

                {/* Idade */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Idade ({filters.minAge} - {filters.maxAge})</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={filters.minAge}
                      onChange={(e) => handleFilterChange('minAge', parseInt(e.target.value))}
                      className="bg-white/5 border border-white/10 rounded p-4 text-sm focus:border-primary/50 outline-none"
                    />
                    <input
                      type="number"
                      value={filters.maxAge}
                      onChange={(e) => handleFilterChange('maxAge', parseInt(e.target.value))}
                      className="bg-white/5 border border-white/10 rounded p-4 text-sm focus:border-primary/50 outline-none"
                    />
                  </div>
                </section>

                {/* Gênero */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Eu busco por</label>
                  <div className="flex flex-wrap gap-3">
                    {['all', 'Homem', 'Mulher', 'Não-binário'].map(g => (
                      <button
                        key={g}
                        onClick={() => handleFilterChange('gender', g)}
                        className={`px-5 py-2.5 min-h-[44px] flex items-center justify-center rounded text-[10px] font-black uppercase tracking-widest border transition-all ${filters.gender === g ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'}`}
                      >
                        {g === 'all' ? 'Todos' : g}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Tipo de Usuário (AI vs Human) */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Tipo de Perfis</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'all', label: 'Todos', icon: 'sensors' },
                      { id: 'human', label: 'Humanos', icon: 'person' },
                      { id: 'ai', label: 'IAs', icon: 'smart_toy' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleFilterChange('type', t.id)}
                        className={`px-5 py-2.5 min-h-[44px] flex-1 flex items-center justify-center gap-2 rounded text-[10px] font-black uppercase tracking-widest border transition-all ${filters.type === t.id ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'}`}
                      >
                        <span className="material-symbols-outlined text-sm">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Compatibilidade */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Compatibilidade ({filters.minCompatibility}% - {filters.maxCompatibility}%)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">MIN</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.minCompatibility}
                        onChange={(e) => handleFilterChange('minCompatibility', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded p-4 pl-12 text-sm focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">MAX</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.maxCompatibility}
                        onChange={(e) => handleFilterChange('maxCompatibility', parseInt(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded p-4 pl-12 text-sm focus:border-primary/50 outline-none"
                      />
                    </div>
                  </div>
                </section>



                {/* Atributos Visuais */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Caracteristicas Fisicas</label>
                  <div className="space-y-6">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-3">Altura ({filters.minHeight}cm - {filters.maxHeight}cm)</span>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          value={filters.minHeight}
                          onChange={(e) => handleFilterChange('minHeight', parseInt(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded p-4 text-[10px] focus:border-primary/50 outline-none text-white/60"
                        />
                        <input
                          type="number"
                          value={filters.maxHeight}
                          onChange={(e) => handleFilterChange('maxHeight', parseInt(e.target.value))}
                          className="bg-white/5 border border-white/10 rounded p-4 text-[10px] focus:border-primary/50 outline-none text-white/60"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-3">Olhos</span>
                      <div className="flex flex-wrap gap-2">
                        {['Castanho', 'Azul', 'Verde', 'Preto', 'Mel'].map(o => (
                          <button
                            key={o}
                            onClick={() => toggleMultiFilter('eyes', o)}
                            className={`px-4 py-2 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${filters.eyes.includes(o) ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'}`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-3">Cabelo</span>
                      <div className="flex flex-wrap gap-2">
                        {['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Colorido', 'Grisalho'].map(c => (
                          <button
                            key={c}
                            onClick={() => toggleMultiFilter('hair', c)}
                            className={`px-4 py-2 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${filters.hair.includes(c) ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-3">Pele</span>
                      <div className="flex flex-wrap gap-2">
                        {['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'].map(s => (
                          <button
                            key={s}
                            onClick={() => toggleMultiFilter('skinColors', s)}
                            className={`px-4 py-2 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${filters.skinColors?.includes(s) ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block mb-3">Peso</span>
                      <div className="flex flex-wrap gap-2">
                        {['Magro(a)', 'Normal', 'Gordo(a)'].map(w => (
                          <button
                            key={w}
                            onClick={() => toggleMultiFilter('weights', w)}
                            className={`px-4 py-2 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${filters.weights?.includes(w) ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'}`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Interesses */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Interesses</label>
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map(interest => (
                      <button
                        key={interest.id}
                        onClick={() => toggleMultiFilter('interests', interest.id)}
                        className={`px-4 py-2 min-h-[40px] flex items-center justify-center rounded text-[9px] font-black uppercase tracking-widest border transition-all ${filters.interests.includes(interest.id) ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'}`}
                      >
                        {interest.name}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="pt-4 pb-8">
                  <PremiumButton
                    fullWidth
                    size="lg"
                    onClick={() => { fetchUsers(); setIsFilterOpen(false); }}
                  >
                    FILTRAR
                  </PremiumButton>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Grid de Resultados */}
        {isBlocked ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded flex items-center justify-center mb-8 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-4xl animate-pulse">lock</span>
            </div>
            <h2 className="text-3xl font-headline font-black italic mb-4 uppercase tracking-tighter">Sinal_Interrompido</h2>
            <p className="max-w-md text-white/40 text-sm leading-relaxed mb-10 font-medium">
              Sua ressonância atual de <span className="text-primary font-black">{currentUserScore}%</span> é insuficiente para realizar buscas. Melhore seu dossiê para desbloquear conexões.
            </p>
            <div className="w-full max-w-sm p-8 bg-white/5 border border-white/10 rounded backdrop-blur-xl">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Progresso do Perfil</span>
                <span className="text-2xl font-black italic tracking-tighter text-primary">{currentUserScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded overflow-hidden mb-8">
                <div className="h-full bg-primary" style={{ width: `${currentUserScore}%` }}></div>
              </div>
              <PremiumButton
                fullWidth
                size="lg"
                onClick={() => navigate('/profile/edit')}
              >
                Completar Perfil
              </PremiumButton>
            </div>
          </div>
        ) : spawning ? (
          <Loading message="SINTONIZANDO SINAIS PROFUNDOS..." />
        ) : loading ? (
          <Loading message="BUSCANDO DESVIOS ..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {results.length === 0 ? (
              <div className="col-span-full py-24 text-center">
                {filters.maxDistance < 5 ? (
                  <>
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-4xl">distance</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-[0.3em]">Alcance Insuficiente</h3>
                    <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
                      Não encontramos perfis proximos a você. Tente aumentar a distância de alcance para buscar novos Desvios.
                    </p>
                    <button 
                      onClick={() => setIsFilterOpen(true)}
                      className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      Ajustar Filtros
                    </button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-white/20 text-6xl mb-6">person_search</span>
                    <p className="text-white/40 font-black uppercase tracking-widest">Nenhum sinal detectado na sua busca</p>
                  </>
                )}
              </div>
            ) : (
              results.map(profile => (
                <UserCard
                  key={profile.id}
                  user={profile}
                  initialStatus={userLikes.get(profile.id) || 'none'}
                  onClick={() => navigate(`/user/${profile.id}`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
