import { Link } from 'react-router-dom';
import logoDark from '../../assets/logo-dark.png';

export function Footer() {
  return (
    <footer className="mt-20 flex w-full flex-col items-center gap-6 border-t border-surface-container-highest/30 bg-background px-6 py-12 text-center">
      <img src={logoDark} alt="Desvio" className="h-4 md:h-5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all" />
      <div className="flex flex-wrap justify-center gap-8 font-label text-xs text-on-surface-variant">
        <Link className="hover:text-primary transition-colors" to="/privacy">Privacidade</Link>
        <Link className="hover:text-primary transition-colors" to="/terms">Termos</Link>
        <Link className="hover:text-primary transition-colors" to="/security">Segurança</Link>
        <Link className="hover:text-primary transition-colors" to="/contact">Contato</Link>
      </div>
      <div className="mt-4 text-xs text-on-surface-variant font-label">
        © 2026 Desvio. Encontros adultos para maiores de 18 anos.
      </div>
    </footer>
  );
}
