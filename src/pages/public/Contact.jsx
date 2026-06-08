import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoDark from '@/assets/logo-dark.png';

const topics = [
  { value: 'suporte', label: 'Suporte geral', icon: 'help' },
  { value: 'conta', label: 'Problema com conta', icon: 'manage_accounts' },
  { value: 'pagamento', label: 'Pagamento / assinatura', icon: 'credit_card' },
  { value: 'privacidade', label: 'Privacidade / dados', icon: 'shield' },
  { value: 'abuso', label: 'Reportar abuso', icon: 'report' },
  { value: 'seguranca', label: 'Vulnerabilidade de segurança', icon: 'bug_report' },
  { value: 'outro', label: 'Outro assunto', icon: 'chat' },
];

const faqs = [
  {
    q: 'Como excluo minha conta permanentemente?',
    a: 'Acesse Configurações → Conta → Excluir conta. Você receberá uma confirmação por e-mail. A exclusão é processada em 48 horas e é irreversível.',
  },
  {
    q: 'Posso cancelar minha assinatura a qualquer momento?',
    a: 'Sim. Cancele em Configurações → Assinatura → Cancelar. O acesso premium continua até o fim do período já pago.',
  },
  {
    q: 'Um usuário está me assediando. O que faço?',
    a: 'Use o botão "Reportar" no perfil do usuário. Bloqueie-o para impedir qualquer contato imediato. Analisamos todas as denúncias em até 24 horas.',
  },
  {
    q: 'Encontrei um perfil falso. Como reporto?',
    a: 'Abra o perfil, toque nos três pontos e selecione "Reportar perfil falso". Inclua detalhes que suspeita serem fraudulentos.',
  },
  {
    q: 'Meu match desapareceu. O que aconteceu?',
    a: 'Matches desaparecem quando o outro usuário desfaz o like ou exclui a conta. Infelizmente não podemos recuperar matches desfeitos.',
  },
  {
    q: 'Como faço para ter fotos minhas removidas por outro usuário?',
    a: 'Se alguém compartilhou fotos suas sem consentimento, envie um e-mail urgente para seguranca@desvio.app com as evidências. Agimos em até 6 horas.',
  },
];

