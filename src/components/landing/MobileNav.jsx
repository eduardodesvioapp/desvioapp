export function MobileNav() {
  return (
    <div className="fixed bottom-8 left-1/2 z-50 flex w-[90%] max-w-lg -translate-x-1/2 items-center justify-around rounded bg-surface-container-lowest/80 px-8 py-3 shadow-[0_20px_40px_rgba(186,158,255,0.08)] backdrop-blur-lg md:hidden">
      <button className="flex min-h-10 min-w-10 scale-90 flex-col items-center justify-center text-primary transition-all duration-300 after:mt-1 after:h-1 after:w-1 after:rounded after:bg-primary after:content-[''] hover:text-on-surface active:scale-95" aria-label="Explorar">
        <span className="material-symbols-outlined">explore</span>
      </button>
      <button className="flex min-h-10 min-w-10 scale-90 flex-col items-center justify-center text-on-surface-variant transition-all duration-300 hover:text-on-surface active:scale-95" aria-label="Sinais">
        <span className="material-symbols-outlined">sensors</span>
      </button>
      <button className="flex min-h-10 min-w-10 scale-90 flex-col items-center justify-center text-on-surface-variant transition-all duration-300 hover:text-on-surface active:scale-95" aria-label="Conversas">
        <span className="material-symbols-outlined">chat</span>
      </button>
      <button className="flex min-h-10 min-w-10 scale-90 flex-col items-center justify-center text-on-surface-variant transition-all duration-300 hover:text-on-surface active:scale-95" aria-label="Perfil">
        <span className="material-symbols-outlined">person</span>
      </button>
    </div>
  );
}
