import { Link } from 'react-router-dom';

export function CallToAction() {
  return (
    <section className="px-6 py-32 text-center md:py-40">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-12">
        <h2 className="max-w-3xl text-5xl font-black leading-none tracking-tighter md:text-7xl">A noite pode começar com uma <span className="text-primary">mensagem</span>.</h2>
        <div className="flex w-full max-w-md flex-col items-stretch justify-center gap-6 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
          <Link to="/signup" className="w-full rounded px-12 py-5 text-center text-xl font-bold text-on-primary shadow-[0_20px_40px_rgba(186,158,255,0.15)] transition-transform deviation-gradient hover:scale-105 sm:w-auto">
            Entrar no Desvio
          </Link>
        </div>
        <p className="max-w-md text-center text-xs uppercase tracking-widest text-on-surface-variant font-label">Signup 18+. Perfis limitados por região para manter a experiência exclusiva.</p>
      </div>
    </section>
  );
}
