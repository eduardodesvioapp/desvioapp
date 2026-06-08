import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pb-20 pt-28">
      {/* Background with focal point optimization */}
      <div className="absolute inset-0 z-0">
        <img 
          alt="Adulto em atmosfera noturna e reservada" 
          src="https://images.unsplash.com/photo-1514525253361-b5906b12822c?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
      </div>

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        {/* Status Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl animate-fade-in">
          <span className="w-2 h-2 rounded bg-primary animate-pulse shadow-[0_0_10px_rgba(186,158,255,1)]"></span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Conexões Verificadas 18+</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl md:text-7xl lg:text-8xl font-headline font-black italic leading-[0.9] tracking-tighter text-white animate-slide-up">
          Às vezes, um <span className="text-primary">Desvio</span> é o melhor caminho<span className="text-primary italic">.</span>
        </h1>

        <p className="mx-auto mt-10 max-w-xl text-center text-white/50 text-base md:text-xl leading-relaxed font-body font-light tracking-wide animate-fade-in [animation-delay:0.3s]">
          Conheça pessoas reais que sabem o que querem. Conversem com privacidade, criem tensão e decidam quando transformar curiosidade em encontro.
        </p>

        {/* Action Buttons - Optimized for Mobile Thumb Zone */}
        <div className="mt-12 flex w-full flex-col gap-4 sm:flex-row sm:justify-center animate-fade-in [animation-delay:0.5s]">
          <Link 
            to="/signup" 
            className="w-full sm:w-auto rounded bg-primary px-12 py-6 text-sm font-black uppercase tracking-[0.2em] text-black shadow-[0_20px_60px_rgba(186,158,255,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            Criar perfil grátis
          </Link>
          <a 
            href="#how-it-works" 
            className="w-full sm:w-auto rounded border border-white/10 bg-white/5 px-12 py-6 text-sm font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95"
          >
            Ver como funciona
          </a>
        </div>
      </div>
    </section>
  );
}
