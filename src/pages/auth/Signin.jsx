import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Logo } from '@/components/ui/Logo';
import { Loading } from '@/components/ui';
import { toast } from 'sonner';

export function Signin() {
  const { resetPassword, signIn, signInWithGoogle, loading, user, session } = useAuthStore();
  const navigate = useNavigate();

  // Redireciona se já estiver logado
  useEffect(() => {
    if (session?.user && !loading) {
      navigate('/search');
    }
  }, [session, loading, navigate]);
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsRedirecting(true);
    const { error: googleError } = await signInWithGoogle(`${window.location.origin}/search`);

    if (googleError) {
      setIsRedirecting(false);
      toast.error('ERRO GOOGLE AUTH', {
        description: googleError.message || 'Não foi possível entrar com Google agora.'
      });
    }
  };

  const handleResetPassword = async () => {
    if (!form.email.trim()) {
      toast.error('EMAIL NECESSÁRIO', {
        description: 'Informe seu email para recuperar a senha.'
      });
      return;
    }

    const { error: resetError } = await resetPassword(form.email, `${window.location.origin}/reset-password`);

    if (resetError) {
      toast.error('ERRO NA RECUPERAÇÃO', {
        description: resetError.message || 'Não foi possível enviar a recuperação de senha.'
      });
      return;
    }

    toast.success('LINK ENVIADO', {
      description: 'Enviamos um link de recuperação para seu email.'
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim()) {
      toast.error('EMAIL NECESSÁRIO', {
        description: 'Informe seu email para entrar.'
      });
      return;
    }

    if (!form.password) {
      toast.error('SENHA NECESSÁRIA', {
        description: 'Informe sua senha para entrar.'
      });
      return;
    }

    setIsRedirecting(true);
    const { data: signInData, error: signInError } = await signIn(form.email, form.password);

    if (signInError) {
      setIsRedirecting(false);
      toast.error('FALHA NA AUTENTICAÇÃO', {
        description: signInError.message || 'Email ou senha inválidos.'
      });
      return;
    }

    if (signInData?.user) {
      const { getProfileProgress } = useAuthStore.getState();
      const progress = await getProfileProgress(signInData.user.id);
      
      if (progress >= 90) {
        navigate('/search');
      } else {
        navigate('/profile/edit');
      }
    }
  };

  const isProcessing = loading || isRedirecting;

  return (
    <main className="min-h-[100dvh] bg-[#050505] text-white">
      {isProcessing && <Loading fullScreen message="AUTENTICANDO..." />}
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-6 sm:py-8 md:py-12">
        <div className="absolute inset-0 z-0">
          <img
            alt="Atmosfera de encontro"
            src="https://images.unsplash.com/photo-1514525253361-b5906b12822c?auto=format&fit=crop&q=80&w=2000"
            className="h-full w-full object-cover opacity-20 mix-blend-luminosity scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#050505]/90 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-md sm:max-w-xl animate-in fade-in zoom-in duration-300">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl p-5 sm:p-8 md:p-12 shadow-2xl">
            <div className="mb-7 text-center sm:mb-10">
              <Link to="/" className="inline-block mb-4 sm:mb-6">
                <Logo size="lg" />
              </Link>
              <h1 className="text-lg sm:text-xl md:text-2xl font-headline font-black italic tracking-tighter mb-3 leading-tight">Bem-vindo de volta.</h1>
              <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide leading-relaxed">Continue sua jornada de conexões reais.</p>
            </div>

            <button
              className="flex w-full min-h-[52px] items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center text-[10px] sm:px-8 sm:py-5 sm:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isProcessing}
            >
              <span className="text-lg font-black text-primary">G</span>
              Entrar com Google
            </button>

            <div className="my-5 sm:my-6 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
              <span className="h-px flex-1 bg-white/5"></span>
              ou
              <span className="h-px flex-1 bg-white/5"></span>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-white/40 ml-3 sm:ml-4">Email</span>
                <input
                  className="w-full min-h-[52px] rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 sm:px-8 sm:py-5 text-sm text-white outline-none transition-all placeholder:text-white/10"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="voce@email.com"
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-white/40 ml-3 sm:ml-4">Senha</span>
                <div className="relative">
                  <input
                    className="w-full min-h-[52px] rounded-xl border border-white/10 bg-white/[0.02] pl-5 pr-14 py-4 sm:pl-8 sm:py-5 text-sm text-white outline-none transition-all placeholder:text-white/10"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-white/35 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 px-1 text-[10px] font-black uppercase tracking-widest sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <label className="flex items-center gap-2 text-white/30 cursor-pointer hover:text-white/60">
                  <input
                    className="h-4 w-4 shrink-0 rounded bg-white/5 border-white/10 accent-primary"
                    type="checkbox"
                    checked={form.remember}
                    onChange={(event) => updateField('remember', event.target.checked)}
                  />
                  Manter conectado
                </label>
                <button className="text-left text-primary hover:text-white transition-colors sm:text-right" type="button" onClick={handleResetPassword}>
                  Esqueci minha senha
                </button>
              </div>


              <button
                className="w-full min-h-[56px] rounded-xl py-5 sm:py-6 text-center text-xs font-black uppercase tracking-[0.22em] sm:tracking-[0.3em] text-black bg-primary shadow-[0_20px_60px_rgba(186,158,255,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                type="submit"
                disabled={isProcessing}
              >
                {isProcessing ? 'VERIFICANDO...' : 'ENTRAR'}
              </button>
            </form>

            <p className="mt-7 sm:mt-10 text-center text-[10px] font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] leading-relaxed text-white/30">
              Novo por aqui? <Link to="/signup" className="inline-block text-primary hover:text-white transition-colors sm:ml-2">Crie sua Conta AQUI</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
