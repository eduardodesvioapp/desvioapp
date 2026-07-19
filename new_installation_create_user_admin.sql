-- =========================================================
-- 🚀 DESVIO - INSTALAÇÃO COMPLETA + ADMIN
-- Arquivo único: schema do zero + provisionamento de admin
-- =========================================================
-- 📋 ORDEM DE EXECUÇÃO:
--   1. Rode este SQL no SQL Editor (cria todo o schema).
--   2. Crie o usuário admin no painel:
--        Authentication > Users > 'Add user'
--        - Email: admin@desvio.com
--        - Password: (senha forte)
--        - ☑️ Auto Confirm User
--      Copie o UUID gerado.
--   3. Edite a seção 13 (ADMIN) e cole o UUID.
--   4. Rode APENAS a seção 13 (ou o arquivo todo de novo).
-- =========================================================
=========================================================
-- 0. EXTENSÕES
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- =========================================================
-- 1. TIPOS ENUM
-- =========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE public.transaction_type AS ENUM (
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
        CREATE TYPE public.referral_status AS ENUM (
            'pending',
            'completed',
            'failed'
        );
    END IF;
END$$;

-- =========================================================
-- 2. LIMPEZA SEGURA (triggers, funções, tabelas)
-- Necessário para permitir reexecução idempotente.
-- =========================================================
DO $$
DECLARE r RECORD;
BEGIN
    -- Remove triggers do schema public
    FOR r IN (SELECT trigger_name, event_object_table
              FROM information_schema.triggers
              WHERE trigger_schema = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name)
             || ' ON ' || quote_ident(r.event_object_table);
    END LOOP;

    -- Remove funções do schema public (exceto extensões)
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) AS params
              FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
              WHERE n.nspname = 'public' AND d.objid IS NULL) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname)
             || '(' || r.params || ') CASCADE';
    END LOOP;

    -- Remove tabelas do schema public
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- =========================================================
-- 3. TABELAS PRINCIPAIS
-- =========================================================

-- 3.1 USERS (perfil principal, com suporte a humanos e IAs)
CREATE TABLE public.users (
    id                          UUID PRIMARY KEY,
    email                       TEXT,
    name                        TEXT,
    age                         INT,
    bio                         TEXT,
    gender                      TEXT,
    search_for                  TEXT[],
    latitude                    NUMERIC,
    longitude                   NUMERIC,
    city                        TEXT,
    travel_mode                 BOOLEAN DEFAULT FALSE,
    travel_lat                  NUMERIC,
    travel_lng                  NUMERIC,
    height                      INT,
    weight                      TEXT,
    hair_color                  TEXT,
    eyes_color                  TEXT,
    skin_color                  TEXT,
    lifestyle                   TEXT[],
    education                   TEXT,
    occupation                  TEXT,
    profile_image_url           TEXT,
    profile_score               INT DEFAULT 0,
    compatibility_embedding     VECTOR(384),
    is_admin                    BOOLEAN DEFAULT FALSE,
    verification_status         TEXT DEFAULT 'unverified'
        CHECK (verification_status IN ('unverified','pending','verified','rejected')),
    safety_check_expires        TIMESTAMPTZ,
    last_active                 TIMESTAMP DEFAULT NOW(),
    created_at                  TIMESTAMP DEFAULT NOW(),
    is_human                    BOOLEAN DEFAULT TRUE,
    ai_config                   JSONB DEFAULT '{
        "model": "gemini-1.5-flash",
        "personality": "Você é uma pessoa misteriosa e atraente que busca conexões profundas no app Desvio.",
        "temperature": 0.7
    }'::jsonb
);

-- 3.2 USER SETTINGS (preferências de privacidade e notificações)
CREATE TABLE public.user_settings (
    user_id          UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    push_messages    BOOLEAN DEFAULT TRUE,
    push_matches     BOOLEAN DEFAULT TRUE,
    do_not_disturb   BOOLEAN DEFAULT FALSE,
    dnd_start        TIME,
    dnd_end          TIME,
    profile_visible  BOOLEAN DEFAULT TRUE,
    show_distance    BOOLEAN DEFAULT TRUE,
    max_distance     INT DEFAULT 50,
    theme            TEXT DEFAULT 'dark',
    invisible_mode   BOOLEAN DEFAULT FALSE,
    is_premium       BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT NOW()
);

-- 3.3 USER MEDIA (fotos e mídias)
CREATE TABLE public.user_media (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    is_profile BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 INTERESTS
CREATE TABLE public.interests (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

INSERT INTO public.interests (name) VALUES
    ('Namoro'), ('Casual'), ('Amizade'),
    ('Relacionamento sério'), ('Conversas'), ('Outros')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE public.user_interests (
    user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
    interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, interest_id)
);

-- 3.5 LIKES
CREATE TABLE public.likes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    liked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status        TEXT DEFAULT 'pending',
    is_read       BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, liked_user_id)
);

-- 3.6 MATCHES
CREATE TABLE public.matches (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user2_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
    requester_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status         TEXT DEFAULT 'pending',
    is_read        BOOLEAN DEFAULT FALSE,
    typing_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at     TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_match_pair UNIQUE (user1_id, user2_id)
);

-- 3.7 MESSAGES
CREATE TABLE public.messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id    UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content     TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- 3.8 NOTIFICATIONS
CREATE TABLE public.notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT,
    link       TEXT,
    metadata   JSONB DEFAULT '{}'::jsonb,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 PROFILE VISITS
CREATE TABLE public.profile_visits (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
    visited_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_read       BOOLEAN DEFAULT FALSE,
    last_visit_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_visitor_per_profile UNIQUE (visitor_id, visited_id)
);

-- 3.10 GALLERY ACCESS REQUESTS
CREATE TABLE public.gallery_access_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    owner_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (requester_id, owner_id)
);

-- 3.11 REPORTS (denúncias de perfis)
CREATE TABLE public.reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason      TEXT NOT NULL CHECK (reason IN (
        'fake_profile','harassment','underage','spam',
        'non_consensual_content','scam','hate_speech','other'
    )),
    details     TEXT,
    status      TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','reviewed','resolved','dismissed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE (reporter_id, reported_id, reason)
);

