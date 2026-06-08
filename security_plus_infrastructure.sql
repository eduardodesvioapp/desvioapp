-- =========================================================
-- 🛡️ SECURITY PLUS - INFRAESTRUTURA
-- Adiciona tabelas e colunas para Moderação, Sessões, Verificação e Segurança.
-- =========================================================

-- 1. EXTENSÕES (Garantir que estão ativas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AJUSTES NA TABELA USERS
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' 
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS safety_check_expires TIMESTAMPTZ;

-- 3. HISTÓRICO DE ACESSOS (SESSÕES)
CREATE TABLE IF NOT EXISTS public.login_activity (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ip_address  TEXT,
    user_agent  TEXT,
    location    JSONB DEFAULT '{}', -- Para dados de GeoIP
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_activity" 
    ON public.login_activity FOR SELECT 
    USING (auth.uid() = user_id);

-- 4. CONTATOS DE EMERGÊNCIA (BOTÃO DE PÂNICO)
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    notify_by   TEXT DEFAULT 'sms' CHECK (notify_by IN ('sms', 'email')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_contacts" 
    ON public.emergency_contacts FOR ALL 
    USING (auth.uid() = user_id);

-- 5. SOLICITAÇÕES DE VERIFICAÇÃO (IA FACE MATCH)
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    selfie_url      TEXT NOT NULL,
    comparison_score FLOAT, -- Resultado da comparação da IA
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_verification" 
    ON public.verification_requests FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_verification" 
    ON public.verification_requests FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 6. RPCs ADMINISTRATIVOS (Restritos a is_admin)

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.users WHERE id = u_id AND is_admin = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para listar reports ativos (para o painel de moderação)
CREATE OR REPLACE FUNCTION public.admin_get_active_reports()
RETURNS TABLE (
    reported_id UUID,
    reported_name TEXT,
    report_count BIGINT,
    reasons TEXT[]
) AS $$
BEGIN
    -- Verifica se quem chama é admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores.';
    END IF;

    RETURN QUERY
    SELECT 
        r.reported_id,
        u.name as reported_name,
        COUNT(r.id) as report_count,
        ARRAY_AGG(DISTINCT r.reason) as reasons
    FROM public.reports r
    JOIN public.users u ON r.reported_id = u.id
    WHERE r.status = 'pending'
    GROUP BY r.reported_id, u.name
    ORDER BY report_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON public.login_activity(user_id);
-- 8. TABELA DE LOGS DE ALERTA (Simulação de envio SMS/Email)
CREATE TABLE IF NOT EXISTS public.safety_alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id  UUID REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
    message     TEXT,
    location_url TEXT,
    sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FUNÇÃO PARA DISPARAR ALERTAS (Executada via Cron ou Manualmente)
CREATE OR REPLACE FUNCTION public.trigger_safety_alerts()
RETURNS TABLE (alerts_sent INT) AS $$
DECLARE
    u RECORD;
    c RECORD;
    msg TEXT;
    loc_url TEXT;
    counter INT := 0;
BEGIN
    -- Loop por usuários com cronômetro expirado
    FOR u IN 
        SELECT id, name, latitude, longitude 
        FROM public.users 
        WHERE safety_check_expires < NOW()
    LOOP
        -- Loop pelos contatos desse usuário
        FOR c IN 
            SELECT id, phone, name 
            FROM public.emergency_contacts 
            WHERE user_id = u.id
        LOOP
            loc_url := 'https://www.google.com/maps?q=' || u.latitude || ',' || u.longitude;
            msg := 'DESVIO SEGURANÇA: ' || u.name || ' iniciou um encontro seguro e não confirmou sua segurança. Última localização: ' || loc_url;
            
            -- Registra o alerta no log
            INSERT INTO public.safety_alerts (user_id, contact_id, message, location_url)
            VALUES (u.id, c.id, msg, loc_url);

            -- Cria uma notificação interna para o usuário saber que o alerta disparou
            INSERT INTO public.notifications (user_id, type, title, content, metadata)
            VALUES (u.id, 'safety_alert', 'ALERTA DE SEGURANÇA ENVIADO', 'Seus contatos foram notificados devido à expiração do tempo.', jsonb_build_object('contact_name', c.name));

            counter := counter + 1;
        END LOOP;

        -- Limpa o cronômetro para não disparar repetidamente
        UPDATE public.users SET safety_check_expires = NULL WHERE id = u.id;
    END LOOP;

    RETURN QUERY SELECT counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