export function Contact() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [openFaq, setOpenFaq] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    // Simulate send – replace with real API call
    setTimeout(() => setStatus('success'), 1800);
  };

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

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
        <div className="mb-16 border-b border-white/5 pb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>support_agent</span>
            <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant">Fale Conosco</span>
          </div>
          <h1 className="mb-4 font-headline text-4xl font-bold leading-tight lg:text-5xl">
            Estamos aqui<br />
            <span className="text-primary">para ajudar.</span>
          </h1>
          <p className="max-w-xl font-body text-sm leading-relaxed text-on-surface-variant">
            Nossa equipe responde em até 48 horas. Para urgências de segurança,
            use o e-mail direto — respondemos em até 24 horas.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div>
            <h2 className="mb-6 font-headline text-xl font-bold text-white">Enviar mensagem</h2>

            {status === 'success' ? (
              <div className="flex flex-col items-center gap-4 rounded border border-primary/30 bg-primary/5 px-8 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded border border-primary/30 bg-primary/10">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>check_circle</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-white">Mensagem enviada!</h3>
                <p className="max-w-sm font-body text-sm text-on-surface-variant">
                  Recebemos seu contato e responderemos em até 48 horas no e-mail informado.
                </p>
                <button
                  onClick={() => { setForm({ nome: '', email: '', assunto: '', mensagem: '' }); setStatus('idle'); }}
                  className="mt-2 rounded border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome" id="nome" name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome" required />
                  <Field label="E-mail" id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" required />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="assunto">
                    Assunto
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {topics.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, assunto: value }))}
                        className={`flex items-center gap-2 rounded border px-3 py-2.5 text-left text-xs transition-all ${
                          form.assunto === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-white/10 bg-white/[0.02] text-on-surface-variant hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{icon}</span>
                        <span className="leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="mensagem">
                    Mensagem
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="mensagem"
                    name="mensagem"
                    value={form.mensagem}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Descreva sua dúvida ou problema com o máximo de detalhes..."
                    className="w-full resize-none rounded border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-white placeholder-on-surface-variant/50 transition-colors focus:border-primary focus:outline-none"
                  />
                  <div className="mt-1 text-right text-[10px] text-on-surface-variant">{form.mensagem.length} caracteres</div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending' || !form.assunto || !form.mensagem}
                  className="flex w-full items-center justify-center gap-2 rounded border border-primary bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
                >
                  {status === 'sending' ? (
                    <>
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
                      Enviar mensagem
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Direct contacts */}
            <div className="rounded border border-white/8 bg-white/[0.02] p-5">
              <h3 className="mb-4 font-headline text-sm font-bold text-white">Contatos diretos</h3>
              <div className="space-y-3">
                {[
                  { icon: 'mail', label: 'Suporte geral', value: 'suporte@desvio.app' },
                  { icon: 'shield', label: 'Privacidade / LGPD', value: 'privacidade@desvio.app' },
                  { icon: 'security', label: 'Segurança urgente', value: 'seguranca@desvio.app' },
                  { icon: 'gavel', label: 'Assuntos jurídicos', value: 'legal@desvio.app' },
                ].map(({ icon, label, value }) => (
                  <a key={value} href={`mailto:${value}`} className="flex items-center gap-3 rounded border border-white/5 bg-white/[0.01] px-3 py-2.5 transition-colors hover:border-primary/20 hover:bg-primary/[0.03]">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>{icon}</span>
                    <div>
                      <div className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant">{label}</div>
                      <div className="text-xs font-semibold text-white">{value}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Response time */}
            <div className="rounded border border-white/8 bg-white/[0.02] p-5">
              <h3 className="mb-4 font-headline text-sm font-bold text-white">Tempo de resposta</h3>
              <div className="space-y-3">
                {[
                  { type: 'Suporte geral', time: 'até 48h', color: 'text-on-surface-variant' },
                  { type: 'Privacidade / LGPD', time: 'até 15 dias úteis', color: 'text-on-surface-variant' },
                  { type: 'Segurança (urgente)', time: 'até 24h', color: 'text-primary' },
                  { type: 'Denúncias de abuso', time: 'até 24h', color: 'text-primary' },
                ].map(({ type, time, color }) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">{type}</span>
                    <span className={`font-semibold ${color}`}>{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice */}
            <div className="rounded border border-white/8 bg-white/[0.02] px-4 py-4 text-xs leading-relaxed text-on-surface-variant">
              <span className="material-symbols-outlined mr-2 align-middle" style={{ fontSize: '14px' }}>info</span>
              Não prestamos suporte por telefone. Todos os atendimentos são por e-mail
              para garantir rastreabilidade e qualidade.
            </div>
          </aside>
        </div>

        {/* FAQ */}
        <section className="mt-20">
          <h2 className="mb-2 font-headline text-2xl font-bold text-white">Perguntas frequentes</h2>
          <p className="mb-8 text-sm text-on-surface-variant">Respostas para as dúvidas mais comuns.</p>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded border transition-all ${openFaq === i ? 'border-primary/20 bg-primary/[0.03]' : 'border-white/8 bg-white/[0.02]'}`}>
                <button
                  onClick={() => toggleFaq(i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-body text-sm font-medium text-white">{faq.q}</span>
                  <span className={`material-symbols-outlined shrink-0 transition-transform text-on-surface-variant ${openFaq === i ? 'rotate-180' : ''}`} style={{ fontSize: '18px' }}>
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-white/5 px-5 py-4">
                    <p className="font-body text-sm leading-relaxed text-on-surface-variant">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <PageFooter active="contato" />
    </div>
  );
}

function Field({ label, id, name, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-white placeholder-on-surface-variant/50 transition-colors focus:border-primary focus:outline-none"
      />
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
