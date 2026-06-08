import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/patterns';
import { GlassCard, Loading, Badge } from '@/components/ui';
import { toast } from 'sonner';

export function SafetyCenter() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [activeEncounter, setActiveEncounter] = useState(false);

  const fetchContacts = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setContacts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, [user?.id]);

  const addContact = async (e) => {
    e.preventDefault();
    if (contacts.length >= 3) {
      toast.error('Limite de 3 contatos de emergência atingido');
      return;
    }

    const { error } = await supabase
      .from('emergency_contacts')
      .insert({ user_id: user.id, ...newContact });

    if (error) {
      toast.error('Erro ao adicionar contato');
    } else {
      toast.success('Contato adicionado');
      setNewContact({ name: '', phone: '' });
      fetchContacts();
    }
  };

  const deleteContact = async (id) => {
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
    if (!error) fetchContacts();
  };

  const toggleEncounter = async () => {
    if (contacts.length === 0) {
        toast.error('Adicione pelo menos um contato de emergência primeiro');
        return;
    }

    const newState = !activeEncounter;
    setLoading(true);

    try {
        if (newState) {
            // Ativando: 3 horas a partir de agora
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 3);

            // Tentar pegar localização atual
            let lat = null, lng = null;
            if ("geolocation" in navigator) {
                const pos = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null));
                });
                if (pos) {
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                }
            }

            const { error } = await supabase
                .from('users')
                .update({ 
                    safety_check_expires: expiresAt.toISOString(),
                    latitude: lat || user.latitude, // Atualiza se conseguir nova
                    longitude: lng || user.longitude
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.info('Modo encontro ativado por 3 horas');
        } else {
            // Desativando
            const { error } = await supabase
                .from('users')
                .update({ safety_check_expires: null })
                .eq('id', user.id);

            if (error) throw error;
            toast.info('Modo encontro encerrado');
        }
        setActiveEncounter(newState);
    } catch (err) {
        console.error(err);
        toast.error('Erro ao atualizar modo de segurança');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-4 md:px-8">
      <PageHeader>
        <div className="flex flex-col items-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Prevenção</h2>
            <h1 className="text-xl font-headline font-bold italic">CENTRAL_DE_SEGURANÇA</h1>
        </div>
      </PageHeader>

      <main className="max-w-2xl mx-auto space-y-10">
        {/* 1. Modo Encontro Seguro */}
        <section>
          <GlassCard className={`p-6 border-2 transition-all ${activeEncounter ? 'border-primary shadow-[0_0_30px_rgba(255,59,0,0.2)]' : 'border-white/5'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activeEncounter ? 'bg-primary text-white animate-pulse' : 'bg-white/5 text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined">{activeEncounter ? 'running_with_errors' : 'shield'}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modo Encontro Seguro</h3>
                        <p className="text-[10px] text-on-surface-variant">Proteção em tempo real para encontros presenciais</p>
                    </div>
                </div>
                <button 
                    onClick={toggleEncounter}
                    disabled={loading}
                    className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${activeEncounter ? 'bg-white text-black' : 'bg-primary text-white'} ${loading ? 'opacity-50' : ''}`}
                >
                    {loading ? 'Processando...' : activeEncounter ? 'Encerrar' : 'Ativar Agora'}
                </button>
            </div>
            {activeEncounter && (
                <div className="mt-4 p-4 rounded bg-primary/5 border border-primary/20">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                        <span className="text-primary font-bold">ALERTA ATIVO:</span> Se você não confirmar sua segurança nas próximas 3 horas, enviaremos sua última localização conhecida para seus contatos.
                    </p>
                </div>
            )}
          </GlassCard>
        </section>

        {/* 2. Contatos de Emergência */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">contact_emergency</span>
                <h2 className="font-headline font-bold text-white uppercase tracking-wider text-sm">Contatos de Confiança</h2>
            </div>
            <Badge variant="outline">{contacts.length}/3</Badge>
          </div>

          <div className="space-y-4">
            {loading ? <Loading /> : contacts.map(c => (
                <GlassCard key={c.id} className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-white">{c.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{c.phone}</p>
                    </div>
                    <button onClick={() => deleteContact(c.id)} className="text-on-surface-variant hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                </GlassCard>
            ))}

            {contacts.length < 3 && (
                <form onSubmit={addContact} className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-4">
                    <input 
                        type="text" 
                        placeholder="Nome" 
                        value={newContact.name}
                        onChange={e => setNewContact({...newContact, name: e.target.value})}
                        required
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                    <input 
                        type="tel" 
                        placeholder="Telefone" 
                        value={newContact.phone}
                        onChange={e => setNewContact({...newContact, phone: e.target.value})}
                        required
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                    <button type="submit" className="h-10 w-10 rounded bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </form>
            )}
          </div>
        </section>

        {/* 3. Dicas de Segurança */}
        <section className="pt-10 border-t border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-6">Dicas Essenciais</h3>
            <div className="grid gap-4 sm:grid-cols-2">
                {[
                    { t: 'Local Público', d: 'Sempre marque os primeiros encontros em locais com movimento.' },
                    { t: 'Transporte Próprio', d: 'Evite aceitar carona ou ir no carro de estranhos na primeira vez.' },
                    { t: 'Celular Carregado', d: 'Sempre tenha bateria e crédito antes de sair para um encontro.' },
                    { t: 'Confie no Instinto', d: 'Se algo parecer errado, não hesite em cancelar e ir embora.' }
                ].map(tip => (
                    <div key={tip.t} className="p-4 rounded border border-white/5 bg-white/[0.02]">
                        <p className="text-[10px] font-bold text-primary uppercase mb-1">{tip.t}</p>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">{tip.d}</p>
                    </div>
                ))}
            </div>
        </section>
      </main>
    </div>
  );
}
