import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logoDark from '@/assets/logo-dark.png';

const sections = [
  { id: 'elegibilidade', title: 'Elegibilidade' },
  { id: 'conta', title: 'Conta de Usuário' },
  { id: 'conduta', title: 'Código de Conduta' },
  { id: 'conteudo', title: 'Conteúdo' },
  { id: 'assinaturas', title: 'Assinaturas' },
  { id: 'responsabilidade', title: 'Responsabilidade' },
  { id: 'suspensao', title: 'Suspensão' },
  { id: 'alteracoes', title: 'Alterações' },
  { id: 'lei', title: 'Lei Aplicável' },
];

export function Terms() {
  const [activeSection, setActiveSection] = useState('elegibilidade');
  const observerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
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

      <div className="mx-auto max-w-7xl px-6 py-16 lg:grid lg:grid-cols-[240px_1fr] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-4 text-[10px] font-label font-semibold uppercase tracking-[0.15em] text-on-surface-variant">Nesta página</p>
            <nav className="flex flex-col gap-1">
              {sections.map(({ id, title }) => (
                <a key={id} href={`#${id}`} className={`rounded px-3 py-2 text-xs font-label transition-all ${activeSection === id ? 'bg-white/5 text-white border-l-2 border-primary pl-[10px]' : 'text-on-surface-variant hover:text-white'}`}>
                  {title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main>
          <div className="mb-16 border-b border-white/5 pb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>description</span>
              <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant">Termos de Uso</span>
            </div>
            <h1 className="mb-4 font-headline text-4xl font-bold leading-tight lg:text-5xl">
              Regras que fazem<br />
              <span className="text-primary">a plataforma funcionar.</span>
            </h1>
            <p className="max-w-xl font-body text-sm leading-relaxed text-on-surface-variant">
              Última atualização: 14 de maio de 2026. Ao criar uma conta no Desvio,
              você concorda com estes termos. Leia com atenção.
            </p>
          </div>

          <div className="space-y-14 font-body text-sm leading-relaxed text-on-surface-variant">

            <Section id="elegibilidade" title="1. Elegibilidade">
              <div className="rounded border border-primary/30 bg-primary/5 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>18_up_rating</span>
                  <span className="font-semibold text-white">Plataforma exclusiva para maiores de 18 anos</span>
                </div>
                <p>
                  Para usar o Desvio, você deve ter pelo menos 18 anos de idade e
                  ser capaz de celebrar contratos juridicamente vinculantes. Ao se
                  cadastrar, você declara e garante que atende a esses requisitos.
                  Verificações de idade poderão ser solicitadas a qualquer momento.
                </p>
              </div>
              <p className="mt-5">
                Usuários de países onde o acesso a plataformas de relacionamento adulto é
                proibido por lei são responsáveis por verificar a legalidade do uso
                antes de criar uma conta.
              </p>
            </Section>

            <Section id="conta" title="2. Sua Conta">
              <p>Ao criar uma conta, você assume as seguintes responsabilidades:</p>
              <ul className="mt-4 space-y-3">
                {[
                  { icon: 'verified_user', t: 'Identidade', d: 'Fornecer informações verdadeiras e manter seu perfil atualizado.' },
                  { icon: 'lock', t: 'Segurança', d: 'Manter sua senha confidencial. Você é responsável por toda atividade em sua conta.' },
                  { icon: 'person_off', t: 'Exclusividade', d: 'Uma conta por pessoa. Contas compartilhadas ou duplicadas serão encerradas.' },
                  { icon: 'no_accounts', t: 'Não-transferência', d: 'Sua conta é pessoal e intransferível.' },
                ].map(({ icon, t, d }) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-primary" style={{ fontSize: '18px' }}>{icon}</span>
                    <div><span className="font-semibold text-white">{t}:</span> {d}</div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="conduta" title="3. Código de Conduta">
              <p>O Desvio é um espaço de respeito. São <strong className="text-white">estritamente proibidos</strong>:</p>
              <div className="mt-5 space-y-2">
                {[
                  'Assédio, ameaças ou intimidação a outros usuários',
                  'Publicação de conteúdo envolvendo menores de idade',
                  'Uso de perfis falsos ou identidade de terceiros',
                  'Spam, mensagens automatizadas ou scraping',
                  'Extorsão, chantagem ou qualquer forma de coerção',
                  'Promoção de serviços sexuais comerciais',
                  'Compartilhamento não consentido de conteúdo íntimo de terceiros',
                  'Uso da plataforma para fins ilegais',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded border border-primary/10 bg-primary/[0.03] px-4 py-3">
                    <span className="material-symbols-outlined mt-0.5 text-primary" style={{ fontSize: '16px' }}>block</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5">
                Violações resultarão em suspensão imediata da conta, sem direito a
                reembolso de valores pagos, e poderão ser reportadas às autoridades competentes.
              </p>
            </Section>

            <Section id="conteudo" title="4. Conteúdo do Usuário">
              <p>
                Você retém a propriedade do conteúdo que publica. Ao submeter conteúdo
                ao Desvio, você nos concede uma licença não-exclusiva, mundial e
                royalty-free para:
              </p>
              <ul className="mt-4 space-y-2 pl-4">
                {[
                  'Exibir seu conteúdo para outros usuários',
                  'Armazenar e fazer backup do conteúdo',
                  'Otimizar e compactar mídias para entrega eficiente',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed">
                <span className="material-symbols-outlined mr-2 align-middle text-primary" style={{ fontSize: '14px' }}>info</span>
                Não usamos seu conteúdo para fins comerciais ou de treinamento de IA.
                Ao excluir sua conta, todo o conteúdo é removido em conformidade com
                nossa política de retenção.
              </div>
            </Section>

            <Section id="assinaturas" title="5. Assinaturas e Pagamentos">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { plan: 'Free', desc: 'Acesso básico à plataforma com funcionalidades limitadas.', price: 'Grátis' },
                  { plan: 'Plus', desc: 'Recursos avançados de busca, galeria privada e chat ilimitado.', price: 'Mensal' },
                  { plan: 'Premium', desc: 'Acesso completo, boost de perfil e suporte prioritário.', price: 'Anual' },
                ].map(({ plan, desc, price }) => (
                  <div key={plan} className="rounded border border-white/10 bg-white/[0.02] p-4">
                    <div className="mb-1 font-headline font-bold text-white">{plan}</div>
                    <div className="mb-2 text-xs">{desc}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">{price}</div>
                  </div>
                ))}
              </div>
              <ul className="mt-6 space-y-2 pl-4">
                {[
                  'Assinaturas são renovadas automaticamente até cancelamento',
                  'Cancelamentos entram em vigor no próximo ciclo de faturamento',
                  'Não há reembolso de períodos já pagos, salvo obrigação legal',
                  'Preços podem ser alterados com aviso de 30 dias de antecedência',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="responsabilidade" title="6. Limitação de Responsabilidade">
              <p>
                O Desvio é uma plataforma de conexão entre adultos. Não garantimos
                autenticidade de perfis, resultados de relacionamentos ou segurança
                em encontros pessoais.
              </p>
              <p className="mt-4">Nossa responsabilidade está limitada a:</p>
              <ul className="mt-3 space-y-2 pl-4">
                {[
                  'Manter a plataforma operacional com SLA de 99,5%',
                  'Investigar denúncias de abuso em até 24 horas',
                  'Proteger seus dados conforme nossa Política de Privacidade',
                  'Reembolsar créditos em caso de falha de pagamento comprovada',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5">
                Em hipótese alguma o Desvio será responsável por danos indiretos,
                incidentais ou consequenciais decorrentes do uso da plataforma.
              </p>
            </Section>

            <Section id="suspensao" title="7. Suspensão e Encerramento">
              <p>
                Podemos suspender ou encerrar sua conta, com ou sem aviso, nas seguintes situações:
              </p>
              <ul className="mt-4 space-y-2 pl-4">
                {[
                  'Violação de qualquer item do Código de Conduta',
                  'Fraude, chargebak indevido ou manipulação de pagamentos',
                  'Uso suspeito que coloque outros usuários em risco',
                  'Determinação judicial ou regulatória',
                  'Inatividade superior a 12 meses (com aviso prévio)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5">
                Você pode encerrar sua conta a qualquer momento nas Configurações.
                Após exclusão, seus dados seguem o cronograma descrito na Política de Privacidade.
              </p>
            </Section>

            <Section id="alteracoes" title="8. Alterações nos Termos">
              <p>
                Podemos atualizar estes Termos periodicamente. Quando houver mudanças
                relevantes, você será notificado por e-mail com no mínimo 15 dias de
                antecedência. O uso continuado da plataforma após esse prazo implica
                aceitação dos novos termos.
              </p>
              <div className="mt-5 rounded border border-white/10 bg-white/[0.03] p-4 text-xs">
                <span className="material-symbols-outlined mr-2 align-middle text-primary" style={{ fontSize: '14px' }}>history</span>
                Histórico de versões disponível mediante solicitação em{' '}
                <a href="mailto:legal@desvio.app" className="text-primary underline underline-offset-2">legal@desvio.app</a>.
              </div>
            </Section>

            <Section id="lei" title="9. Lei Aplicável e Foro">
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil.
                Quaisquer disputas serão submetidas ao foro da Comarca de São Paulo,
                SP, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
              </p>
              <p className="mt-4">
                Tentaremos resolver qualquer conflito amigavelmente antes de qualquer
                medida judicial. Entre em contato em{' '}
                <a href="mailto:legal@desvio.app" className="text-primary underline underline-offset-2">
                  legal@desvio.app
                </a>
                .
              </p>
            </Section>

          </div>
        </main>
      </div>

      <PageFooter active="termos" />
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
