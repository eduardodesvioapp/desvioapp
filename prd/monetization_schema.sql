-- =========================================================
-- 🪙 SCHEMA DE MONETIZAÇÃO, CRÉDITOS E GAMIFICAÇÃO - DESVIO
-- Executar no Supabase SQL Editor para adicionar a camada econômica
-- =========================================================

-- ========================
-- 1. TIPOS ENUM
-- ========================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM (
            'daily_check_in', 
            'referral_reward', 
            'purchase', 
            'ai_chat', 
            'radar_boost', 
            'reveal_like', 
            'unlock_gallery'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
        CREATE TYPE referral_status AS ENUM (
            'pending', 
            'completed', 
            'failed'
        );
    END IF;
END$$;

-- ========================
-- 2. TABELAS DE ECONOMIA
-- ========================

-- Função utilitária para gerar código de indicação único ("DSV-XXXXXX")
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    v_code VARCHAR(10);
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := 'DSV-' || UPPER(substring(md5(random()::text) from 1 for 6));
        -- Certificar que não há colisão no banco de dados
        SELECT EXISTS(SELECT 1 FROM public.user_balances WHERE referral_code = v_code) INTO v_exists;
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Tabela de saldos dos usuários
CREATE TABLE IF NOT EXISTS public.user_balances (
    user_id                 UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    credits                 INT NOT NULL DEFAULT 10 CHECK (credits >= 0), -- 10 créditos grátis de onboarding
    referral_code           VARCHAR(10) UNIQUE NOT NULL DEFAULT public.generate_unique_referral_code(),
    daily_streak            INT NOT NULL DEFAULT 0,
    last_check_in           TIMESTAMPTZ,
    subscription_tier       VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'premium' (Protocolo Bypass)
    subscription_expires_at TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de histórico/auditoria de transações de créditos
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount     INT NOT NULL, -- Positivo para créditos ganhos, Negativo para consumidos
    type       transaction_type NOT NULL,
    metadata   JSONB DEFAULT '{}'::jsonb, -- Ex: {"referee_id": "uuid"} ou {"message_id": "uuid"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de controle de indicações
CREATE TABLE IF NOT EXISTS public.referrals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Quem indicou (dono do código)
    referee_id  UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Convidado cadastrado
    status      referral_status NOT NULL DEFAULT 'pending',
    rewarded    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 3. ÍNDICES DE PERFORMANCE
-- ========================
CREATE INDEX IF NOT EXISTS idx_user_balances_ref_code ON public.user_balances(referral_code);
CREATE INDEX IF NOT EXISTS idx_credit_trans_user_id   ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id  ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id   ON public.referrals(referee_id, status);

-- ========================
-- 4. ROW LEVEL SECURITY (RLS)
-- ========================
ALTER TABLE public.user_balances      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals          ENABLE ROW LEVEL SECURITY;

-- Políticas para user_balances
DROP POLICY IF EXISTS "balances_select_own" ON public.user_balances;
CREATE POLICY "balances_select_own" 
    ON public.user_balances FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "balances_select_admin" ON public.user_balances;
CREATE POLICY "balances_select_admin" 
    ON public.user_balances FOR SELECT 
    USING (public.is_admin(auth.uid()));

-- Políticas para credit_transactions
DROP POLICY IF EXISTS "transactions_select_own" ON public.credit_transactions;
CREATE POLICY "transactions_select_own" 
    ON public.credit_transactions FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_select_admin" ON public.credit_transactions;
CREATE POLICY "transactions_select_admin" 
    ON public.credit_transactions FOR SELECT 
    USING (public.is_admin(auth.uid()));

-- Políticas para referrals
DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own" 
    ON public.referrals FOR SELECT 
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

DROP POLICY IF EXISTS "referrals_select_admin" ON public.referrals;
CREATE POLICY "referrals_select_admin" 
    ON public.referrals FOR SELECT 
    USING (public.is_admin(auth.uid()));

-- ========================
-- 5. GRANTS DE PERMISSÕES
-- ========================
GRANT ALL ON public.user_balances      TO authenticated;
GRANT ALL ON public.credit_transactions TO authenticated;
GRANT ALL ON public.referrals          TO authenticated;

-- =========================================================
-- 6. LOGICA TRANSACIONAL E PROCEDIMENTOS SEGUROS
-- =========================================================

-- Execução segura de transação de créditos (protegida contra Race Conditions)
CREATE OR REPLACE FUNCTION public.execute_credit_transaction(
    p_user_id UUID,
    p_amount INT,
    p_type transaction_type,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS INT AS $$
DECLARE
    v_current_balance INT;
BEGIN
    -- Garantir que a linha de saldo existe e travá-la para atualização segura (SELECT FOR UPDATE)
    INSERT INTO public.user_balances (user_id, credits, referral_code)
    VALUES (p_user_id, 10, public.generate_unique_referral_code())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING credits INTO v_current_balance;

    -- Travar a linha de saldo para prevenir condições de corrida
    SELECT credits INTO v_current_balance
    FROM public.user_balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Validar se há créditos suficientes para débitos (valores negativos)
    IF p_amount < 0 AND (v_current_balance + p_amount) < 0 THEN
        RAISE EXCEPTION 'Saldo de créditos insuficiente. Saldo atual: %, Requerido: %', v_current_balance, ABS(p_amount);
    END IF;

    -- Atualizar o saldo de fato
    UPDATE public.user_balances
    SET credits = credits + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Gravar auditoria da transação
    INSERT INTO public.credit_transactions (user_id, amount, type, metadata)
    VALUES (p_user_id, p_amount, p_type, p_metadata);

    RETURN (v_current_balance + p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 7. RECOMPENSA DIÁRIA PROGRESSIVA (DAILY STREAK CHECK-IN)
-- =========================================================

CREATE OR REPLACE FUNCTION public.claim_daily_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_balance RECORD;
    v_streak INT := 0;
    v_credits INT := 5;
    v_new_balance INT;
    v_time_diff INTERVAL;
    v_milestone BOOLEAN := FALSE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Buscar saldo
    SELECT * INTO v_balance FROM public.user_balances WHERE user_id = p_user_id;

    -- Caso não tenha registro de saldo ainda, inicializa
    IF v_balance.user_id IS NULL THEN
        INSERT INTO public.user_balances (user_id, credits, daily_streak, last_check_in)
        VALUES (p_user_id, 10, 0, NULL)
        RETURNING * INTO v_balance;
    END IF;

    -- Validar se já coletou hoje (mínimo de 20h para respeitar flutuação natural de fuso/uso)
    IF v_balance.last_check_in IS NOT NULL AND (v_now - v_balance.last_check_in) < INTERVAL '20 hours' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Você já resgatou sua recompensa diária hoje. Retorne amanhã!'
        );
    END IF;

    -- Calcular intervalo de tempo desde o último check-in
    IF v_balance.last_check_in IS NULL THEN
        v_streak := 1;
        v_credits := 5;
    ELSE
        v_time_diff := v_now - v_balance.last_check_in;
        
        -- Se passou de 40 horas, quebrou a sequência (deve recomeçar do Dia 1)
        IF v_time_diff > INTERVAL '40 hours' THEN
            v_streak := 1;
            v_credits := 5;
        ELSE
            -- Mantém a sequência consecutiva
            v_streak := v_balance.daily_streak + 1;
            
            -- Lógica progressiva: ⚡ Dia 1=5, Dia 2=6, Dia 3=7, Dia 4=8, Dia 5=9, Dia 6=10, Dia 7=25
            IF v_streak = 2 THEN v_credits := 6;
            ELSIF v_streak = 3 THEN v_credits := 7;
            ELSIF v_streak = 4 THEN v_credits := 8;
            ELSIF v_streak = 5 THEN v_credits := 9;
            ELSIF v_streak = 6 THEN v_credits := 10;
            ELSIF v_streak >= 7 THEN
                v_credits := 25;
                v_milestone := TRUE;
                v_streak := 7; -- Trava em 7 para o fechamento
            END IF;
        END IF;
    END IF;

    -- Bônus de Assinatura Premium (+5 créditos por dia por possuir assinatura ativa)
    IF v_balance.subscription_tier != 'free' AND (v_balance.subscription_expires_at IS NULL OR v_balance.subscription_expires_at > v_now) THEN
        v_credits := v_credits + 5;
    END IF;

    -- Salvar a streak. Se bater o Milestone (Dia 7), reseta para o ciclo reiniciar no dia seguinte
    DECLARE
        v_save_streak INT := v_streak;
    BEGIN
        IF v_milestone THEN
            v_save_streak := 0;
        END IF;

        -- Processar depósito na carteira
        SELECT public.execute_credit_transaction(
            p_user_id,
            v_credits,
            'daily_check_in',
            jsonb_build_object('streak', v_streak, 'earned', v_credits, 'milestone', v_milestone)
        ) INTO v_new_balance;

        -- Atualizar estatísticas de check-in
        UPDATE public.user_balances
        SET daily_streak = v_save_streak,
            last_check_in = v_now,
            updated_at = v_now
        WHERE user_id = p_user_id;
    END;

    -- Se for o Milestone do Dia 7, gera notificação no app e concede 1 cupom simbólico de Radar Boost
    IF v_milestone THEN
        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (
            p_user_id,
            'system_reward',
            '⚡ Recompensa Lendária!',
            'Parabéns pela sequência de 7 dias! Você ganhou +25 créditos e 1 Radar Boost grátis.',
            '/wallet',
            jsonb_build_object('boost_granted', true)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'credits_earned', v_credits,
        'new_balance', v_new_balance,
        'current_streak', v_streak,
        'milestone_achieved', v_milestone,
        'message', CASE 
            WHEN v_milestone THEN 'Estupendo! Sequência de 7 dias completa! +25 créditos e Radar Boost recebidos ⚡'
            ELSE 'Check-in diário realizado com sucesso! Dia ' || v_streak || '. +' || v_credits || ' créditos ⚡'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 8. SISTEMA DE INDICAÇÃO & CONVITES (ANTI-FRAUDE)
-- =========================================================

-- Permite ao convidado resgatar o código de indicação logo após o cadastro
CREATE OR REPLACE FUNCTION public.redeem_referral_code(
    p_referee_id UUID,
    p_referral_code VARCHAR(10)
) RETURNS JSONB AS $$
DECLARE
    v_referrer_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Validar se o código existe e buscar quem indicou
    SELECT user_id INTO v_referrer_id FROM public.user_balances WHERE referral_code = p_referral_code;
    
    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Código de indicação inválido ou inexistente.');
    END IF;

    -- Impedir auto-indicação
    IF v_referrer_id = p_referee_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Não é permitido usar seu próprio código de indicação.');
    END IF;

    -- Impedir múltiplas indicações por conta convidada (UNIQUE referee_id garante isso na tabela)
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referee_id = p_referee_id) INTO v_exists;
    IF v_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este usuário já utilizou um código de convite.');
    END IF;

    -- Cadastrar a indicação no status pendente
    INSERT INTO public.referrals (referrer_id, referee_id, status)
    VALUES (v_referrer_id, p_referee_id, 'pending');

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Código aceito! Complete seu cadastro (adicione foto real + complete o perfil + envie 1 mensagem) para liberar seus créditos!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função Trigger para monitorar e validar se o convidado cumpriu as tarefas anti-fraude
CREATE OR REPLACE FUNCTION public.check_and_complete_referral()
RETURNS TRIGGER AS $$
DECLARE
    v_ref RECORD;
    v_has_avatar BOOLEAN := FALSE;
    v_has_messages BOOLEAN := FALSE;
    v_referrer_balance INT;
    v_referee_balance INT;
    v_referee_name TEXT;
BEGIN
    -- Verificar se o usuário atual (modificado) é um convidado com indicação pendente
    SELECT * INTO v_ref 
    FROM public.referrals 
    WHERE referee_id = NEW.id AND status = 'pending' AND rewarded = FALSE;

    -- Se não houver indicação pendente para o usuário, não faz nada
    IF v_ref.id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Tarefa 1: Validar se possui foto de perfil configurada
    IF NEW.profile_image_url IS NOT NULL AND NEW.profile_image_url != '' THEN
        v_has_avatar := TRUE;
    END IF;

    -- Tarefa 2: Validar se já enviou alguma mensagem
    SELECT EXISTS(SELECT 1 FROM public.messages WHERE sender_id = NEW.id) INTO v_has_messages;

    -- Tarefa 3: O profile_score do novo usuário precisa ser >= 80% (conforme PRD)
    IF v_has_avatar AND v_has_messages AND NEW.profile_score >= 80 THEN
        -- 1. Marcar a indicação como concluída com sucesso
        UPDATE public.referrals
        SET status = 'completed',
            rewarded = TRUE,
            updated_at = NOW()
        WHERE id = v_ref.id;

        -- 2. Pagar o indicador (+50 créditos)
        SELECT public.execute_credit_transaction(
            v_ref.referrer_id,
            50,
            'referral_reward',
            jsonb_build_object('referee_id', NEW.id, 'referee_name', NEW.name)
        ) INTO v_referrer_balance;

        -- 3. Pagar o convidado (+25 créditos)
        SELECT public.execute_credit_transaction(
            NEW.id,
            25,
            'referral_reward',
            jsonb_build_object('referrer_id', v_ref.referrer_id)
        ) INTO v_referee_balance;

        -- 4. Notificar o indicador no app
        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (
            v_ref.referrer_id,
            'system_reward',
            '⚡ Créditos de Recomendação!',
            'Seu convidado ' || NEW.name || ' completou o cadastro. Você ganhou +50 créditos!',
            '/wallet',
            jsonb_build_object('credits_earned', 50)
        );

        -- 5. Notificar o convidado no app
        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (
            NEW.id,
            'system_reward',
            '⚡ Bônus de Indicação!',
            'Seu perfil foi verificado. Você ganhou +25 créditos de boas-vindas!',
            '/wallet',
            jsonb_build_object('credits_earned', 25)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado sempre que a completude de perfil (profile_score) ou foto mudam na tabela de users
DROP TRIGGER IF EXISTS tr_check_referral_completion ON public.users;
CREATE TRIGGER tr_check_referral_completion
    AFTER UPDATE OF profile_score, profile_image_url ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_and_complete_referral();

-- Trigger auxiliar que roda quando o usuário envia sua primeira mensagem
CREATE OR REPLACE FUNCTION public.check_referral_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_user public.users%ROWTYPE;
BEGIN
    SELECT * INTO v_user FROM public.users WHERE id = NEW.sender_id;
    -- Forçar a avaliação rodando a verificação de indicação com os dados do usuário
    PERFORM public.check_and_complete_referral_manual(v_user.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper manual para re-avaliar indicação via ID de usuário
CREATE OR REPLACE FUNCTION public.check_and_complete_referral_manual(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user RECORD;
    v_ref RECORD;
    v_has_avatar BOOLEAN := FALSE;
    v_has_messages BOOLEAN := FALSE;
    v_referrer_balance INT;
    v_referee_balance INT;
BEGIN
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    
    SELECT * INTO v_ref 
    FROM public.referrals 
    WHERE referee_id = p_user_id AND status = 'pending' AND rewarded = FALSE;

    IF v_ref.id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_user.profile_image_url IS NOT NULL AND v_user.profile_image_url != '' THEN
        v_has_avatar := TRUE;
    END IF;

    SELECT EXISTS(SELECT 1 FROM public.messages WHERE sender_id = p_user_id) INTO v_has_messages;

    IF v_has_avatar AND v_has_messages AND v_user.profile_score >= 80 THEN
        UPDATE public.referrals
        SET status = 'completed',
            rewarded = TRUE,
            updated_at = NOW()
        WHERE id = v_ref.id;

        SELECT public.execute_credit_transaction(v_ref.referrer_id, 50, 'referral_reward', jsonb_build_object('referee_id', p_user_id, 'referee_name', v_user.name)) INTO v_referrer_balance;
        SELECT public.execute_credit_transaction(p_user_id, 25, 'referral_reward', jsonb_build_object('referrer_id', v_ref.referrer_id)) INTO v_referee_balance;

        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (v_ref.referrer_id, 'system_reward', '⚡ Créditos de Recomendação!', 'Seu convidado ' || v_user.name || ' completou o cadastro. Você ganhou +50 créditos!', '/wallet', jsonb_build_object('credits_earned', 50));

        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (p_user_id, 'system_reward', '⚡ Bônus de Indicação!', 'Seu perfil foi verificado. Você ganhou +25 créditos de boas-vindas!', '/wallet', jsonb_build_object('credits_earned', 25));
        
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado no envio de qualquer mensagem para conferir se cumpre a tarefa 2
DROP TRIGGER IF EXISTS tr_check_referral_on_message ON public.messages;
CREATE TRIGGER tr_check_referral_on_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.check_referral_on_message();

-- Trigger automático para iniciar a carteira com 10 créditos grátis no insert do user
CREATE OR REPLACE FUNCTION public.initialize_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Ignora usuários IA (não possuem conta em auth.users e não precisam de carteira)
    IF NEW.is_human = FALSE THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.user_balances (user_id, credits, referral_code)
    VALUES (NEW.id, 10, public.generate_unique_referral_code())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_initialize_user_wallet ON public.users;
CREATE TRIGGER tr_initialize_user_wallet
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_user_wallet();

-- =========================================================
-- 9. ACOMPANHAMENTO DE CONSUMO DE TOKENS (GEMINI API)
-- =========================================================
ALTER TABLE public.ai_chat_queue ADD COLUMN IF NOT EXISTS prompt_tokens INT DEFAULT 0;
ALTER TABLE public.ai_chat_queue ADD COLUMN IF NOT EXISTS completion_tokens INT DEFAULT 0;
ALTER TABLE public.ai_chat_queue ADD COLUMN IF NOT EXISTS total_tokens INT DEFAULT 0;