-- 3.12 LOGIN ACTIVITY
CREATE TABLE public.login_activity (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    location   JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.13 EMERGENCY CONTACTS
CREATE TABLE public.emergency_contacts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    notify_by  TEXT DEFAULT 'sms' CHECK (notify_by IN ('sms','email')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.14 VERIFICATION REQUESTS
CREATE TABLE public.verification_requests (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    selfie_url       TEXT NOT NULL,
    comparison_score FLOAT,
    status           TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected')),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3.15 SAFETY ALERTS
CREATE TABLE public.safety_alerts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id   UUID REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
    message      TEXT,
    location_url TEXT,
    sent_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3.16 USER BALANCES (carteira de créditos)
-- Função utilitária declarada aqui (em vez da seção 5) porque é usada
-- como DEFAULT da coluna referral_code abaixo.
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    v_code   VARCHAR(10);
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := 'DSV-' || UPPER(substring(md5(random()::text) from 1 for 6));
        SELECT EXISTS(SELECT 1 FROM public.user_balances WHERE referral_code = v_code)
          INTO v_exists;
        IF NOT v_exists THEN RETURN v_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.user_balances (
    user_id                 UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    credits                 INT NOT NULL DEFAULT 10 CHECK (credits >= 0),
    referral_code           VARCHAR(10) UNIQUE NOT NULL DEFAULT public.generate_unique_referral_code(),
    daily_streak            INT NOT NULL DEFAULT 0,
    last_check_in           TIMESTAMPTZ,
    subscription_tier       VARCHAR(20) NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 3.17 CREDIT TRANSACTIONS
CREATE TABLE public.credit_transactions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount     INT NOT NULL,
    type       public.transaction_type NOT NULL,
    metadata   JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.18 REFERRALS
CREATE TABLE public.referrals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referee_id  UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status      public.referral_status NOT NULL DEFAULT 'pending',
    rewarded    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3.19 SECRETS (chaves de API)
CREATE TABLE public.secrets (
    key_name   TEXT PRIMARY KEY,
    key_value  TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.20 AI GENERATION LOGS
CREATE TABLE public.ai_generation_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    status_code  INT,
    response_text TEXT,
    target_url   TEXT,
    context      TEXT
);

-- 3.21 AI CHAT QUEUE (fila assíncrona de resposta da IA)
CREATE TABLE public.ai_chat_queue (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id        UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    match_id          UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    status            VARCHAR(20) DEFAULT 'pending',
    retry_count       INT DEFAULT 0,
    error_message     TEXT,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()),
    processed_at      TIMESTAMP WITH TIME ZONE,
    prompt_tokens     INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens      INT DEFAULT 0
);

-- =========================================================
-- 4. ÍNDICES
-- =========================================================
CREATE INDEX idx_users_location              ON public.users(latitude, longitude);
CREATE INDEX idx_users_id_last_active        ON public.users(id, last_active);
CREATE INDEX idx_users_is_human              ON public.users(is_human);
CREATE INDEX idx_users_compatibility_embedding
    ON public.users USING ivfflat (compatibility_embedding vector_cosine_ops)
    WITH (lists = 100);
CREATE INDEX idx_user_media_user_id          ON public.user_media(user_id);
CREATE INDEX idx_likes_liked_user_id_read    ON public.likes(liked_user_id, is_read);
CREATE INDEX idx_matches_user1_id_read       ON public.matches(user1_id, is_read);
CREATE INDEX idx_matches_user2_id_read       ON public.matches(user2_id, is_read);
CREATE INDEX idx_messages_match              ON public.messages(match_id);
CREATE INDEX idx_messages_receiver_created   ON public.messages(receiver_id, created_at);
CREATE INDEX idx_notifications_user_read     ON public.notifications(user_id, is_read);
CREATE INDEX idx_visits_visited_read         ON public.profile_visits(visited_id, is_read);
CREATE INDEX idx_reports_reported_id         ON public.reports(reported_id);
CREATE INDEX idx_reports_status              ON public.reports(status);
CREATE INDEX idx_reports_created_at          ON public.reports(created_at DESC);
CREATE INDEX idx_login_activity_user_id      ON public.login_activity(user_id);
CREATE INDEX idx_emergency_contacts_user     ON public.emergency_contacts(user_id);
CREATE INDEX idx_verif_req_user              ON public.verification_requests(user_id);
CREATE INDEX idx_user_balances_ref_code      ON public.user_balances(referral_code);
CREATE INDEX idx_credit_trans_user_id        ON public.credit_transactions(user_id);
CREATE INDEX idx_referrals_referrer_id       ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id        ON public.referrals(referee_id, status);
CREATE INDEX idx_ai_chat_queue_status        ON public.ai_chat_queue(status, created_at);

-- =========================================================
-- 5. FUNÇÕES
-- =========================================================

-- 5.1 Cálculo de distância (Haversine)
CREATE OR REPLACE FUNCTION public.calculate_distance(
    lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT
) RETURNS FLOAT AS $$
DECLARE
    dist FLOAT; rad_lat1 FLOAT; rad_lat2 FLOAT; theta FLOAT; rad_theta FLOAT;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    rad_lat1  := pi() * lat1 / 180;
    rad_lat2  := pi() * lat2 / 180;
    theta     := lon1 - lon2;
    rad_theta := pi() * theta / 180;
    dist := sin(rad_lat1) * sin(rad_lat2)
          + cos(rad_lat1) * cos(rad_lat2) * cos(rad_theta);
    IF dist > 1 THEN dist := 1; END IF;
    dist := acos(dist) * 180 / pi() * 60 * 1.1515 * 1.609344;
    RETURN dist;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5.2 Distância segura (respeita invisibilidade e privacidade)
CREATE OR REPLACE FUNCTION public.get_safe_distance(target_user_id UUID)
RETURNS FLOAT AS $$
DECLARE
    dist FLOAT;
    is_inv BOOLEAN;
    v_show BOOLEAN;
BEGIN
    SELECT invisible_mode INTO is_inv
        FROM public.user_settings WHERE user_id = target_user_id;
    IF is_inv = TRUE THEN RETURN NULL; END IF;

    SELECT show_distance INTO v_show
        FROM public.user_settings WHERE user_id = target_user_id;
    IF v_show = FALSE THEN RETURN NULL; END IF;

    SELECT public.calculate_distance(u1.latitude, u1.longitude, u2.latitude, u2.longitude)
      INTO dist
      FROM public.users u1, public.users u2
     WHERE u1.id = auth.uid() AND u2.id = target_user_id;
    RETURN dist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Verifica se o usuário tem galeria privada
CREATE OR REPLACE FUNCTION public.check_user_has_private_gallery(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE has_private BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_media
        WHERE user_id = p_user_id AND is_private = TRUE
    ) INTO has_private;
    RETURN has_private;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Verifica se o usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin(u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users WHERE id = u_id AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Lista reports ativos (apenas admin)
CREATE OR REPLACE FUNCTION public.admin_get_active_reports()
RETURNS TABLE (
    reported_id    UUID,
    reported_name  TEXT,
    report_count   BIGINT,
    reasons        TEXT[]
) AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores.';
    END IF;

    RETURN QUERY
    SELECT
        r.reported_id,
        u.name AS reported_name,
        COUNT(r.id) AS report_count,
        ARRAY_AGG(DISTINCT r.reason) AS reasons
    FROM public.reports r
    JOIN public.users u ON r.reported_id = u.id
    WHERE r.status = 'pending'
    GROUP BY r.reported_id, u.name
    ORDER BY report_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6 Dispara alertas de segurança
CREATE OR REPLACE FUNCTION public.trigger_safety_alerts()
RETURNS TABLE (alerts_sent INT) AS $$
DECLARE
    u RECORD;
    c RECORD;
    msg TEXT;
    loc_url TEXT;
    counter INT := 0;
BEGIN
    FOR u IN
        SELECT id, name, latitude, longitude
        FROM public.users
        WHERE safety_check_expires < NOW()
    LOOP
        FOR c IN
            SELECT id, phone, name
            FROM public.emergency_contacts
            WHERE user_id = u.id
        LOOP
            loc_url := 'https://www.google.com/maps?q=' || u.latitude || ',' || u.longitude;
            msg := 'DESVIO SEGURANÇA: ' || u.name || ' iniciou um encontro seguro e não confirmou sua segurança. Última localização: ' || loc_url;
            INSERT INTO public.safety_alerts (user_id, contact_id, message, location_url)
            VALUES (u.id, c.id, msg, loc_url);
            INSERT INTO public.notifications (user_id, type, title, content, metadata)
            VALUES (u.id, 'safety_alert', 'ALERTA DE SEGURANÇA ENVIADO',
                    'Seus contatos foram notificados devido à expiração do tempo.',
                    jsonb_build_object('contact_name', c.name));
            counter := counter + 1;
        END LOOP;
        UPDATE public.users SET safety_check_expires = NULL WHERE id = u.id;
    END LOOP;
    RETURN QUERY SELECT counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.7 Cálculo de ressonância (compatibilidade)
CREATE OR REPLACE FUNCTION public.calculate_resonance(user_a UUID, user_b UUID)
RETURNS INT AS $$
DECLARE
    final_score    INT := 40;
    interest_match INT;
    vector_match   FLOAT;
    u1             public.users;
    u2             public.users;
BEGIN
    SELECT * INTO u1 FROM public.users WHERE id = user_a;
    SELECT * INTO u2 FROM public.users WHERE id = user_b;
    IF u1.id IS NULL OR u2.id IS NULL THEN RETURN 50; END IF;

    SELECT COUNT(*) INTO interest_match
      FROM public.user_interests a
      JOIN public.user_interests b ON a.interest_id = b.interest_id
     WHERE a.user_id = user_a AND b.user_id = user_b;
    final_score := final_score + LEAST(interest_match * 10, 30);

    IF u1.compatibility_embedding IS NOT NULL AND u2.compatibility_embedding IS NOT NULL THEN
        vector_match := (1 - (u1.compatibility_embedding <=> u2.compatibility_embedding)) * 20;
        final_score  := final_score + COALESCE(vector_match, 0)::INT;
    END IF;

    IF u1.city = u2.city AND u1.city IS NOT NULL THEN
        final_score := final_score + 10;
    END IF;
    IF u1.profile_score >= 90 AND u2.profile_score >= 90 THEN
        final_score := final_score + 10;
    END IF;

    RETURN GREATEST(10, LEAST(100, final_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- 5.8 Busca segura (RPC principal de descoberta)
CREATE OR REPLACE FUNCTION public.search_users_safe(
    p_user_id      UUID,
    p_min_age      INT,
    p_max_age      INT,
    p_max_dist     FLOAT,
    p_type         TEXT    DEFAULT 'all',
    p_gender       TEXT    DEFAULT 'all',
    p_hair_colors  TEXT[]  DEFAULT '{}',
    p_eyes_colors  TEXT[]  DEFAULT '{}',
    p_skin_colors  TEXT[]  DEFAULT '{}',
    p_weights      TEXT[]  DEFAULT '{}',
    p_min_height   INT     DEFAULT 140,
    p_max_height   INT     DEFAULT 220,
    p_min_compat   INT     DEFAULT 0,
    p_max_compat   INT     DEFAULT 100
)
RETURNS TABLE (
    id               UUID, name TEXT, age INT, bio TEXT, gender TEXT, city TEXT,
    profile_score    INT,  profile_image_url TEXT, occupation TEXT, height INT,
    hair_color       TEXT, eyes_color TEXT, skin_color TEXT, weight TEXT,
    compatibility    INT, km_away FLOAT, last_active TIMESTAMPTZ, is_human BOOLEAN
) AS $$
DECLARE
    u_lat FLOAT; u_lon FLOAT;
BEGIN
    SELECT latitude, longitude INTO u_lat, u_lon
      FROM public.users WHERE users.id = p_user_id;

    RETURN QUERY
    SELECT * FROM (
        SELECT
            u.id, u.name, u.age, u.bio, u.gender, u.city, u.profile_score,
            u.profile_image_url, u.occupation, u.height,
            u.hair_color, u.eyes_color, u.skin_color, u.weight,
            public.calculate_resonance(p_user_id, u.id) AS res,
            public.calculate_distance(u_lat, u_lon, u.latitude, u.longitude) AS dist,
            u.last_active::TIMESTAMPTZ AS last_active, u.is_human
        FROM public.users u
        WHERE u.id != p_user_id
          AND u.age BETWEEN p_min_age AND p_max_age
          AND (p_type = 'all'
               OR (p_type = 'human' AND u.is_human = TRUE)
               OR (p_type = 'ai'    AND u.is_human = FALSE))
          AND (p_gender = 'all' OR u.gender = p_gender)
          AND (p_hair_colors IS NULL OR cardinality(p_hair_colors) = 0 OR u.hair_color = ANY(p_hair_colors))
          AND (p_eyes_colors IS NULL OR cardinality(p_eyes_colors) = 0 OR u.eyes_color = ANY(p_eyes_colors))
          AND (p_skin_colors IS NULL OR cardinality(p_skin_colors) = 0 OR u.skin_color = ANY(p_skin_colors))
          AND (p_weights     IS NULL OR cardinality(p_weights)     = 0 OR u.weight     = ANY(p_weights))
          AND (COALESCE(u.height, 170) BETWEEN p_min_height AND p_max_height)
          AND NOT EXISTS (SELECT 1 FROM public.likes l
                           WHERE l.user_id = p_user_id AND l.liked_user_id = u.id)
          AND NOT EXISTS (SELECT 1 FROM public.matches m
                           WHERE (m.user1_id = p_user_id AND m.user2_id = u.id)
                              OR (m.user1_id = u.id       AND m.user2_id = p_user_id))
    ) sub
    WHERE sub.dist <= p_max_dist
      AND sub.res BETWEEN p_min_compat AND p_max_compat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.9 Filtro anti-contato em mensagens
CREATE OR REPLACE FUNCTION public.filter_contact_info()
RETURNS TRIGGER AS $$
DECLARE
    v_clean_content TEXT;
    v_numbers_only  TEXT;
    v_is_bot        BOOLEAN;
    email_pattern   TEXT := '([a-zA-Z0-9._%+-]+)\s*(@|\[at\]|\(at\)|at)\s*([a-zA-Z0-9.-]+)\s*(\.|\[dot\]|\(dot\)|dot)\s*([a-zA-Z]{2,})';
    social_pattern  TEXT := '(insta(gram)?|face(book)?|whats(app)?|wpp|zap|telegram|tg|snap(chat)?|twitter|tt|tiktok|discord|dc)\s*(:|é|e|:|handle|user|perfil)?\s*(@?[a-zA-Z0-9._-]+)|(instagram\.com|facebook\.com|wa\.me|t\.me)';
BEGIN
    -- Pula filtro se o remetente for um perfil de IA (is_human = FALSE)
    SELECT is_human INTO v_is_bot FROM public.users WHERE id = NEW.sender_id;
    IF v_is_bot = FALSE THEN
        RETURN NEW;
    END IF;

    v_clean_content := lower(NEW.content);

    IF v_clean_content ~* email_pattern OR v_clean_content ~* social_pattern THEN
        RAISE EXCEPTION 'Segurança: Não é permitido compartilhar dados de contato externos no chat do Desvio.';
    END IF;

    v_numbers_only := regexp_replace(v_clean_content, '[^0-9]', '', 'g');
    IF length(v_numbers_only) >= 8 AND length(v_numbers_only) <= 12 THEN
        RAISE EXCEPTION 'Segurança: Bloqueio de segurança. Não é permitido compartilhar números de telefone/WhatsApp no chat.';
    END IF;

    v_clean_content := replace(v_clean_content, 'zero',  '0');
    v_clean_content := replace(v_clean_content, 'um',    '1');
    v_clean_content := replace(v_clean_content, 'dois',  '2');
    v_clean_content := replace(v_clean_content, 'três',  '3');
    v_clean_content := replace(v_clean_content, 'quatro','4');
    v_clean_content := replace(v_clean_content, 'cinco', '5');
    v_clean_content := replace(v_clean_content, 'seis',  '6');
    v_clean_content := replace(v_clean_content, 'sete',  '7');
    v_clean_content := replace(v_clean_content, 'oito',  '8');
    v_clean_content := replace(v_clean_content, 'nove',  '9');

    v_numbers_only := regexp_replace(v_clean_content, '[^0-9]', '', 'g');
    IF length(v_numbers_only) >= 8 AND length(v_numbers_only) <= 12 THEN
        RAISE EXCEPTION 'Segurança: Compartilhamento suspeito de telefone por extenso detectado.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.10 Cálculo automático de profile_score
CREATE OR REPLACE FUNCTION public.calculate_profile_score()
RETURNS TRIGGER AS $$
DECLARE score INT := 0;
BEGIN
    IF NEW.name             IS NOT NULL AND NEW.name     != '' THEN score := score + 10; END IF;
    IF NEW.age              IS NOT NULL                         THEN score := score + 10; END IF;
    IF NEW.gender           IS NOT NULL AND NEW.gender   != '' THEN score := score + 10; END IF;
    IF NEW.city             IS NOT NULL AND NEW.city     != '' THEN score := score + 10; END IF;
    IF NEW.bio              IS NOT NULL AND NEW.bio      != '' THEN score := score + 15; END IF;
    IF NEW.latitude         IS NOT NULL AND NEW.longitude IS NOT NULL THEN score := score + 15; END IF;
    IF NEW.profile_image_url IS NOT NULL AND NEW.profile_image_url != '' THEN score := score + 15; END IF;
    IF NEW.verification_status = 'verified' THEN score := score + 15; END IF;
    NEW.profile_score := score;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.11 Notificação de novo like
CREATE OR REPLACE FUNCTION public.handle_new_like_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
    VALUES (NEW.liked_user_id, 'like', 'Novo Interesse!', 'Alguém curtiu seu perfil.',
            '/likedme', jsonb_build_object('author_id', NEW.user_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.12 Notificação de match (cobre INSERT e UPDATE)
CREATE OR REPLACE FUNCTION public.handle_new_match_notification()
RETURNS TRIGGER AS $$
DECLARE
    u1_name TEXT; u2_name TEXT;
BEGIN
    IF (NEW.status = 'accepted')
       AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'accepted')) THEN
        SELECT name INTO u1_name FROM public.users WHERE id = NEW.user1_id;
        SELECT name INTO u2_name FROM public.users WHERE id = NEW.user2_id;
        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES
          (NEW.user1_id, 'match', 'Match!', u2_name || ' curtiu de volta!',
           '/chat/' || NEW.id, jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user2_id)),
          (NEW.user2_id, 'match', 'Match!', u1_name || ' curtiu de volta!',
           '/chat/' || NEW.id, jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user1_id));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.13 Notificação de visita ao perfil
CREATE OR REPLACE FUNCTION public.handle_new_visit_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
    VALUES (NEW.visited_id, 'visit', 'Nova Visita!', 'Alguém visitou seu perfil.',
            '/visitors', jsonb_build_object('visitor_id', NEW.visitor_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.14 Notificação de solicitação de galeria privada
CREATE OR REPLACE FUNCTION public.handle_gallery_access_notification()
RETURNS TRIGGER AS $$
DECLARE requester_name TEXT;
BEGIN
    SELECT name INTO requester_name FROM public.users WHERE id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (NEW.owner_id, 'gallery_request', 'Acesso à Galeria',
            requester_name || ' solicitou acesso à sua galeria privada.',
            '/user/' || NEW.owner_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.15 Notificação de aprovação de galeria privada
CREATE OR REPLACE FUNCTION public.handle_gallery_approval_notification()
RETURNS TRIGGER AS $$
DECLARE owner_name TEXT;
BEGIN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        SELECT name INTO owner_name FROM public.users WHERE id = NEW.owner_id;
        INSERT INTO public.notifications (user_id, type, title, content, link)
        VALUES (NEW.requester_id, 'gallery_approved', 'Acesso Concedido',
                owner_name || ' aprovou seu acesso à galeria privada.',
                '/user/' || NEW.owner_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.16 Match automático ao receber like mútuo
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.likes
        WHERE user_id = NEW.liked_user_id AND liked_user_id = NEW.user_id
    ) THEN
        INSERT INTO public.matches (user1_id, user2_id)
        VALUES (LEAST(NEW.user_id, NEW.liked_user_id),
                GREATEST(NEW.user_id, NEW.liked_user_id))
        ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.16.1 RPC inteligente de like (chamada pelo frontend via LikedButton)
CREATE OR REPLACE FUNCTION public.handle_like(p_target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_my_id          UUID;
    v_existing_like  public.likes;
BEGIN
    v_my_id := auth.uid();
    IF v_my_id IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;
    IF v_my_id = p_target_user_id THEN
        RAISE EXCEPTION 'Você não pode dar like em si mesmo';
    END IF;

    -- Procura QUALQUER interação entre os dois (em qualquer direção)
    SELECT * INTO v_existing_like
      FROM public.likes
     WHERE (user_id = v_my_id        AND liked_user_id = p_target_user_id)
        OR (user_id = p_target_user_id AND liked_user_id = v_my_id)
     LIMIT 1;

    IF v_existing_like.id IS NOT NULL THEN
        IF v_existing_like.user_id = v_my_id THEN
            -- Eu já tinha dado like antes
            RETURN 'liked';
        ELSE
            -- Ela já tinha me dado like! -> MATCH
            UPDATE public.likes
               SET status = 'accepted', is_read = FALSE
             WHERE id = v_existing_like.id;
            RETURN 'match';
        END IF;
    ELSE
        -- Primeira interação
        INSERT INTO public.likes (user_id, liked_user_id, status)
        VALUES (v_my_id, p_target_user_id, 'pending');
        RETURN 'liked';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.17 Auto-like de perfil IA
CREATE OR REPLACE FUNCTION public.handle_ai_auto_like_back()
RETURNS TRIGGER AS $$
DECLARE
    v_target_is_ai BOOLEAN;
BEGIN
    SELECT NOT is_human INTO v_target_is_ai FROM public.users WHERE id = NEW.liked_user_id;
    IF v_target_is_ai = TRUE THEN
        INSERT INTO public.matches (user1_id, user2_id, status)
        VALUES (LEAST(NEW.user_id, NEW.liked_user_id),
                GREATEST(NEW.user_id, NEW.liked_user_id), 'accepted')
        ON CONFLICT (user1_id, user2_id) DO UPDATE SET status = 'accepted';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.18 Resolve destinatário da mensagem automaticamente
CREATE OR REPLACE FUNCTION public.resolve_message_receiver()
RETURNS TRIGGER AS $$
DECLARE v_receiver_id UUID;
BEGIN
    IF NEW.receiver_id IS NULL THEN
        SELECT CASE WHEN user1_id = NEW.sender_id THEN user2_id ELSE user1_id END
          INTO v_receiver_id
          FROM public.matches
         WHERE id = NEW.match_id;
        NEW.receiver_id := v_receiver_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.19 Enfileira resposta de IA
CREATE OR REPLACE FUNCTION public.enqueue_ai_response()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_is_human BOOLEAN;
BEGIN
    SELECT is_human INTO v_receiver_is_human
      FROM public.users WHERE id = NEW.receiver_id;
    IF v_receiver_is_human = FALSE THEN
        INSERT INTO public.ai_chat_queue (message_id, match_id)
        VALUES (NEW.id, NEW.match_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.20 Chamada HTTP para o Gemini
CREATE OR REPLACE FUNCTION public.call_gemini(
    p_prompt      TEXT,
    p_personality TEXT,
    p_model       TEXT DEFAULT 'gemini-pro'
) RETURNS TEXT AS $$
DECLARE
    v_api_key  TEXT;
    v_url      TEXT;
    v_resp     extensions.http_response;
    v_response JSONB;
    v_body     JSONB;
BEGIN
    SELECT key_value INTO v_api_key FROM public.secrets WHERE key_name = 'GEMINI_API_KEY';
    IF v_api_key IS NULL THEN
        RETURN 'Erro: GEMINI_API_KEY não configurada em public.secrets';
    END IF;

    v_url := 'https://generativelanguage.googleapis.com/v1beta/models/'
          || p_model || ':generateContent?key=' || v_api_key;

    v_body := jsonb_build_object(
        'contents', jsonb_build_array(
            jsonb_build_object(
                'role', 'user',
                'parts', jsonb_build_array(
                    jsonb_build_object('text',
                        'Instruções de Personalidade: ' || p_personality ||
                        ' Mensagem do usuário: ' || p_prompt)
                )
            )
        )
    );

    BEGIN
        v_resp := extensions.http_post(v_url, v_body::text, 'application/json');
        v_response := v_resp.content::jsonb;
    EXCEPTION WHEN OTHERS THEN
        RETURN 'Erro na chamada HTTP: ' || SQLERRM;
    END;

    IF v_response ? 'candidates' THEN
        RETURN v_response->'candidates'->0->'content'->'parts'->0->>'text';
    ELSE
        RETURN 'Erro API Gemini: ' || v_response::text;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.21 Geração de perfil sintético (IA on-demand)
CREATE OR REPLACE FUNCTION public.spawn_synthetic_user(p_filters JSONB)
RETURNS UUID AS $$
DECLARE
    v_new_id      UUID := gen_random_uuid();
    v_name        TEXT;
    v_age         INT;
    v_gender      TEXT;
    v_city        TEXT;
    v_lat         NUMERIC;
    v_lng         NUMERIC;
    v_bio         TEXT;
    v_avatar      TEXT;
    v_personality TEXT;
    v_dist        FLOAT;
    v_angle       FLOAT;
    v_height      INT;
    v_eyes        TEXT;
    v_hair        TEXT;
    v_skin        TEXT;
    v_weight      TEXT;
    v_max_dist    FLOAT;
    v_img_idx     INT;
    v_hair_en     TEXT;
    v_skin_en     TEXT;
    v_weight_en   TEXT;
    v_gender_en   TEXT;
    v_img_url     TEXT;
    v_storage_path TEXT;
    v_s_url       TEXT;
    v_s_key       TEXT;
    v_resp        extensions.http_response;
BEGIN
    -- 0. Limpa IAs antigas da mesma região
    DELETE FROM public.users
     WHERE is_human = FALSE
       AND city = COALESCE(p_filters->>'city', 'São Paulo');

    -- 1. Extrair e normalizar filtros
    v_gender := COALESCE(p_filters->>'gender', 'Mulher');
    IF v_gender = 'all' THEN
        v_gender := (ARRAY['Mulher','Homem'])[floor(random() * 2 + 1)];
    END IF;

    v_age := floor(random()
        * (COALESCE((p_filters->>'maxAge')::int, 40)
         - COALESCE((p_filters->>'minAge')::int, 18) + 1)
        + COALESCE((p_filters->>'minAge')::int, 18));

    v_city     := COALESCE(p_filters->>'city', 'São Paulo');
    v_lat      := (p_filters->>'latitude')::numeric;
    v_lng      := (p_filters->>'longitude')::numeric;
    v_max_dist := COALESCE((p_filters->>'maxDistance')::float, 50);

    IF v_lat IS NULL OR v_lng IS NULL THEN
        SELECT latitude, longitude INTO v_lat, v_lng
          FROM public.users WHERE id = auth.uid();
    END IF;
    IF v_lat IS NULL THEN v_lat := -30.0346; v_lng := -51.2177; END IF;

    v_dist  := (random() * (v_max_dist - 2) + 2);
    v_angle := random() * 2 * 3.14159;
    v_lat   := v_lat + (v_dist / 111.32) * cos(v_angle);
    v_lng   := v_lng + (v_dist / (111.32 * cos(radians(v_lat)))) * sin(v_angle);

    v_height := floor(random()
        * (COALESCE((p_filters->>'maxHeight')::int, 200)
         - COALESCE((p_filters->>'minHeight')::int, 150) + 1)
        + COALESCE((p_filters->>'minHeight')::int, 150));

    IF p_filters ? 'eyes' AND jsonb_array_length(p_filters->'eyes') > 0 THEN
        v_eyes := (p_filters->'eyes')->>(floor(random() * jsonb_array_length(p_filters->'eyes'))::int);
    ELSE
        v_eyes := (ARRAY['Castanho','Azul','Verde','Preto','Mel'])[floor(random() * 5 + 1)];
    END IF;

    IF p_filters ? 'hair' AND jsonb_array_length(p_filters->'hair') > 0 THEN
        v_hair := (p_filters->'hair')->>(floor(random() * jsonb_array_length(p_filters->'hair'))::int);
    ELSE
        v_hair := (ARRAY['Preto','Castanho','Loiro','Ruivo','Colorido','Grisalho'])[floor(random() * 6 + 1)];
    END IF;

    IF p_filters ? 'skinColors' AND jsonb_array_length(p_filters->'skinColors') > 0 THEN
        v_skin := (p_filters->'skinColors')->>(floor(random() * jsonb_array_length(p_filters->'skinColors'))::int);
    ELSE
        v_skin := (ARRAY['Branca','Preta','Parda','Amarela','Indígena'])[floor(random() * 5 + 1)];
    END IF;

    IF p_filters ? 'weights' AND jsonb_array_length(p_filters->'weights') > 0 THEN
        v_weight := (p_filters->'weights')->>(floor(random() * jsonb_array_length(p_filters->'weights'))::int);
    ELSE
        v_weight := (ARRAY['Magro(a)','Normal','Gordo(a)'])[floor(random() * 3 + 1)];
    END IF;

    IF v_gender = 'Mulher' THEN
        v_name := (ARRAY['Valentina','Isadora','Sophia','Beatriz','Camila',
                          'Heloísa','Manuela','Laura','Alice','Lorena'])[floor(random() * 10 + 1)];
    ELSE
        v_name := (ARRAY['Enzo','Lorenzo','Gabriel','Lucas','Matheus',
                          'Thiago','Bruno','Rafael','Daniel','André'])[floor(random() * 10 + 1)];
    END IF;

    -- 2. Bio via Gemini (com fallback local)
    v_personality := 'Você é ' || COALESCE(v_name, 'Alguém') || ', '
                  || COALESCE(v_age::text, '18') || ' anos, ' || COALESCE(v_gender, 'alguém') || '. Atributos: '
                  || COALESCE(v_eyes, 'Escuros') || ', '
                  || COALESCE(v_hair, 'Escuro') || ', '
                  || COALESCE(v_skin, 'Parda') || '. Escreva UMA bio curta (max 80 caracteres) em português para um app de encontros. Foque em paixões, hobbies e o que gosta de fazer. Seja natural e atraente. NUNCA repita a mesma ideia. Varie entre: esportes, culinária, viagens, música, arte, natureza, leitura, tecnologia, café, vinho, pets, fotografia, dança, yoga, culinária.';

    BEGIN
        v_bio := public.call_gemini('Crie minha bio.', v_personality);
    EXCEPTION WHEN OTHERS THEN
        v_bio := NULL;
    END;
    IF v_bio IS NULL OR v_bio LIKE 'Erro%' THEN
        IF v_gender = 'Mulher' THEN
            v_bio := (ARRAY[
                'Amante de café e trilhas na natureza.',
                'Curto um bom vinho e conversas profundas.',
                'Dançar faz minha alma brilhar!',
                'Fotógrafa nas horas vagas, explorando cores.',
                'Viciada em séries e maratonas de cinema.',
                'Cozinhar é minha terapia favorita.',
                'Yoga e meditação são minha paz.',
                'Viajar é minha maior paixão.',
                'Arte e cultura me fascinam.',
                'Simplicidade e autenticidade acima de tudo.'
            ])[floor(random() * 10 + 1)];
        ELSE
            v_bio := (ARRAY[
                'Desenvolvedor durante o dia, gamer à noite.',
                'Esporte é vida! Procuro alguém pra treinar.',
                'Música e tecnologia são meu mundo.',
                'Apaixonado por café e boa conversa.',
                'Explorando o mundo, um café por vez.',
                'Curto rock, trilhas e cerveja artesanal.',
                'Fotógrafo nas horas vagas.',
                'Leitor ávido e sonhador contumaz.',
                'Gamer, nerd e orgulhoso disso.',
                'Simplicidade e transparência sempre.'
            ])[floor(random() * 10 + 1)];
        END IF;
    END IF;

    -- 3. Tradução para inglês + imagem
    v_hair_en   := CASE v_hair WHEN 'Loiro' THEN 'blonde' WHEN 'Preto' THEN 'black'
                                WHEN 'Castanho' THEN 'brown' WHEN 'Ruivo' THEN 'redhead'
                                WHEN 'Grisalho' THEN 'grey' ELSE 'natural' END;
    v_skin_en   := CASE v_skin WHEN 'Preta' THEN 'black' WHEN 'Branca' THEN 'white'
                                WHEN 'Parda' THEN 'latino' WHEN 'Amarela' THEN 'asian'
                                WHEN 'Indígena' THEN 'native' ELSE 'natural' END;
    v_weight_en := CASE v_weight WHEN 'Gordo(a)' THEN 'plus-size' WHEN 'Magro(a)' THEN 'thin' ELSE 'average' END;
    v_gender_en := CASE v_gender WHEN 'Mulher' THEN 'women' ELSE 'men' END;

    -- URL fonte com índice único (evita colisão de imagem entre perfis IA)
    v_img_idx := floor(random() * 100);
    WHILE EXISTS (
        SELECT 1 FROM public.users
        WHERE is_human = FALSE
          AND profile_image_url LIKE '%' || v_gender_en || '/' || v_img_idx || '.jpg'
    ) LOOP
        v_img_idx := floor(random() * 100);
    END LOOP;
    v_img_url := 'https://randomuser.me/api/portraits/' || v_gender_en || '/' || v_img_idx || '.jpg';
    v_storage_path := v_new_id::text || '.jpg';

    SELECT key_value INTO v_s_url FROM public.secrets WHERE key_name = 'SUPABASE_URL';
    SELECT key_value INTO v_s_key FROM public.secrets WHERE key_name = 'SUPABASE_SERVICE_KEY';

    BEGIN
        v_resp := extensions.http_get(v_img_url);
        IF v_resp.status = 200 AND v_resp.content IS NOT NULL AND v_s_url IS NOT NULL THEN
            v_resp := extensions.http((
                'POST',
                v_s_url || '/storage/v1/object/avatars/' || v_storage_path,
                ARRAY[
                    extensions.http_header('Authorization', 'Bearer ' || v_s_key),
                    extensions.http_header('apikey', v_s_key)
                ],
                'image/jpeg',
                v_resp.content::text
            )::extensions.http_request);

            INSERT INTO public.ai_generation_logs (status_code, response_text, target_url, context)
            VALUES (v_resp.status, LEFT(v_resp.content::text, 200),
                    v_s_url || '/storage/v1/object/avatars/' || v_storage_path, 'Upload Storage');

            IF v_resp.status BETWEEN 200 AND 299 THEN
                v_avatar := v_s_url || '/storage/v1/object/public/avatars/' || v_storage_path;
            ELSE
                v_avatar := v_img_url;
            END IF;
        ELSE
            v_avatar := v_img_url;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_avatar := v_img_url;
    END;

    -- 4. Inserir perfil IA
    INSERT INTO public.users (
        id, name, age, gender, city, latitude, longitude, bio, profile_image_url,
        is_human, profile_score, last_active, height, eyes_color, hair_color,
        skin_color, weight, email, ai_config
    ) VALUES (
        v_new_id, v_name, v_age, v_gender, v_city, v_lat, v_lng, v_bio, v_avatar,
        FALSE, 98, NOW(), v_height, v_eyes, v_hair, v_skin, v_weight,
        v_new_id::text || '@desvio.ai',
        jsonb_build_object(
            'model', 'gemini-1.5-flash',
            'personality', 'Você é ' || v_name || ', ' || v_age || ' anos. ' || v_bio || ' Responda de forma natural, simpática e breve. Use linguagem casual do dia a dia.',
            'temperature', 0.8
        )
    );

    -- 5. Interesses
    BEGIN
        IF p_filters ? 'interests'
           AND jsonb_typeof(p_filters->'interests') = 'array'
           AND jsonb_array_length(p_filters->'interests') > 0 THEN
            INSERT INTO public.user_interests (user_id, interest_id)
            SELECT v_new_id, (id)::uuid
              FROM jsonb_array_elements_text(p_filters->'interests') AS id
            ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO public.user_interests (user_id, interest_id)
            SELECT v_new_id, id FROM public.interests ORDER BY random() LIMIT 3;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.22 Geração de código de indicação único
-- (Função definida na seção 3.16 — onde é usada como DEFAULT.)

-- 5.23 Transação de créditos (com lock anti race condition)
CREATE OR REPLACE FUNCTION public.execute_credit_transaction(
    p_user_id  UUID,
    p_amount   INT,
    p_type     public.transaction_type,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS INT AS $$
DECLARE v_current_balance INT;
BEGIN
    INSERT INTO public.user_balances (user_id, credits, referral_code)
    VALUES (p_user_id, 10, public.generate_unique_referral_code())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING credits INTO v_current_balance;

    SELECT credits INTO v_current_balance
      FROM public.user_balances
     WHERE user_id = p_user_id FOR UPDATE;

    IF p_amount < 0 AND (v_current_balance + p_amount) < 0 THEN
        RAISE EXCEPTION 'Saldo de créditos insuficiente. Saldo atual: %, Requerido: %',
            v_current_balance, ABS(p_amount);
    END IF;

    UPDATE public.user_balances
       SET credits = credits + p_amount,
           updated_at = NOW()
     WHERE user_id = p_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, type, metadata)
    VALUES (p_user_id, p_amount, p_type, p_metadata);

    RETURN (v_current_balance + p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.24 Resgate de bônus diário (streak progressivo)
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_balance     RECORD;
    v_streak      INT := 0;
    v_credits     INT := 5;
    v_new_balance INT;
    v_time_diff   INTERVAL;
    v_milestone   BOOLEAN := FALSE;
    v_save_streak INT;
    v_now         TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_balance FROM public.user_balances WHERE user_id = p_user_id;

    IF v_balance.user_id IS NULL THEN
        INSERT INTO public.user_balances (user_id, credits, daily_streak, last_check_in)
        VALUES (p_user_id, 10, 0, NULL)
        RETURNING * INTO v_balance;
    END IF;

    IF v_balance.last_check_in IS NOT NULL
       AND (v_now - v_balance.last_check_in) < INTERVAL '20 hours' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Você já resgatou sua recompensa diária hoje. Retorne amanhã!'
        );
    END IF;

    IF v_balance.last_check_in IS NULL THEN
        v_streak  := 1;
        v_credits := 5;
    ELSE
        v_time_diff := v_now - v_balance.last_check_in;
        IF v_time_diff > INTERVAL '40 hours' THEN
            v_streak  := 1;
            v_credits := 5;
        ELSE
            v_streak := v_balance.daily_streak + 1;
            IF v_streak = 2 THEN v_credits := 6;
            ELSIF v_streak = 3 THEN v_credits := 7;
            ELSIF v_streak = 4 THEN v_credits := 8;
            ELSIF v_streak = 5 THEN v_credits := 9;
            ELSIF v_streak = 6 THEN v_credits := 10;
            ELSIF v_streak >= 7 THEN
                v_credits   := 25;
                v_milestone := TRUE;
                v_streak    := 7;
            END IF;
        END IF;
    END IF;

    IF v_balance.subscription_tier <> 'free'
       AND (v_balance.subscription_expires_at IS NULL
            OR v_balance.subscription_expires_at > v_now) THEN
        v_credits := v_credits + 5;
    END IF;

    v_save_streak := v_streak;
    IF v_milestone THEN v_save_streak := 0; END IF;

    SELECT public.execute_credit_transaction(
        p_user_id, v_credits, 'daily_check_in',
        jsonb_build_object('streak', v_streak, 'earned', v_credits, 'milestone', v_milestone)
    ) INTO v_new_balance;

    UPDATE public.user_balances
       SET daily_streak  = v_save_streak,
           last_check_in = v_now,
           updated_at    = v_now
     WHERE user_id = p_user_id;

    IF v_milestone THEN
        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (
            p_user_id, 'system_reward', '⚡ Recompensa Lendária!',
            'Parabéns pela sequência de 7 dias! Você ganhou +25 créditos e 1 Radar Boost grátis.',
            '/wallet', jsonb_build_object('boost_granted', TRUE)
        );
    END IF;

    RETURN jsonb_build_object(
        'success',            TRUE,
        'credits_earned',     v_credits,
        'new_balance',        v_new_balance,
        'current_streak',     v_streak,
        'milestone_achieved', v_milestone,
        'message', CASE
            WHEN v_milestone THEN
                'Estupendo! Sequência de 7 dias completa! +25 créditos e Radar Boost recebidos ⚡'
            ELSE
                'Check-in diário realizado com sucesso! Dia ' || v_streak || '. +' || v_credits || ' créditos ⚡'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.25 Resgate de código de indicação
CREATE OR REPLACE FUNCTION public.redeem_referral_code(
    p_referee_id    UUID,
    p_referral_code VARCHAR(10)
) RETURNS JSONB AS $$
DECLARE
    v_referrer_id UUID;
    v_exists      BOOLEAN;
BEGIN
    SELECT user_id INTO v_referrer_id
      FROM public.user_balances WHERE referral_code = p_referral_code;

    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'Código de indicação inválido ou inexistente.');
    END IF;

    IF v_referrer_id = p_referee_id THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'Não é permitido usar seu próprio código de indicação.');
    END IF;

    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referee_id = p_referee_id) INTO v_exists;
    IF v_exists THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'Este usuário já utilizou um código de convite.');
    END IF;

    INSERT INTO public.referrals (referrer_id, referee_id, status)
    VALUES (v_referrer_id, p_referee_id, 'pending');

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Código aceito! Complete seu cadastro para liberar seus créditos!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.26 Validação e conclusão de indicação (chamada pelo trigger)
CREATE OR REPLACE FUNCTION public.check_and_complete_referral()
RETURNS TRIGGER AS $$
DECLARE
    v_ref            RECORD;
    v_has_avatar     BOOLEAN := FALSE;
    v_has_messages   BOOLEAN := FALSE;
    v_referrer_bal   INT;
    v_referee_bal    INT;
BEGIN
    SELECT * INTO v_ref
      FROM public.referrals
     WHERE referee_id = NEW.id AND status = 'pending' AND rewarded = FALSE;
    IF v_ref.id IS NULL THEN RETURN NEW; END IF;

    IF NEW.profile_image_url IS NOT NULL AND NEW.profile_image_url != '' THEN
        v_has_avatar := TRUE;
    END IF;

    SELECT EXISTS(SELECT 1 FROM public.messages WHERE sender_id = NEW.id)
      INTO v_has_messages;

    IF v_has_avatar AND v_has_messages AND NEW.profile_score >= 80 THEN
        UPDATE public.referrals
           SET status = 'completed', rewarded = TRUE, updated_at = NOW()
         WHERE id = v_ref.id;

        SELECT public.execute_credit_transaction(
            v_ref.referrer_id, 50, 'referral_reward',
            jsonb_build_object('referee_id', NEW.id, 'referee_name', NEW.name)
        ) INTO v_referrer_bal;

        SELECT public.execute_credit_transaction(
            NEW.id, 25, 'referral_reward',
            jsonb_build_object('referrer_id', v_ref.referrer_id)
        ) INTO v_referee_bal;

        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES
          (v_ref.referrer_id, 'system_reward', '⚡ Créditos de Recomendação!',
           'Seu convidado ' || NEW.name || ' completou o cadastro. Você ganhou +50 créditos!',
           '/wallet', jsonb_build_object('credits_earned', 50)),
          (NEW.id, 'system_reward', '⚡ Bônus de Indicação!',
           'Seu perfil foi verificado. Você ganhou +25 créditos de boas-vindas!',
           '/wallet', jsonb_build_object('credits_earned', 25));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.27 Helper para reavaliar indicação após mensagem
CREATE OR REPLACE FUNCTION public.check_referral_on_message()
RETURNS TRIGGER AS $$
DECLARE v_user public.users%ROWTYPE;
BEGIN
    SELECT * INTO v_user FROM public.users WHERE id = NEW.sender_id;
    PERFORM public.check_and_complete_referral_manual(v_user.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.28 Versão manual (chamada explícita por ID)
CREATE OR REPLACE FUNCTION public.check_and_complete_referral_manual(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user          RECORD;
    v_ref           RECORD;
    v_has_avatar    BOOLEAN := FALSE;
    v_has_messages  BOOLEAN := FALSE;
    v_referrer_bal  INT;
    v_referee_bal   INT;
BEGIN
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;

    SELECT * INTO v_ref
      FROM public.referrals
     WHERE referee_id = p_user_id AND status = 'pending' AND rewarded = FALSE;
    IF v_ref.id IS NULL THEN RETURN FALSE; END IF;

    IF v_user.profile_image_url IS NOT NULL AND v_user.profile_image_url != '' THEN
        v_has_avatar := TRUE;
    END IF;

    SELECT EXISTS(SELECT 1 FROM public.messages WHERE sender_id = p_user_id)
      INTO v_has_messages;

    IF v_has_avatar AND v_has_messages AND v_user.profile_score >= 80 THEN
        UPDATE public.referrals
           SET status = 'completed', rewarded = TRUE, updated_at = NOW()
         WHERE id = v_ref.id;

        SELECT public.execute_credit_transaction(
            v_ref.referrer_id, 50, 'referral_reward',
            jsonb_build_object('referee_id', p_user_id, 'referee_name', v_user.name)
        ) INTO v_referrer_bal;
        SELECT public.execute_credit_transaction(
            p_user_id, 25, 'referral_reward',
            jsonb_build_object('referrer_id', v_ref.referrer_id)
        ) INTO v_referee_bal;

        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES
          (v_ref.referrer_id, 'system_reward', '⚡ Créditos de Recomendação!',
           'Seu convidado ' || v_user.name || ' completou o cadastro. Você ganhou +50 créditos!',
           '/wallet', jsonb_build_object('credits_earned', 50)),
          (p_user_id, 'system_reward', '⚡ Bônus de Indicação!',
           'Seu perfil foi verificado. Você ganhou +25 créditos de boas-vindas!',
           '/wallet', jsonb_build_object('credits_earned', 25));
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.29 Inicializa carteira do usuário humano (10 créditos grátis)
CREATE OR REPLACE FUNCTION public.initialize_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_human = FALSE THEN RETURN NEW; END IF;
    INSERT INTO public.user_balances (user_id, credits, referral_code)
    VALUES (NEW.id, 10, public.generate_unique_referral_code())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.30 Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 6. TRIGGERS
-- =========================================================

-- Users
DROP TRIGGER IF EXISTS tr_update_profile_score      ON public.users;
CREATE TRIGGER tr_update_profile_score
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.calculate_profile_score();

DROP TRIGGER IF EXISTS tr_initialize_user_wallet    ON public.users;
CREATE TRIGGER tr_initialize_user_wallet
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_wallet();

DROP TRIGGER IF EXISTS tr_check_referral_completion ON public.users;
CREATE TRIGGER tr_check_referral_completion
  AFTER UPDATE OF profile_score, profile_image_url ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.check_and_complete_referral();

-- Likes
DROP TRIGGER IF EXISTS tr_handle_new_like          ON public.likes;
CREATE TRIGGER tr_handle_new_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

DROP TRIGGER IF EXISTS tr_new_like_notification    ON public.likes;
CREATE TRIGGER tr_new_like_notification
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like_notification();

DROP TRIGGER IF EXISTS tr_ai_auto_like_back        ON public.likes;
CREATE TRIGGER tr_ai_auto_like_back
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_ai_auto_like_back();

-- Matches
DROP TRIGGER IF EXISTS tr_new_match_notification   ON public.matches;
CREATE TRIGGER tr_new_match_notification
  AFTER INSERT OR UPDATE OF status ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_match_notification();

-- Messages
DROP TRIGGER IF EXISTS tr_filter_messages          ON public.messages;
CREATE TRIGGER tr_filter_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.filter_contact_info();

DROP TRIGGER IF EXISTS tr_resolve_message_receiver ON public.messages;
CREATE TRIGGER tr_resolve_message_receiver
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.resolve_message_receiver();

DROP TRIGGER IF EXISTS tr_enqueue_ai_response      ON public.messages;
CREATE TRIGGER tr_enqueue_ai_response
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_ai_response();

DROP TRIGGER IF EXISTS tr_check_referral_on_message ON public.messages;
CREATE TRIGGER tr_check_referral_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.check_referral_on_message();

-- Profile visits
DROP TRIGGER IF EXISTS tr_new_visit_notification   ON public.profile_visits;
CREATE TRIGGER tr_new_visit_notification
  AFTER INSERT ON public.profile_visits
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_visit_notification();

-- Gallery access requests
DROP TRIGGER IF EXISTS tr_gallery_access_notification  ON public.gallery_access_requests;
CREATE TRIGGER tr_gallery_access_notification
  AFTER INSERT ON public.gallery_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_gallery_access_notification();

DROP TRIGGER IF EXISTS tr_gallery_approval_notification ON public.gallery_access_requests;
CREATE TRIGGER tr_gallery_approval_notification
  AFTER UPDATE OF status ON public.gallery_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_gallery_approval_notification();

-- updated_at
DROP TRIGGER IF EXISTS tr_set_updated_at_balances  ON public.user_balances;
CREATE TRIGGER tr_set_updated_at_balances
  BEFORE UPDATE ON public.user_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_set_updated_at_referrals  ON public.referrals;
CREATE TRIGGER tr_set_updated_at_referrals
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_set_updated_at_gallery    ON public.gallery_access_requests;
CREATE TRIGGER tr_set_updated_at_gallery
  BEFORE UPDATE ON public.gallery_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 7. ROW LEVEL SECURITY (HABILITAÇÃO)
-- =========================================================
ALTER TABLE public.users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_media              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secrets                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_queue           ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 8. RLS POLICIES
-- =========================================================

-- 8.1 USERS
DROP POLICY IF EXISTS "users_public_select"     ON public.users;
DROP POLICY IF EXISTS "users_insert_own"        ON public.users;
DROP POLICY IF EXISTS "users_update_own"        ON public.users;
CREATE POLICY "users_public_select" ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "users_insert_own"    ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"    ON public.users FOR UPDATE USING (auth.uid() = id);

-- 8.2 USER SETTINGS
DROP POLICY IF EXISTS "user_settings_all"       ON public.user_settings;
CREATE POLICY "user_settings_all" ON public.user_settings FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8.3 USER MEDIA
DROP POLICY IF EXISTS "media_select"            ON public.user_media;
DROP POLICY IF EXISTS "media_manage_own"        ON public.user_media;
DROP POLICY IF EXISTS "media_select_private"    ON public.user_media;
CREATE POLICY "media_select" ON public.user_media FOR SELECT USING (
    auth.uid() = user_id
    OR (
        is_private = FALSE
        AND EXISTS (SELECT 1 FROM public.users
                     WHERE id = auth.uid() AND profile_score >= 85)
    )
    OR (
        is_private = TRUE
        AND EXISTS (
            SELECT 1 FROM public.gallery_access_requests
             WHERE requester_id = auth.uid()
               AND owner_id = user_media.user_id
               AND status = 'approved'
        )
    )
);
CREATE POLICY "media_manage_own" ON public.user_media FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8.4 LIKES
DROP POLICY IF EXISTS "likes_select_own"        ON public.likes;
DROP POLICY IF EXISTS "likes_insert"            ON public.likes;
DROP POLICY IF EXISTS "likes_delete_own"        ON public.likes;
DROP POLICY IF EXISTS "likes_update_received"   ON public.likes;
CREATE POLICY "likes_select_own" ON public.likes FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = liked_user_id);
CREATE POLICY "likes_insert" ON public.likes FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile_score >= 85)
);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE
    USING (auth.uid() = user_id);
CREATE POLICY "likes_update_received" ON public.likes FOR UPDATE
    USING (auth.uid() = liked_user_id) WITH CHECK (auth.uid() = liked_user_id);

-- 8.5 MATCHES
DROP POLICY IF EXISTS "matches_select_own"      ON public.matches;
DROP POLICY IF EXISTS "matches_update_own"      ON public.matches;
DROP POLICY IF EXISTS "matches_insert"          ON public.matches;
DROP POLICY IF EXISTS "matches_delete_own"      ON public.matches;
CREATE POLICY "matches_select_own" ON public.matches FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "matches_update_own" ON public.matches FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "matches_insert" ON public.matches FOR INSERT WITH CHECK (
    auth.uid() = requester_id AND (auth.uid() = user1_id OR auth.uid() = user2_id)
);
CREATE POLICY "matches_delete_own" ON public.matches FOR DELETE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 8.6 MESSAGES
DROP POLICY IF EXISTS "messages_select"         ON public.messages;
DROP POLICY IF EXISTS "messages_insert"         ON public.messages;
DROP POLICY IF EXISTS "messages_update_own"     ON public.messages;
DROP POLICY IF EXISTS "own_messages"            ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = messages.match_id
              AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
    );
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
    WITH CHECK (
        (auth.uid() = sender_id)
        OR
        (
            EXISTS (
                SELECT 1 FROM public.users u
                JOIN public.matches m ON m.id = match_id
                WHERE u.id = sender_id
                  AND u.is_human = FALSE
                  AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
            )
        )
    );
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE
    USING (auth.uid() = receiver_id);

-- 8.7 NOTIFICATIONS
DROP POLICY IF EXISTS "notif_select_own"        ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own"        ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- 8.8 PROFILE VISITS
DROP POLICY IF EXISTS "visits_select"           ON public.profile_visits;
DROP POLICY IF EXISTS "visits_insert"           ON public.profile_visits;
DROP POLICY IF EXISTS "visits_update"           ON public.profile_visits;
CREATE POLICY "visits_select" ON public.profile_visits FOR SELECT
    USING (auth.uid() = visitor_id OR auth.uid() = visited_id);
CREATE POLICY "visits_insert" ON public.profile_visits FOR INSERT
    WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "visits_update" ON public.profile_visits FOR UPDATE
    USING      (auth.uid() = visitor_id)
    WITH CHECK (auth.uid() = visitor_id);

-- 8.9 GALLERY ACCESS REQUESTS
DROP POLICY IF EXISTS "gallery_req_select"      ON public.gallery_access_requests;
DROP POLICY IF EXISTS "gallery_req_insert"      ON public.gallery_access_requests;
DROP POLICY IF EXISTS "gallery_req_update"      ON public.gallery_access_requests;
CREATE POLICY "gallery_req_select" ON public.gallery_access_requests FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = owner_id);
CREATE POLICY "gallery_req_insert" ON public.gallery_access_requests FOR INSERT
    WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "gallery_req_update" ON public.gallery_access_requests FOR UPDATE
    USING (auth.uid() = owner_id);

-- 8.10 REPORTS
DROP POLICY IF EXISTS "reports_insert"          ON public.reports;
DROP POLICY IF EXISTS "reports_select_own"      ON public.reports;
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (
    auth.uid() = reporter_id AND reporter_id <> reported_id
);
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

-- 8.11 LOGIN ACTIVITY
DROP POLICY IF EXISTS "login_act_select_own"    ON public.login_activity;
CREATE POLICY "login_act_select_own" ON public.login_activity FOR SELECT
    USING (auth.uid() = user_id);

-- 8.12 EMERGENCY CONTACTS
DROP POLICY IF EXISTS "emg_contacts_own"        ON public.emergency_contacts;
CREATE POLICY "emg_contacts_own" ON public.emergency_contacts FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8.13 VERIFICATION REQUESTS
DROP POLICY IF EXISTS "verif_req_select_own"    ON public.verification_requests;
DROP POLICY IF EXISTS "verif_req_insert_own"    ON public.verification_requests;
CREATE POLICY "verif_req_select_own" ON public.verification_requests FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "verif_req_insert_own" ON public.verification_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 8.14 SAFETY ALERTS
DROP POLICY IF EXISTS "safety_alerts_select_own" ON public.safety_alerts;
CREATE POLICY "safety_alerts_select_own" ON public.safety_alerts FOR SELECT
    USING (auth.uid() = user_id);

-- 8.15 USER BALANCES
DROP POLICY IF EXISTS "balances_select_own"     ON public.user_balances;
DROP POLICY IF EXISTS "balances_select_admin"    ON public.user_balances;
CREATE POLICY "balances_select_own" ON public.user_balances FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "balances_select_admin" ON public.user_balances FOR SELECT
    USING (public.is_admin(auth.uid()));

-- 8.16 CREDIT TRANSACTIONS
DROP POLICY IF EXISTS "transactions_select_own" ON public.credit_transactions;
DROP POLICY IF EXISTS "transactions_select_admin" ON public.credit_transactions;
CREATE POLICY "transactions_select_own" ON public.credit_transactions FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "transactions_select_admin" ON public.credit_transactions FOR SELECT
    USING (public.is_admin(auth.uid()));

-- 8.17 REFERRALS
DROP POLICY IF EXISTS "referrals_select_own"    ON public.referrals;
DROP POLICY IF EXISTS "referrals_select_admin"  ON public.referrals;
CREATE POLICY "referrals_select_own" ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "referrals_select_admin" ON public.referrals FOR SELECT
    USING (public.is_admin(auth.uid()));

-- 8.18 SECRETS
DROP POLICY IF EXISTS "Apenas admin vê secrets"  ON public.secrets;
CREATE POLICY "Apenas admin vê secrets" ON public.secrets FOR ALL
    USING (public.is_admin(auth.uid()));

-- 8.19 AI CHAT QUEUE
DROP POLICY IF EXISTS "Apenas admin acessa fila" ON public.ai_chat_queue;
CREATE POLICY "Apenas admin acessa fila" ON public.ai_chat_queue FOR ALL
    USING (public.is_admin(auth.uid()));

-- =========================================================
-- 9. STORAGE (BUCKETS + POLICIES)
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
    VALUES ('media', 'media', TRUE)
    ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', TRUE)
    ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- bucket: media
DROP POLICY IF EXISTS "Upload_Media_Proprio"     ON storage.objects;
DROP POLICY IF EXISTS "Manage_Media_Proprio"     ON storage.objects;
DROP POLICY IF EXISTS "View_Media_Publico"       ON storage.objects;
CREATE POLICY "Upload_Media_Proprio" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Manage_Media_Proprio" ON storage.objects FOR ALL USING (
    bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "View_Media_Publico" ON storage.objects FOR SELECT
    USING (bucket_id = 'media');

-- bucket: avatars
DROP POLICY IF EXISTS "Upload_Avatar_Proprio"    ON storage.objects;
DROP POLICY IF EXISTS "Manage_Avatar_Proprio"    ON storage.objects;
DROP POLICY IF EXISTS "View_Avatar_Publico"      ON storage.objects;
CREATE POLICY "Upload_Avatar_Proprio" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Manage_Avatar_Proprio" ON storage.objects FOR ALL USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "View_Avatar_Publico" ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- =========================================================
-- 10. REALTIME (PUBLICATION)
-- =========================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE
    public.users,
    public.likes,
    public.matches,
    public.profile_visits,
    public.messages,
    public.notifications,
    public.gallery_access_requests,
    public.ai_chat_queue;

-- =========================================================
-- 10b. REALTIME (TENANT)
-- =========================================================
INSERT INTO _realtime.tenants (id, name, external_id, jwt_secret, inserted_at, updated_at)
VALUES (
  gen_random_uuid(),
  'supabase_realtime',
  'supabase_realtime',
  'b6f2e945c368ad93f2a9b5376149648e2f03b9d2',
  now(),
  now()
) ON CONFLICT (external_id) DO NOTHING;

-- =========================================================
-- 11. GRANTS
-- =========================================================
GRANT ALL ON public.users                   TO authenticated;
GRANT ALL ON public.user_settings           TO authenticated;
GRANT ALL ON public.user_media              TO authenticated;
GRANT ALL ON public.likes                   TO authenticated;
GRANT ALL ON public.matches                 TO authenticated;
GRANT ALL ON public.messages                TO authenticated;
GRANT ALL ON public.notifications           TO authenticated;
GRANT ALL ON public.profile_visits          TO authenticated;
GRANT ALL ON public.gallery_access_requests TO authenticated;
GRANT ALL ON public.reports                 TO authenticated;
GRANT ALL ON public.login_activity          TO authenticated;
GRANT ALL ON public.emergency_contacts      TO authenticated;
GRANT ALL ON public.verification_requests   TO authenticated;
GRANT ALL ON public.safety_alerts           TO authenticated;
GRANT ALL ON public.user_balances           TO authenticated;
GRANT ALL ON public.credit_transactions     TO authenticated;
GRANT ALL ON public.referrals               TO authenticated;
GRANT ALL ON public.ai_chat_queue           TO authenticated;
GRANT ALL ON public.secrets                 TO authenticated;
GRANT ALL ON public.ai_generation_logs      TO authenticated;
GRANT ALL ON public.interests               TO authenticated;
GRANT ALL ON public.user_interests          TO authenticated;

GRANT SELECT ON public.users                TO anon;
GRANT SELECT ON public.user_settings        TO anon;
GRANT SELECT ON public.user_media           TO anon;
GRANT SELECT ON public.interests            TO anon;

-- =========================================================
-- 11.1 GRANTS DE EXECUTE NAS FUNCTIONS (chamadas via PostgREST/RPC)
-- =========================================================
GRANT EXECUTE ON FUNCTION public.search_users_safe(
    UUID, INT, INT, FLOAT, TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], INT, INT, INT, INT
) TO authenticated, anon;

GRANT EXECUTE ON FUNCTION public.handle_like(UUID)                                TO authenticated;

GRANT EXECUTE ON FUNCTION public.spawn_synthetic_user(JSONB)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.call_gemini(TEXT, TEXT, TEXT)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_distance(UUID)                        TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_user_has_private_gallery(UUID)          TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID)                                 TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_active_reports()                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_safety_alerts()                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_distance(FLOAT, FLOAT, FLOAT, FLOAT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calculate_resonance(UUID, UUID)                TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_unique_referral_code()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_credit_transaction(
    UUID, INT, public.transaction_type, JSONB
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_bonus(UUID)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_referral_code(UUID, VARCHAR)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_complete_referral_manual(UUID)       TO authenticated;

-- =========================================================
-- 12. ANÁLISE INICIAL PARA O PLANNER
-- =========================================================
ANALYZE public.users;
ANALYZE public.likes;
ANALYZE public.matches;
ANALYZE public.notifications;
ANALYZE public.profile_visits;
ANALYZE public.messages;
ANALYZE public.reports;

-- 
=========================================================
-- 13. PROVISIONAMENTO DO ADMIN
-- =========================================================
-- ⚠️  RODE APENAS APÓS CRIAR O USUÁRIO NO PAINEL AUTH.
-- =========================================================

DO $$
DECLARE
    v_admin_id    UUID := 'c8a9996e-a430-46f0-bfca-02a1cdab09d6'; -- ⚠️ COLE O UUID DO PAINEL AQUI
    v_email       TEXT := 'eduardo.desvio.app@gmail.com';
    v_name        TEXT := 'Administrador';
    v_age         INT  := 30;
    v_gender      TEXT := 'Outro';
    v_city        TEXT := 'Porto Alegre';
    v_lat         NUMERIC := -30.0346;
    v_lng         NUMERIC := -51.2177;
BEGIN
    -- 0. Limpeza defensiva (caso uma execução anterior tenha falhado no meio)
    DELETE FROM public.user_balances   WHERE user_id = v_admin_id;
    DELETE FROM public.user_settings   WHERE user_id = v_admin_id;
    DELETE FROM public.user_interests  WHERE user_id = v_admin_id;
    DELETE FROM public.users           WHERE id = v_admin_id;

    -- 1. Perfil público (id = mesmo UUID do auth.users)
    INSERT INTO public.users (
        id, email, name, age, gender, city,
        latitude, longitude, profile_image_url,
        is_admin, is_human, verification_status,
        last_active, created_at
    )
    VALUES (
        v_admin_id, v_email, v_name, v_age, v_gender, v_city,
        v_lat, v_lng, NULL,
        TRUE, TRUE, 'verified',
        NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        is_admin = TRUE,
        verification_status = 'verified',
        name = EXCLUDED.name,
        email = EXCLUDED.email;

    -- 2. Settings (preferências padrão)
    INSERT INTO public.user_settings (
        user_id, push_messages, push_matches, profile_visible,
        show_distance, max_distance, theme, invisible_mode, is_premium
    )
    VALUES (
        v_admin_id, TRUE, TRUE, TRUE,
        TRUE, 100, 'dark', FALSE, TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Carteira (10 créditos grátis + premium sem expiração)
    INSERT INTO public.user_balances (
        user_id, credits, referral_code, subscription_tier, subscription_expires_at,
        created_at, updated_at
    )
    VALUES (
        v_admin_id, 1000, public.generate_unique_referral_code(), 'premium',
        NOW() + INTERVAL '100 years', NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        credits = 1000,
        subscription_tier = 'premium',
        subscription_expires_at = NOW() + INTERVAL '100 years',
        updated_at = NOW();

    -- 4. Interesses (vincula todos como exemplo)
    INSERT INTO public.user_interests (user_id, interest_id)
    SELECT v_admin_id, id FROM public.interests
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Admin criado/atualizado: % (%)', v_name, v_email;
    RAISE NOTICE '   UUID: %', v_admin_id;
    RAISE NOTICE '   Credenciais: use o email e senha definidos no painel Auth';
END $$;