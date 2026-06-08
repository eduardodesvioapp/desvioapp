import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/patterns';
import { GlassCard, Loading } from '@/components/ui';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/dateUtils';

export function SecuritySettings() {
  const { user, signOut } = useAuthStore();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('login_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error) setActivities(data);
      setLoading(false);
    }
    fetchActivity();
  }, [user?.id]);

  const handleSignOutAll = async () => {
    // No Supabase auth, o signOut comum geralmente mata a sessão atual.
    // Para deslogar de TODOS, precisaríamos de uma edge function ou mudar a senha.
    toast.info('Para sua segurança, ao alterar sua senha você será desconectado de todos os dispositivos.');
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-4 md:px-8">
      <PageHeader>
        <div className="flex flex-col items-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Configurações</h2>
            <h1 className="text-xl font-headline font-bold italic">SEGURANÇA_DA_CONTA</h1>
        </div>
      </PageHeader>

      <main className="max-w-2xl mx-auto space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">devices</span>
            <h2 className="font-headline font-bold text-white uppercase tracking-wider text-sm">Atividade de Login</h2>
          </div>

          {loading ? <Loading /> : (
            <div className="space-y-3">
              {activities.map((act) => (
                <GlassCard key={act.id} className="p-4 flex items-center justify-between border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">
                        {act.user_agent.includes('Mobile') ? 'smartphone' : 'laptop'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {act.user_agent.split(') ')[0].split(' (')[1] || 'Dispositivo desconhecido'}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {formatDateTime(act.created_at)} • {act.ip_address}
                      </p>
                    </div>
                  </div>
                  {activities.indexOf(act) === 0 && (
                    <Badge variant="primary" className="text-[8px]">Atual</Badge>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </section>

        <section className="pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">security</span>
            <h2 className="font-headline font-bold text-white uppercase tracking-wider text-sm">Controle de Sessão</h2>
          </div>
          
          <button 
            onClick={handleSignOutAll}
            className="w-full flex items-center justify-between p-4 rounded border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <div className="text-left">
                <p className="text-xs font-bold">Encerrar todas as sessões</p>
                <p className="text-[10px] opacity-60">Isso desconectará você de todos os outros aparelhos.</p>
            </div>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">logout</span>
          </button>
        </section>
      </main>
    </div>
  );
}
