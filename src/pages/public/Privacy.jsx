import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logoDark from '@/assets/logo-dark.png';

const sections = [
  { id: 'coleta', title: 'Dados Coletados' },
  { id: 'uso', title: 'Uso dos Dados' },
  { id: 'compartilhamento', title: 'Compartilhamento' },
  { id: 'retencao', title: 'Retenção' },
  { id: 'direitos', title: 'Seus Direitos' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'seguranca', title: 'Segurança' },
  { id: 'menores', title: 'Menores de Idade' },
  { id: 'contato', title: 'Contato' },
];

export function Privacy() {
  const [activeSection, setActiveSection] = useState('coleta');
  const observerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0% -70% 0%' }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/">
            <img src={logoDark} alt="Desvio" className="h-4 opacity-70 transition-opacity hover:opacity-100" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-label text-on-surface-variant transition-colors hover:text-white"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:grid lg:grid-cols-[240px_1fr] lg:gap-16">
        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-4 text-[10px] font-label font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
              Nesta página
            </p>
            <nav className="flex flex-col gap-1">
              {sections.map(({ id, title }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`rounded px-3 py-2 text-xs font-label transition-all ${
                    activeSection === id
                      ? 'bg-white/5 text-white border-l-2 border-primary pl-[10px]'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  {title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main>
          {/* Hero */}
          <div className="mb-16 border-b border-white/5 pb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>shield</span>
              <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant">
                Política de Privacidade
              </span>
            </div>
            <h1 className="mb-4 font-headline text-4xl font-bold leading-tight text-white lg:text-5xl">
              Seus dados.<br />
              <span className="text-primary">Sua privacidade.</span>
            </h1>
            <p className="max-w-xl font-body text-sm leading-relaxed text-on-surface-variant">
              Última atualização: 14 de maio de 2026. Este documento explica como
              coletamos, usamos e protegemos suas informações pessoais na plataforma Desvio.
            </p>
          </div>

          <div className="space-y-14 font-body text-sm leading-relaxed text-on-surface-variant">

            <Section id="coleta" title="1. Dados que Coletamos">
              <p>Coletamos apenas os dados necessários para o funcionamento da plataforma:</p>
              <ul className="mt-4 space-y-3">
                <DataItem icon="person" title="Dados de cadastro">
                  Nome de exibição, endereço de e-mail, data de nascimento e cidade.
                </DataItem>
                <DataItem icon="photo_camera" title="Conteúdo do perfil">
                  Fotos, preferências, orientação sexual e demais informações que você
                  optar por compartilhar.
                </DataItem>
                <DataItem icon="location_on" title="Localização aproximada">
                  Utilizada para calcular distância entre usuários. Nunca armazenamos
                  coordenadas precisas.
                </DataItem>
                <DataItem icon="devices" title="Dados técnicos">
                  Endereço IP, tipo de dispositivo, sistema operacional e logs de acesso
                  para fins de segurança.
                </DataItem>
              </ul>
            </Section>

            <Section id="uso" title="2. Como Usamos seus Dados">
              <p>Seus dados são usados exclusivamente para:</p>
              <ul className="mt-4 space-y-2 pl-4">
                {[
                  'Exibir seu perfil para outros usuários compatíveis',
                  'Processar matches e facilitar conversas',
                  'Enviar notificações relevantes (configuráveis)',
                  'Melhorar algoritmos de recomendação de forma anônima',
                  'Cumprir obrigações legais e regulatórias',
                  'Proteger a plataforma contra fraudes e abusos',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <InfoBox>
                Nunca vendemos seus dados a terceiros, nem usamos seu conteúdo
                para treinar modelos de inteligência artificial de terceiros.
              </InfoBox>
            </Section>

            <Section id="compartilhamento" title="3. Compartilhamento de Dados">
              <p>
                Compartilhamos dados com terceiros apenas nas seguintes situações:
              </p>
              <div className="mt-6 space-y-4">
                <ShareCard title="Provedores de infraestrutura" icon="cloud">
                  Supabase (banco de dados e armazenamento) e servidores de hospedagem.
                  Todos sob contrato de DPA conforme a LGPD.
                </ShareCard>
                <ShareCard title="Autoridades competentes" icon="gavel">
                  Apenas quando exigido por ordem judicial ou obrigação legal,
                  mediante análise criteriosa.
                </ShareCard>
                <ShareCard title="Nunca com anunciantes" icon="block">
                  Não exibimos anúncios. Seus dados comportamentais jamais são
                  compartilhados para fins publicitários.
                </ShareCard>
              </div>
            </Section>

            <Section id="retencao" title="4. Retenção de Dados">
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa. Ao solicitar
                exclusão:
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: '48h', desc: 'Remoção do perfil público' },
                  { label: '30 dias', desc: 'Exclusão de mídias e mensagens' },
                  { label: '90 dias', desc: 'Remoção de logs de segurança' },
                ].map(({ label, desc }) => (
                  <div key={label} className="rounded border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-1 font-headline text-2xl font-bold text-white">{label}</div>
                    <div className="text-xs text-on-surface-variant">{desc}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="direitos" title="5. Seus Direitos (LGPD)">
              <p>
                Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:
              </p>
              <ul className="mt-4 space-y-2 pl-4">
                {[
                  'Acessar todos os dados que temos sobre você',
                  'Corrigir dados incompletos ou incorretos',
                  'Solicitar portabilidade dos seus dados',
                  'Revogar consentimento a qualquer momento',
                  'Solicitar exclusão completa da conta e dados',
                  'Obter informações sobre com quem compartilhamos seus dados',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-primary" style={{ fontSize: '14px' }}>check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
              <InfoBox>
                Para exercer qualquer direito, envie uma solicitação em{' '}
                <a href="mailto:privacidade@desvio.app" className="text-primary underline underline-offset-2">
                  privacidade@desvio.app
                </a>
                . Respondemos em até 15 dias úteis.
              </InfoBox>
            </Section>

            <Section id="cookies" title="6. Cookies e Tecnologias Similares">
              <p>Utilizamos um conjunto mínimo de cookies essenciais:</p>
              <div className="mt-5 space-y-3">
                {[
                  { type: 'Essenciais', desc: 'Autenticação e sessão. Não podem ser desativados.', required: true },
                  { type: 'Preferências', desc: 'Configurações de interface (tema, idioma).', required: false },
                  { type: 'Analíticos', desc: 'Métricas anônimas de uso via ferramentas próprias.', required: false },
                ].map(({ type, desc, required }) => (
                  <div key={type} className="flex items-start justify-between gap-4 rounded border border-white/8 bg-white/[0.02] px-4 py-3">
                    <div>
                      <div className="mb-0.5 text-xs font-semibold text-white">{type}</div>
                      <div className="text-xs">{desc}</div>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${required ? 'bg-primary/10 text-primary' : 'bg-white/5 text-on-surface-variant'}`}>
                      {required ? 'Obrigatório' : 'Opcional'}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="seguranca" title="7. Segurança">
              <p>
                Implementamos medidas técnicas e organizacionais rigorosas para proteger seus dados:
              </p>
              <ul className="mt-4 space-y-2 pl-4">
                {[
                  'Criptografia TLS 1.3 em todas as transmissões',
                  'Dados sensíveis criptografados em repouso (AES-256)',
                  'Row Level Security (RLS) no banco de dados',
                  'Autenticação de dois fatores disponível',
                  'Auditorias de segurança periódicas',
                  'Acesso interno restrito por função (RBAC)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-primary" style={{ fontSize: '14px' }}>lock</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="menores" title="8. Menores de Idade">
              <div className="rounded border border-primary/30 bg-primary/5 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>warning</span>
                  <span className="font-semibold text-white">Plataforma restrita a maiores de 18 anos</span>
                </div>
                <p>
                  O Desvio é destinado exclusivamente a adultos. Não coletamos
                  conscientemente dados de menores. Caso identifiquemos um cadastro
                  de menor, a conta será imediatamente encerrada e os dados excluídos.
                  Se você suspeitar de uso indevido, reporte em{' '}
                  <a href="mailto:seguranca@desvio.app" className="text-primary underline underline-offset-2">
                    seguranca@desvio.app
                  </a>.
                </p>
              </div>
            </Section>

            <Section id="contato" title="9. Contato e DPO">
              <p>
                Dúvidas sobre esta política ou sobre o tratamento dos seus dados:
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ContactCard icon="mail" label="E-mail geral">privacidade@desvio.app</ContactCard>
                <ContactCard icon="security" label="Encarregado (DPO)">dpo@desvio.app</ContactCard>
              </div>
            </Section>

          </div>
        </main>
      </div>

      <PageFooter active="privacidade" />
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-5 font-headline text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function DataItem({ icon, title, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="material-symbols-outlined mt-0.5 text-primary" style={{ fontSize: '18px' }}>{icon}</span>
      <div>
        <span className="font-semibold text-white">{title}:</span>{' '}
        {children}
      </div>
    </li>
  );
}

function InfoBox({ children }) {
  return (
    <div className="mt-5 rounded border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed">
      <span className="material-symbols-outlined mr-2 align-middle text-primary" style={{ fontSize: '14px' }}>info</span>
      {children}
    </div>
  );
}

function ShareCard({ title, icon, children }) {
  return (
    <div className="flex items-start gap-4 rounded border border-white/8 bg-white/[0.02] p-4">
      <span className="material-symbols-outlined mt-0.5 text-primary" style={{ fontSize: '20px' }}>{icon}</span>
      <div>
        <div className="mb-1 text-xs font-semibold text-white">{title}</div>
        <div className="text-xs">{children}</div>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, children }) {
  return (
    <a
      href={`mailto:${children}`}
      className="flex items-center gap-3 rounded border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{icon}</span>
      <div>
        <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">{label}</div>
        <div className="text-xs font-semibold text-white">{children}</div>
      </div>
    </a>
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
