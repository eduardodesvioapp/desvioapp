import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/ui/Logo';
import { Loading } from '@/components/ui';
import { toast } from 'sonner';

function getInitialState() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) return { status: 'loading', code };

  const hash = window.location.hash;
  if (hash) {
    const h = new URLSearchParams(hash.substring(1));
    if (h.get('access_token') && h.get('type') === 'recovery') {
      return { status: 'ready' };
    }
  }

  return { status: 'error' };
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [state, setState] = useState(getInitialState);

  useEffect(() => {
    if (state.status !== 'loading' || !state.code) return;

    supabase.auth.exchangeCodeForSession(state.code).then(({ error }) => {
      setState(error ? { status: 'error' } : { status: 'ready' });
    });
  }, [state.status, state.code]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('SENHA CURTA', { description: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('SENHAS DIFERENTES', { description: 'As senhas não coincidem.' });
      return;
    }

    setProcessing(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setProcessing(false);

    if (updateError) {
      toast.error('ERRO', { description: updateError.message || 'Não foi possível redefinir a senha.' });
      return;
    }

    toast.success('SENHA REDEFINIDA', { description: 'Faça login com sua nova senha.' });
    navigate('/signin');
  };

  if (state.status === 'error') {
    return (
      <main className="min-h-[100dvh] bg-[#050505] text-white flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <Logo size="lg" />
          <p className="text-white/50 text-sm">Link inválido ou expirado.</p>
          <Link
            to="/signin"
            className="inline-block min-h-[48px] rounded-xl bg-primary px-8 text-xs font-black uppercase tracking-[0.2em] text-black leading-[48px] hover:scale-[1.02] transition-all"
          >
            Voltar ao Login
          </Link>
        </div>
      </main>
    );
  }

  if (state.status === 'loading') return <Loading fullScreen message="Validando link..." />;

  return (
    <main className="min-h-[100dvh] bg-[#050505] text-white">
      {processing && <Loading fullScreen message="SALVANDO..." />}
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-6">
        <div className="absolute inset-0 z-0">
          <img
            alt="Atmosfera"
            src="https://images.unsplash.com/photo-1514525253361-b5906b12822c?auto=format&fit=crop&q=80&w=2000"
            className="h-full w-full object-cover opacity-20 mix-blend-luminosity scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#050505]/90 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-300">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl p-5 sm:p-8 md:p-12 shadow-2xl">
            <div className="mb-7 text-center sm:mb-10">
              <Link to="/" className="inline-block mb-4 sm:mb-6">
                <Logo size="lg" />
              </Link>
              <h1 className="text-lg sm:text-xl md:text-2xl font-headline font-black italic tracking-tighter mb-3 leading-tight">
                Nova Senha
              </h1>
              <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide leading-relaxed">
                Informe sua nova senha abaixo.
              </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-white/40 ml-3 sm:ml-4">
                  Nova Senha
                </span>
                <div className="relative">
                  <input
                    className="w-full min-h-[52px] rounded-xl border border-white/10 bg-white/[0.02] pl-5 pr-14 py-4 sm:pl-8 sm:py-5 text-sm text-white outline-none transition-all placeholder:text-white/10"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-white/35 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-white/40 ml-3 sm:ml-4">
                  Confirmar Senha
                </span>
                <input
                  className="w-full min-h-[52px] rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 sm:px-8 sm:py-5 text-sm text-white outline-none transition-all placeholder:text-white/10"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                />
              </div>

              <button
                className="w-full min-h-[56px] rounded-xl py-5 sm:py-6 text-center text-xs font-black uppercase tracking-[0.22em] sm:tracking-[0.3em] text-black bg-primary shadow-[0_20px_60px_rgba(186,158,255,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                type="submit"
                disabled={processing}
              >
                {processing ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
              </button>
            </form>

            <p className="mt-7 sm:mt-10 text-center text-[10px] font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] leading-relaxed text-white/30">
              <Link to="/signin" className="text-primary hover:text-white transition-colors">
                Voltar ao Login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
