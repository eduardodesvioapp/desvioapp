export function Showcase() {
  return (
    <section className="bg-surface-container-low/50 py-28 md:py-32">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 md:flex-row md:gap-20">
        <div className="flex-1 space-y-8 text-center md:text-left">
          <h2 className="mx-auto max-w-xl text-4xl font-black leading-tight tracking-tight md:mx-0 md:text-5xl">Entre, escolha o clima e deixe o <span className="text-secondary italic">Desvio</span> te levar.</h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-on-surface-variant md:mx-0">
            O Desvio foi pensado para adultos que querem conversar sem jogos, marcar encontros com mais intenção e manter a vida privada longe de curiosos.
          </p>
          <ul className="mx-auto max-w-md space-y-4 text-left md:mx-0">
            <li className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined shrink-0 text-primary">check_circle</span>
              <span>Perfis 18+ com verificação e preferências claras</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined shrink-0 text-primary">check_circle</span>
              <span>Modo discreto para navegar sem se expor</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined shrink-0 text-primary">check_circle</span>
              <span>Fotos privadas liberadas só quando você quiser</span>
            </li>
          </ul>
        </div>
        <div className="relative w-full max-w-lg flex-1">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded shadow-2xl">
            <img alt="Casal adulto em encontro discreto usando app de relacionamento" src="/adult-dating-showcase.png" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-10 -left-10 hidden max-w-xs rounded border border-outline-variant/20 p-8 text-left glass-panel lg:block">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded overflow-hidden bg-primary-container">
                <img alt="Perfil verificado" src="/avatar.jpg" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold">Rafael, 34</div>
                <div className="text-xs text-on-surface-variant">Perfil 18+ verificado</div>
              </div>
            </div>
            <p className="text-sm italic text-on-surface-variant">"Hoje eu quero uma conversa direta, leve e sem julgamento."</p>
          </div>
        </div>
      </div>
    </section>
  );
}
