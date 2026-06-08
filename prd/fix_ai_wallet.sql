-- 1. Alterar a FK de user_balances para referenciar public.users em vez de auth.users
-- Isso permite que perfis de IA (que existem apenas em public.users) possam ter carteiras ou não quebrar FKs.
ALTER TABLE public.user_balances
  DROP CONSTRAINT IF EXISTS user_balances_user_id_fkey;

ALTER TABLE public.user_balances
  ADD CONSTRAINT user_balances_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Atualizar a trigger de inicialização da carteira para ignorar IAs (opcional, mas recomendado)
CREATE OR REPLACE FUNCTION public.initialize_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Ignora a criação de carteira para usuários sintéticos (IA)
    IF NEW.is_human = FALSE THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.user_balances (user_id, credits, referral_code)
    VALUES (NEW.id, 10, public.generate_unique_referral_code())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
