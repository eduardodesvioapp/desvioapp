import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import logoDark from '@/assets/logo-dark.png';
import { Loading } from '@/components/ui';
import { toast } from 'sonner';

export function Signup() {
  const { signInWithGoogle, signUp, loading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    ageConfirmed: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateBaseFields = () => {
    if (!form.name.trim()) {
      toast.error('IDENTIFICAÇÃO NECESSÁRIA', {
        description: 'Informe como você quer aparecer no Desvio.'
      });
      return false;
    }

    if (!form.ageConfirmed) {
      toast.error('VERIFICAÇÃO DE IDADE', {
        description: 'Confirme que você tem 18 anos ou mais para continuar.'
      });
      return false;
    }

    return true;
  };

  const handleGoogleSignIn = async () => {
    if (!validateBaseFields()) return;

    localStorage.setItem('desvio_pending_signup', JSON.stringify({
      name: form.name.trim(),
      age_confirmed: true,
      provider: 'google',
      onboarding_step: 'profile_pending',
    }));

    const { error: googleError } = await signInWithGoogle(`${window.location.origin}/search`);

    if (googleError) {
      toast.error('ERRO GOOGLE AUTH', {
        description: googleError.message || 'Não foi possível continuar com Google agora.'
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateBaseFields()) return;

    if (form.password.length < 8) {
      toast.error('SENHA INSUFICIENTE', {
        description: 'Use uma senha com pelo menos 8 caracteres.'
      });
      return;
    }

    const { data, error: signUpError } = await signUp(form.email, form.password, { name: form.name.trim() });
    
    if (signUpError) {
      toast.error('ERRO AO CRIAR CONTA', {
        description: signUpError.message || 'Não foi possível criar sua conta agora.'
      });
      return;
    }

    if (data?.user) {
      const { getProfileProgress } = useAuthStore.getState();
      const progress = await getProfileProgress(data.user.id);
      
      if (progress >= 90) {
        navigate('/search');
      } else {
        navigate('/profile/edit');
      }
      return;
    }

    toast.success('CONTA CRIADA', {
      description: 'Confira seu email para confirmar o acesso ao Desvio.'
    });
  };

  return (
    <main className="min-h-[100dvh] bg-[#050505] text-white">
      {loading && <Loading fullScreen message="CRIANDO_ACESSO..." />}
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-6 sm:py-8 md:py-12">
        <div className="absolute inset-0 z-0">
          <img
            alt="Atmosfera de encontro"
            src="https://images.unsplash.com/photo-1514525253361-b5906b12822c?auto=format&fit=crop&q=80&w=2000"
            className="h-full w-full object-cover opacity-20 mix-blend-luminosity scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#050505]/90 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-md sm:max-w-xl">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl p-5 sm:p-8 md:p-12 shadow-2xl">
            <div className="mb-6 text-center sm:mb-8">
              <Link to="/" className="inline-block">
                <img src={logoDark} alt="Desvio" className="h-[45px] sm:h-[72px] md:h-[90px] p-[6px]" />
              </Link>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-white/40 ml-3 sm:ml-4">Nome usuário</span>
                <div className="relative">
                  <span className="absolute left-5 sm:left-8 top-1/2 -translate-y-1/2 text-sm font-black text-primary">@</span>
                  <input
                    className="w-full min-h-[52px] rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-5 py-4 sm:pl-14 sm:pr-8 sm:py-5 text-sm text-white outline-none transition-all"
                    type="text"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 sm:gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-4 sm:p-5 text-[10px] md:text-xs text-white/40 cursor-pointer hover:bg-white/[0.03] transition-all">
                <input
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/10 accent-primary"
                  type="checkbox"
                  checked={form.ageConfirmed}
                  onChange={() => updateField('ageConfirmed', !form.ageConfirmed)}
                />
                <span className="leading-relaxed">Confirmo que sou adulto (18+) e aceito criar um perfil discreto sujeito aos termos de segurança do Desvio.</span>
              </label>

              <button
                className="flex w-full min-h-[52px] items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center text-[10px] sm:px-8 sm:py-5 sm:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <span className="text-lg font-black text-primary">G</span>
                Continuar com Google
              </button>

              <div className="my-5 sm:my-6 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.24em] sm:tracking-[0.3em] text-white/10">
                <span className="h-px flex-1 bg-white/5"></span>
                ou email
                <span className="h-px flex-1 bg-white/5"></span>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-white/40 ml-3 sm:ml-4">Email</span>
                  <input
                    className="w-full min-h-[52px] rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 sm:px-8 sm:py-5 text-sm text-white outline-none transition-all"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="voce@email.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-white/40 ml-3 sm:ml-4">Senha</span>
                  <div className="relative">
                    <input
                      className="w-full min-h-[52px] rounded-xl border border-white/10 bg-white/[0.02] pl-5 pr-14 py-4 sm:pl-8 sm:py-5 text-sm text-white outline-none transition-all"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) => updateField('password', event.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
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
              </div>


              <button
                className="w-full min-h-[56px] rounded-xl py-5 sm:py-6 text-center text-xs font-black uppercase tracking-[0.22em] sm:tracking-[0.3em] text-black bg-primary shadow-[0_20px_60px_rgba(186,158,255,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'VERIFICANDO...' : 'CRIAR DESVIO'}
              </button>
            </form>

            <p className="mt-7 sm:mt-10 text-center text-[10px] font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] leading-relaxed text-white/30">
              Já faz parte? <Link to="/signin" className="inline-block text-primary hover:text-white transition-colors sm:ml-2">Retomar Acesso</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
