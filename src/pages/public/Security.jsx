import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoDark from '@/assets/logo-dark.png';

const practices = [
  {
    icon: 'lock',
    title: 'Criptografia de Ponta a Ponta',
    desc: 'Todas as comunicações entre seu dispositivo e nossos servidores são protegidas por TLS 1.3. Dados sensíveis são criptografados em repouso com AES-256.',
  },
  {
    icon: 'database',
    title: 'Row Level Security (RLS)',
    desc: 'Cada query no banco de dados verifica em nível de linha se o usuário autenticado tem permissão de acesso. Você nunca vê dados de outros usuários sem autorização explícita.',
  },
  {
    icon: 'verified_user',
    title: 'Autenticação Segura',
    desc: 'Senhas armazenadas com bcrypt (salt único por usuário). Sessões com tokens JWT de curta duração e refresh tokens rotativos.',
  },
  {
    icon: 'manage_accounts',
    title: 'Controle de Acesso (RBAC)',
    desc: 'Acesso interno aos dados é restrito por função. Engenheiros não têm acesso a dados de usuários em produção sem aprovação auditável.',
  },
  {
    icon: 'monitoring',
    title: 'Monitoramento Contínuo',
    desc: 'Logs de segurança em tempo real com alertas automáticos para atividades suspeitas, como tentativas de força bruta e acessos de IPs anômalos.',
  },
  {
    icon: 'policy',
    title: 'Auditorias Periódicas',
    desc: 'Realizamos revisões de segurança trimestrais e testes de penetração semestrais conduzidos por equipes independentes.',
  },
  {
    icon: 'backup',
    title: 'Backups e Recuperação',
    desc: 'Backups automáticos diários com retenção de 30 dias. Plano de recuperação de desastres testado regularmente com RTO de 4 horas.',
  },
  {
    icon: 'shield_with_heart',
    title: 'Proteção de Conteúdo Íntimo',
    desc: 'Fotos privadas em galerias protegidas só são visíveis mediante aprovação explícita do titular. Nenhum bot ou funcionário pode acessá-las.',
  },
];

const reportSteps = [
  { step: '01', title: 'Identifique', desc: 'Descreva o problema com o máximo de detalhes: comportamento, evidências, URLs afetadas.' },
  { step: '02', title: 'Reporte', desc: 'Envie para seguranca@desvio.app com o assunto "Vulnerability Report" ou use o formulário abaixo.' },
  { step: '03', title: 'Confirmação', desc: 'Você receberá uma confirmação em até 24 horas com um número de protocolo.' },
  { step: '04', title: 'Resolução', desc: 'Problemas críticos são corrigidos em até 72 horas. Você será notificado com créditos de agradecimento.' },
];

