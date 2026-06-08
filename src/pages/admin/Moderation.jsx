import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GlassCard, Badge, Loading, Avatar, BackButton } from '@/components/ui';
import { toast } from 'sonner';

export function Moderation() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_active_reports');
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('[Moderation] Error fetching reports:', err);
      toast.error('Erro ao carregar denúncias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportedId, action) => {
    setProcessing(reportedId);
    try {
      // Aqui simularíamos as ações de moderação. 
      // Em um sistema real, teríamos RPCs como `admin_ban_user` ou `admin_dismiss_reports`.
      
      if (action === 'dismiss') {
        const { error } = await supabase
          .from('reports')
          .update({ status: 'dismissed', reviewed_at: new Date().toISOString() })
          .eq('reported_id', reportedId)
          .eq('status', 'pending');
        
        if (error) throw error;
        toast.success('Denúncias arquivadas');
      } else if (action === 'ban') {
          // Exemplo de banimento (poderia ser uma coluna is_banned ou deletar o user)
          toast.warning('Funcionalidade de banimento requer RPC específico no banco');
      }

      fetchReports();
    } catch (err) {
      console.error('[Moderation] Error executing action:', err);
      toast.error('Erro ao executar ação');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-[100%] mx-auto">
      {/* Title Header */}
      <div className="flex items-center gap-6 mb-12 px-4">
        <BackButton to="/admin/dashboard" />
        <div className="flex flex-col">
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5500] whitespace-nowrap">
            PAINEL DE MODERAÇÃO
          </h1>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">Gerenciamento e Auditoria de Perfis Denunciados</p>
        </div>
        <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
      </div>

      <main className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded border border-primary/20 bg-primary/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status do Sistema</p>
                    <p className="text-sm font-bold text-white">{reports.length} Perfis Denunciados</p>
                </div>
            </div>
            <button 
                onClick={fetchReports}
                className="flex items-center gap-2 px-4 py-2 rounded border border-white/10 hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest"
            >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Atualizar
            </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loading />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-lg">
            <span className="material-symbols-outlined text-5xl text-white/10 mb-4">check_circle</span>
            <h3 className="text-white font-bold">Nenhuma denúncia pendente</h3>
            <p className="text-xs text-on-surface-variant">A comunidade está limpa no momento.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <GlassCard key={report.reported_id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar size="xl" src={report.reported_profile_image_url} alt={report.reported_name} />
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{report.reported_name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {report.reasons.map((reason) => (
                          <Badge key={reason} variant="danger" className="text-[9px]">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block mr-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Acumulado</p>
                      <p className="text-xl font-headline font-bold text-primary">{report.report_count} Denúncias</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(report.reported_id, 'dismiss')}
                        disabled={processing === report.reported_id}
                        className="h-12 px-6 rounded border border-white/10 hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Ignorar
                      </button>
                      <button
                        onClick={() => handleAction(report.reported_id, 'ban')}
                        disabled={processing === report.reported_id}
                        className="h-12 px-6 rounded bg-primary text-white hover:bg-primary/80 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,59,0,0.3)]"
                      >
                        Banir Perfil
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
