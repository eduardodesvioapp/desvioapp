import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GlassCard, BackButton } from '@/components/ui';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    online: 0,
    newToday: 0,
    reports: 0,
    security: '100%'
  });
  const [loading, setLoading] = useState(true);

  const adminModules = [
    {
      title: 'Moderação',
      description: 'Gerencie denúncias de usuários e conteúdo inapropriado.',
      icon: 'gavel',
      path: '/admin/moderation',
      color: 'text-primary'
    },
    {
      title: 'Atividades de Login',
      description: 'Histórico de auditoria de acessos e renovações de sessão.',
      icon: 'history',
      path: '/admin/audit',
      color: 'text-blue-400'
    },
    {
      title: 'Métricas e Custos de IA',
      description: 'Auditoria de tokens utilizados, desempenho de personas e estimativas de despesas com a API do Gemini.',
      icon: 'neurology',
      path: '/admin/ai-metrics',
      color: 'text-purple-400'
    },
    {
      title: 'Usuários',
      description: 'Visualização e gerenciamento da base de usuários.',
      icon: 'group',
      path: '/admin/users',
      color: 'text-green-400',
      disabled: true
    },
    {
      title: 'Configurações do Sistema',
      description: 'Ajustes de parâmetros globais e manutenção.',
      icon: 'settings_suggest',
      path: '/admin/settings',
      color: 'text-on-surface-variant',
      disabled: true
    }
  ];

  const fetchStats = async () => {
    try {
      // Online: ativos nos últimos 5 minutos
      const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
      const { count: onlineCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('last_active', fiveMinsAgo);

      // Novos hoje: criados desde meia-noite
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Denúncias pendentes
      const { count: reportCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        online: onlineCount || 0,
        newToday: newCount || 0,
        reports: reportCount || 0,
        security: '100%'
      });
    } catch (err) {
      console.error('[AdminDashboard] Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      {/* Title Header */}
      <div className="flex items-center gap-6 mb-12 px-4">
        <BackButton to="/search" />
        <div className="flex flex-col">
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5500] whitespace-nowrap">
            PAINEL DE CONTROLE
          </h1>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">Cockpit Administrativo e BI do Sistema</p>
        </div>
        <div className="h-[1px] flex-1 bg-[#FF5500]"></div>
      </div>

      <main className="max-w-5xl mx-auto mt-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminModules.map((module) => (
            <Link 
                key={module.path} 
                to={module.disabled ? '#' : module.path}
                className={`${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.02] active:scale-95'} transition-all`}
            >
                <GlassCard hover variant="default" padding="p-8" className="h-full group hover:border-primary/20">
                    <div className="flex items-start gap-6">
                        <div className={`h-14 w-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${module.color} group-hover:bg-primary/10 group-hover:border-primary/20 transition-all`}>
                            <span className="material-symbols-outlined text-3xl">{module.icon}</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">{module.title}</h3>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                {module.description}
                            </p>
                            {module.disabled && (
                                <span className="inline-block mt-4 text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded text-white/30">
                                    Em Breve
                                </span>
                            )}
                        </div>
                        {!module.disabled && (
                            <span className="material-symbols-outlined text-white/10 group-hover:text-primary transition-colors">
                                arrow_forward_ios
                            </span>
                        )}
                    </div>
                </GlassCard>
            </Link>
          ))}
        </div>

        {/* Estatísticas Reais */}
        <section className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { label: 'Usuários Online', value: stats.online, icon: 'sensors' },
                { label: 'Novos Hoje', value: stats.newToday, icon: 'person_add' },
                { label: 'Denúncias', value: stats.reports, icon: 'report' },
                { label: 'Segurança', value: stats.security, icon: 'verified_user' }
            ].map(stat => (
                <GlassCard 
                    key={stat.label} 
                    hover
                    variant="default"
                    padding="p-6"
                    className="text-center flex flex-col items-center justify-center min-h-[140px]"
                >
                    <span className="material-symbols-outlined text-white/20 text-2xl mb-3">{stat.icon}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">{stat.label}</p>
                    <p className="text-3xl font-headline font-black text-white">{stat.value}</p>
                </GlassCard>
            ))}
        </section>
      </main>
    </div>
  );
}