export function Security() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/">
            <img src={logoDark} alt="Desvio" className="h-4 opacity-70 transition-opacity hover:opacity-100" />
          </Link>
          <Link to="/" className="flex items-center gap-2 text-xs font-label text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Hero */}
        <div className="mb-20 border-b border-white/5 pb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>security</span>
            <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant">Central de Segurança</span>
          </div>
          <h1 className="mb-6 font-headline text-4xl font-bold leading-tight lg:text-5xl">
            Segurança não é<br />
            <span className="text-primary">uma feature. É fundação.</span>
          </h1>
          <p className="max-w-2xl font-body text-sm leading-relaxed text-on-surface-variant">
            Construímos o Desvio com segurança como princípio arquitetural, não como
            adição. Cada decisão técnica considera o impacto na privacidade e
            integridade dos nossos usuários.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: 'TLS 1.3', label: 'Protocolo de transmissão' },
              { value: 'AES-256', label: 'Criptografia em repouso' },
              { value: '99.5%', label: 'SLA de disponibilidade' },
              { value: '72h', label: 'Correção de vulnerabilidades críticas' },
            ].map(({ value, label }) => (
              <div key={label} className="rounded border border-white/8 bg-white/[0.02] p-4">
                <div className="mb-1 font-headline text-2xl font-bold text-primary">{value}</div>
                <div className="text-xs font-label text-on-surface-variant">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Practices Grid */}
        <section className="mb-20">
          <h2 className="mb-2 font-headline text-2xl font-bold text-white">Nossas Práticas de Segurança</h2>
          <p className="mb-10 font-body text-sm text-on-surface-variant">
            Uma abordagem em camadas que protege seus dados em todos os níveis.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {practices.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="group flex gap-4 rounded border border-white/8 bg-white/[0.02] p-5 transition-all hover:border-primary/20 hover:bg-primary/[0.03]"
              >
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded border border-white/10 bg-white/[0.04] transition-all group-hover:border-primary/30 group-hover:bg-primary/10">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{icon}</span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-headline text-sm font-bold text-white">{title}</h3>
                  <p className="font-body text-xs leading-relaxed text-on-surface-variant">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Responsible Disclosure */}
        <section className="mb-20">
          <div className="rounded border border-primary/20 bg-primary/[0.04] p-8">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>bug_report</span>
              </div>
              <div>
                <h2 className="mb-2 font-headline text-xl font-bold text-white">Divulgação Responsável</h2>
                <p className="font-body text-sm text-on-surface-variant">
                  Encontrou uma vulnerabilidade? Valorize a transparência. Siga o processo abaixo
                  e vamos corrigi-la juntos. Pesquisadores de segurança que reportam vulnerabilidades
                  válidas recebem reconhecimento público e créditos na plataforma.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {reportSteps.map(({ step, title, desc }) => (
                <div key={step} className="relative rounded border border-white/8 bg-[#050505]/60 p-4">
                  <div className="mb-3 font-headline text-3xl font-black text-primary/20">{step}</div>
                  <div className="mb-2 font-headline text-sm font-bold text-white">{title}</div>
                  <div className="font-body text-xs leading-relaxed text-on-surface-variant">{desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="mailto:seguranca@desvio.app"
                className="inline-flex items-center gap-2 rounded border border-primary bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-primary/80"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
                seguranca@desvio.app
              </a>
              <div className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>timer</span>
                Resposta em até 24 horas
              </div>
            </div>
          </div>
        </section>

        {/* Scope */}
        <section className="mb-20">
          <h2 className="mb-6 font-headline text-xl font-bold text-white">O que está no escopo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-white/8 bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Aceitamos reportes de
              </div>
              <ul className="space-y-2 font-body text-xs text-on-surface-variant">
                {['Injeção de SQL ou NoSQL', 'XSS (Cross-Site Scripting)', 'CSRF (Cross-Site Request Forgery)', 'Bypass de autenticação', 'Acesso não autorizado a dados de outros usuários', 'Exposição de informações sensíveis na API', 'Falhas em RLS no Supabase'].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-white/8 bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                <span className="h-2 w-2 rounded-full bg-on-surface-variant" />
                Fora do escopo
              </div>
              <ul className="space-y-2 font-body text-xs text-on-surface-variant">
                {['Ataques de engenharia social', 'Ataques de negação de serviço (DDoS)', 'Vulnerabilidades em versões desatualizadas de browsers', 'Spam ou phishing sem impacto técnico', 'Problemas de UX que não afetam segurança'].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-on-surface-variant/40" />{i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Tips for users */}
        <section>
          <h2 className="mb-6 font-headline text-xl font-bold text-white">Como você pode se proteger</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: 'key', t: 'Use senha forte', d: 'Mínimo 12 caracteres com letras, números e símbolos. Use um gerenciador de senhas.' },
              { icon: 'phonelink_lock', t: 'Ative o 2FA', d: 'Adicione uma segunda camada de autenticação nas configurações da sua conta.' },
              { icon: 'visibility_off', t: 'Galeria privada', d: 'Mantenha fotos íntimas na galeria privada. Aprove acessos individualmente.' },
              { icon: 'report', t: 'Denuncie abusos', d: 'Use o botão de denuncia nos perfis. Respondemos em até 24 horas.' },
              { icon: 'wifi_tethering_error', t: 'Cuidado com redes públicas', d: 'Evite acessar sua conta em redes Wi-Fi públicas sem VPN.' },
              { icon: 'update', t: 'Mantenha o app atualizado', d: 'Atualizações frequentes incluem correções de segurança importantes.' },
            ].map(({ icon, t, d }) => (
              <div key={t} className="rounded border border-white/8 bg-white/[0.02] p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded border border-white/10">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>{icon}</span>
                </div>
                <div className="mb-1 text-xs font-semibold text-white">{t}</div>
                <div className="text-xs leading-relaxed text-on-surface-variant">{d}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PageFooter active="seguranca" />
    </div>
  );
}

function PageFooter({ active }) {
  const links = [
    { to: '/privacy', label: 'Privacidade' },
    { to: '/terms', label: 'Termos' },
    { to: '/security', label: 'Segurança' },
    { to: '/contact', label: 'Contato' },
  ];
  return (
    <footer className="mt-20 border-t border-white/5 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center">
        <img src={logoDark} alt="Desvio" className="h-4 opacity-50" />
        <div className="flex flex-wrap justify-center gap-6 text-xs font-label text-on-surface-variant">
          {links.map(({ to, label }) => (
            <Link key={to} to={to} className={`transition-colors ${active === label.toLowerCase() ? 'text-primary' : 'hover:text-white'}`}>{label}</Link>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant">© 2026 Desvio. Encontros adultos para maiores de 18 anos.</p>
      </div>
    </footer>
  );
}
