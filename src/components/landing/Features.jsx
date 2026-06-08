export function Features() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-28 md:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <h2 className="text-4xl font-bold tracking-tighter">Feito para quem quer sair da rotina</h2>
        <p className="max-w-lg text-on-surface-variant">Matches adultos, conversa sem rodeios e ferramentas de privacidade para você flertar com liberdade.</p>
      </div>
      <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group relative flex min-h-[280px] flex-col justify-center overflow-hidden rounded bg-surface-container-low p-8 text-center md:col-span-2 md:h-[280px] md:p-10 md:text-left">
          <div className="relative z-10 mx-auto max-w-md md:mx-0">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary md:mx-0">
              <span className="material-symbols-outlined">gesture</span>
            </div>
            <h3 className="text-3xl font-bold mb-4">Matches com intenção</h3>
            <p className="text-on-surface-variant">Veja quem combina com seu momento: papo casual, conexão intensa ou algo mais reservado para acontecer fora do óbvio.</p>
          </div>
          <div className="absolute bottom-0 right-0 hidden h-full w-1/2 opacity-30 transition-opacity group-hover:opacity-50 md:block">
            <img alt="Pessoa adulta navegando por matches" src="/smart-swipe.jpg" className="w-full h-full object-cover rounded-tl-3xl grayscale" />
          </div>
        </div>
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded border border-outline-variant/10 bg-surface-container-high p-8 text-center md:h-[280px] md:items-start md:p-10 md:text-left">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <h3 className="text-2xl font-bold mb-4">Chat que cria clima</h3>
          <p className="text-on-surface-variant text-sm">Sugestões inteligentes ajudam a quebrar o gelo, manter a conversa viva e transformar curtidas em encontros reais.</p>
        </div>
        <div className="relative flex min-h-[280px] flex-col justify-center overflow-hidden rounded bg-surface-container-highest p-8 text-center md:h-[280px] md:p-10 md:text-left">
          <div className="absolute top-0 right-0 p-8">
            <div className="text-5xl font-black text-primary/20">98%</div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Compatibilidade quente</h3>
            <p className="text-on-surface-variant text-sm">Filtros por intenção, disponibilidade e estilo de encontro aproximam você de quem também quer agir.</p>
          </div>
        </div>
        <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded border border-primary/10 bg-surface-container-lowest p-8 md:col-span-2 md:h-[280px] md:p-10">
          <div className="absolute inset-0 deviation-gradient opacity-5"></div>
          <div className="relative z-10 mx-auto max-w-lg text-center">
            <div className="mb-4 text-4xl font-black tracking-tighter text-primary md:text-5xl">Discrição em primeiro lugar.</div>
            <p className="mx-auto max-w-sm text-on-surface-variant">Perfis 18+, controle de visibilidade, fotos privadas e conversa protegida para você se permitir com segurança.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
