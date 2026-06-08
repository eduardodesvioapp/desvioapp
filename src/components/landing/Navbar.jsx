import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-background to-transparent">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Logo className="pl-[1px]" />
        <div className="hidden md:flex items-center gap-8 font-headline font-bold tracking-tighter">
          <a className="text-primary hover:text-on-surface transition-colors" href="#">Descubra</a>
          <a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Experiência</a>
          <a className="text-on-surface-variant hover:text-on-surface transition-colors" href="#">Discrição</a>
        </div>
        <div className="flex items-center justify-end gap-3 md:gap-4">
          <Link to="/signin" className="px-6 py-2 rounded font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-all scale-95 duration-200 ease-in-out">Entrar</Link>
        </div>
      </nav>
    </header>
  );
}
