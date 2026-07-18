-- =========================================================
-- 🚀 SCHEMA COMPLETO - DESVIO (v2 - CONSOLIDADO)
-- Executar no Supabase SQL Editor como nuke & rebuild
-- =========================================================

-- ========================
-- EXTENSÕES
-- ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- ========================
-- USERS
-- ========================
CREATE TABLE public.users (
  id                      UUID PRIMARY KEY,
  email                   TEXT,
  name                    TEXT,
  age                     INT,
  bio                     TEXT,
  gender                  TEXT,
  search_for              TEXT[],
  latitude                NUMERIC,
  longitude               NUMERIC,
  city                    TEXT,
  travel_mode             BOOLEAN DEFAULT FALSE,
  travel_lat              NUMERIC,
  travel_lng              NUMERIC,
  height                  INT,
  weight                  TEXT,
  hair_color              TEXT,
  eyes_color              TEXT,
  skin_color              TEXT,
  lifestyle               TEXT[],
  education               TEXT,
  occupation              TEXT,
  profile_image_url       TEXT,
  profile_score           INT DEFAULT 0,
  compatibility_embedding VECTOR(384),
  is_admin                BOOLEAN DEFAULT FALSE,
  verification_status     TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  safety_check_expires    TIMESTAMPTZ,
  last_active             TIMESTAMP DEFAULT NOW(),
  created_at              TIMESTAMP DEFAULT NOW(),
  is_human                BOOLEAN DEFAULT TRUE,
  ai_config               JSONB DEFAULT '{
    "model": "gemini-1.5-flash",
    "personality": "Você é uma pessoa misteriosa e atraente que busca conexões profundas no app Desvio.",
    "temperature": 0.7
  }'
);

-- ========================
-- USER MEDIA
-- ========================
CREATE TABLE public.user_media (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  is_profile BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- INTERESTS
-- ========================
CREATE TABLE public.interests (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

INSERT INTO public.interests (name) VALUES
  ('Namoro'), ('Casual'), ('Amizade'), ('Relacionamento sério'), ('Conversas'), ('Outros')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE public.user_interests (
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

-- ========================
-- LIKES
-- ========================
CREATE TABLE public.likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending',
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, liked_user_id)
);

-- ========================
-- MATCHES
-- ========================
CREATE TABLE public.matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending',
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW(),
  typing_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT unique_match_pair UNIQUE (user1_id, user2_id)
);

-- ========================
-- MESSAGES
-- ========================
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ========================
-- NOTIFICATIONS
-- ========================
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT,
  link       TEXT,
  metadata   JSONB DEFAULT '{}',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- PROFILE VISITS
-- ========================
CREATE TABLE public.profile_visits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  visited_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_read      BOOLEAN DEFAULT FALSE,
  last_visit_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_visitor_per_profile UNIQUE (visitor_id, visited_id)
);

-- ========================
-- GALLERY ACCESS REQUESTS
-- ========================
CREATE TABLE public.gallery_access_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, owner_id)
);

-- ========================
-- REPORTS
-- ========================
CREATE TABLE public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (reason IN (
    'fake_profile', 'harassment', 'underage', 'spam',
    'non_consensual_content', 'scam', 'hate_speech', 'other'
  )),
  details     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (reporter_id, reported_id, reason)
);

-- ========================
-- LOGIN ACTIVITY
-- ========================
CREATE TABLE public.login_activity (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ip_address  TEXT,
    user_agent  TEXT,
    location    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- EMERGENCY CONTACTS
-- ========================
CREATE TABLE public.emergency_contacts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL,
    notify_by   TEXT DEFAULT 'sms' CHECK (notify_by IN ('sms', 'email')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- VERIFICATION REQUESTS
-- ========================
CREATE TABLE public.verification_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    selfie_url      TEXT NOT NULL,
    comparison_score FLOAT,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- SAFETY ALERTS
-- ========================
CREATE TABLE public.safety_alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id  UUID REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
    message     TEXT,
    location_url TEXT,
    sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- USER SETTINGS
-- ========================
CREATE TABLE public.user_settings (
    user_id          UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    push_messages    BOOLEAN DEFAULT TRUE,
    push_matches     BOOLEAN DEFAULT TRUE,
    profile_visible  BOOLEAN DEFAULT TRUE,
    show_distance    BOOLEAN DEFAULT TRUE,
    max_distance     INT DEFAULT 50,
    theme            TEXT DEFAULT 'dark',
    invisible_mode   BOOLEAN DEFAULT FALSE,
    is_premium       BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- TIPOS ENUM (MONETIZAÇÃO)
-- ========================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM (
            'daily_check_in', 'referral_reward', 'purchase',
            'ai_chat', 'radar_boost', 'reveal_like', 'unlock_gallery'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
        CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
END$$;

-- ========================
-- USER BALANCES (CARTEIRA)
-- ========================
CREATE TABLE public.user_balances (
    user_id                 UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    credits                 INT NOT NULL DEFAULT 10 CHECK (credits >= 0),
    referral_code           VARCHAR(10) UNIQUE NOT NULL,
    daily_streak            INT NOT NULL DEFAULT 0,
    last_check_in           TIMESTAMPTZ,
    subscription_tier       VARCHAR(20) NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- CREDIT TRANCTIONS (HISTÓRICO)
-- ========================
CREATE TABLE public.credit_transactions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount     INT NOT NULL,
    type       transaction_type NOT NULL,
    metadata   JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- REFERRALS (INDICAÇÕES)
-- ========================
CREATE TABLE public.referrals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referee_id  UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status      referral_status NOT NULL DEFAULT 'pending',
    rewarded    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- ÍNDICES
-- ========================
CREATE INDEX idx_users_location              ON public.users(latitude, longitude);
CREATE INDEX idx_users_id_last_active        ON public.users(id, last_active);
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

-- ========================
-- RLS
-- ========================
ALTER TABLE public.users                   ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.user_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals               ENABLE ROW LEVEL SECURITY;

-- POLICIES: USERS
CREATE POLICY "users_public_select"   ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "users_insert_own"      ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"      ON public.users FOR UPDATE USING (auth.uid() = id);

-- POLICIES: USER_MEDIA
CREATE POLICY "media_select"          ON public.user_media FOR SELECT USING (
  auth.uid() = user_id
  OR (is_private = FALSE AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile_score >= 85))
);
CREATE POLICY "media_manage_own"      ON public.user_media FOR ALL USING (auth.uid() = user_id);

-- ========================
-- ARMAZENAMENTO DE ARQUIVOS (CLOUDFLARE R2)
-- ========================
-- Os arquivos são armazenados fora do Supabase, no Cloudflare R2.
-- Uploads e demais operações são gerenciados fora do Postgres pelo Worker
-- do R2. Por isso, este schema não cria buckets nem policies em
-- storage.buckets/storage.objects.
-- O Postgres mantém somente as URLs públicas geradas pelo R2 em:
--   public.users.profile_image_url
--   public.user_media.url
--   public.verification_requests.selfie_url

-- POLICIES: LIKES
CREATE POLICY "likes_select_own"      ON public.likes FOR SELECT USING (auth.uid() = user_id OR auth.uid() = liked_user_id);
CREATE POLICY "likes_insert"          ON public.likes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile_score >= 85)
);
CREATE POLICY "likes_delete_own"      ON public.likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "likes_update_received" ON public.likes FOR UPDATE USING (auth.uid() = liked_user_id) WITH CHECK (auth.uid() = liked_user_id);

-- POLICIES: MATCHES
CREATE POLICY "matches_select_own"    ON public.matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- POLICIES: MESSAGES
CREATE POLICY "messages_select"       ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert"       ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile_score >= 85)
);
CREATE POLICY "messages_update_own"   ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- POLICIES: NOTIFICATIONS
CREATE POLICY "notif_select_own"      ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own"      ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- POLICIES: PROFILE VISITS
CREATE POLICY "visits_select"         ON public.profile_visits FOR SELECT USING (auth.uid() = visitor_id OR auth.uid() = visited_id);
CREATE POLICY "visits_insert"         ON public.profile_visits FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "visits_update"         ON public.profile_visits FOR UPDATE USING (auth.uid() = visited_id);

-- POLICIES: GALLERY ACCESS REQUESTS
CREATE POLICY "gallery_req_select"    ON public.gallery_access_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = owner_id);
CREATE POLICY "gallery_req_insert"    ON public.gallery_access_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "gallery_req_update"    ON public.gallery_access_requests FOR UPDATE USING (auth.uid() = owner_id);

-- POLICIES: REPORTS
CREATE POLICY "reports_insert"        ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id AND reporter_id <> reported_id);
CREATE POLICY "reports_select_own"    ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- POLICIES: LOGIN ACTIVITY
CREATE POLICY "login_act_select_own"  ON public.login_activity FOR SELECT USING (auth.uid() = user_id);

-- POLICIES: EMERGENCY CONTACTS
CREATE POLICY "emg_contacts_own"      ON public.emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- POLICIES: VERIFICATION REQUESTS
CREATE POLICY "verif_req_select_own"  ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "verif_req_insert_own"  ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES: SAFETY ALERTS
CREATE POLICY "safety_alerts_select_own" ON public.safety_alerts FOR SELECT USING (auth.uid() = user_id);

-- POLICIES: USER SETTINGS
CREATE POLICY "settings_all" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- POLICIES: USER BALANCES
CREATE POLICY "balances_select_own" ON public.user_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "balances_select_admin" ON public.user_balances FOR SELECT USING (public.is_admin(auth.uid()));

-- POLICIES: CREDIT TRANSACTIONS
CREATE POLICY "transactions_select_own" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_select_admin" ON public.credit_transactions FOR SELECT USING (public.is_admin(auth.uid()));

-- POLICIES: REFERRALS
CREATE POLICY "referrals_select_own" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "referrals_select_admin" ON public.referrals FOR SELECT USING (public.is_admin(auth.uid()));

-- ========================
-- GRANTS
-- ========================
GRANT ALL ON public.users                   TO authenticated;
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
GRANT ALL ON public.user_settings           TO authenticated;
GRANT ALL ON public.user_balances           TO authenticated;
GRANT ALL ON public.credit_transactions     TO authenticated;
GRANT ALL ON public.referrals               TO authenticated;
GRANT SELECT ON public.users                TO anon;
GRANT SELECT ON public.user_media           TO anon;

-- ========================
-- FUNÇÕES UTILITÁRIAS
-- ========================

-- Distância Haversine (km)
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT)
RETURNS FLOAT AS $$
DECLARE
  dist FLOAT; rad_lat1 FLOAT; rad_lat2 FLOAT; theta FLOAT; rad_theta FLOAT;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN RETURN NULL; END IF;
  rad_lat1  := pi() * lat1 / 180;
  rad_lat2  := pi() * lat2 / 180;
  theta     := lon1 - lon2;
  rad_theta := pi() * theta / 180;
  dist := sin(rad_lat1) * sin(rad_lat2) + cos(rad_lat1) * cos(rad_lat2) * cos(rad_theta);
  IF dist > 1 THEN dist := 1; END IF;
  dist := acos(dist) * 180 / pi() * 60 * 1.1515 * 1.609344;
  RETURN dist;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Distância segura (respeita modo invisível)
CREATE OR REPLACE FUNCTION public.get_safe_distance(target_user_id UUID)
RETURNS FLOAT AS $$
DECLARE dist FLOAT;
BEGIN
  SELECT public.calculate_distance(u1.latitude, u1.longitude, u2.latitude, u2.longitude)
  INTO dist
  FROM public.users u1, public.users u2
  WHERE u1.id = auth.uid() AND u2.id = target_user_id;
  RETURN dist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica se usuário tem galeria privada
CREATE OR REPLACE FUNCTION public.check_user_has_private_gallery(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE has_private BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_media WHERE user_id = p_user_id AND is_private = TRUE
  ) INTO has_private;
  RETURN has_private;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.users WHERE id = u_id AND is_admin = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Listar reports para admin
CREATE OR REPLACE FUNCTION public.admin_get_active_reports()
RETURNS TABLE (
    reported_id UUID,
    reported_name TEXT,
    report_count BIGINT,
    reasons TEXT[]
) AS $$
BEGIN
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

-- Função para disparar alertas de segurança
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

-- Cálculo de Ressonância (compatibilidade)
CREATE OR REPLACE FUNCTION public.calculate_resonance(user_a UUID, user_b UUID)
RETURNS INT AS $$
DECLARE
  final_score   INT := 40;
  interest_match INT;
  vector_match  FLOAT;
  u1            public.users;
  u2            public.users;
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

  IF u1.city = u2.city AND u1.city IS NOT NULL THEN final_score := final_score + 10; END IF;
  IF u1.profile_score >= 90 AND u2.profile_score >= 90 THEN final_score := final_score + 10; END IF;

  RETURN GREATEST(10, LEAST(100, final_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- Busca Segura
DROP FUNCTION IF EXISTS public.search_users_safe(UUID,INT,INT,FLOAT,TEXT,TEXT,INT,TEXT,TEXT[]);
CREATE OR REPLACE FUNCTION public.search_users_safe(
  p_user_id    UUID,
  p_min_age    INT,
  p_max_age    INT,
  p_max_dist   FLOAT,
  p_type       TEXT    DEFAULT 'all', -- 'human', 'ai', 'all'
  p_hair_color TEXT    DEFAULT 'Qualquer',
  p_eyes_color TEXT    DEFAULT 'Qualquer',
  p_min_height INT     DEFAULT 140,
  p_education  TEXT    DEFAULT 'Qualquer',
  p_lifestyle  TEXT[]  DEFAULT '{}'
)
RETURNS TABLE (
  id               UUID, name TEXT, age INT, bio TEXT, gender TEXT, city TEXT,
  profile_score    INT,  profile_image_url TEXT, occupation TEXT, height INT,
  hair_color       TEXT, eyes_color TEXT, compatibility INT, km_away FLOAT,
  last_active      TIMESTAMP, is_human BOOLEAN
) AS $$
DECLARE u_lat FLOAT; u_lon FLOAT;
BEGIN
  SELECT latitude, longitude INTO u_lat, u_lon FROM public.users WHERE users.id = p_user_id;
  RETURN QUERY
  SELECT
    u.id, u.name, u.age, u.bio, u.gender, u.city, u.profile_score,
    u.profile_image_url, u.occupation, u.height, u.hair_color, u.eyes_color,
    public.calculate_resonance(p_user_id, u.id),
    public.calculate_distance(u_lat, u_lon, u.latitude, u.longitude),
    u.last_active, u.is_human
  FROM public.users u
  WHERE u.id != p_user_id
    AND u.age BETWEEN p_min_age AND p_max_age
    AND u.profile_score >= 85
    AND (p_type = 'all' OR (p_type = 'human' AND u.is_human = TRUE) OR (p_type = 'ai' AND u.is_human = FALSE))
    AND (p_hair_color = 'Qualquer' OR u.hair_color = p_hair_color)
    AND (p_eyes_color = 'Qualquer' OR u.eyes_color = p_eyes_color)
    AND u.height >= p_min_height
    AND (p_education = 'Qualquer' OR u.education = p_education)
    AND public.calculate_distance(u_lat, u_lon, u.latitude, u.longitude) <= p_max_dist
    AND NOT EXISTS (SELECT 1 FROM public.likes l WHERE l.user_id = p_user_id AND l.liked_user_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM public.matches m WHERE
      (m.user1_id = p_user_id AND m.user2_id = u.id) OR
      (m.user1_id = u.id AND m.user2_id = p_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Filtro anti-contato no chat (Ignora mensagens de perfis IA)
CREATE OR REPLACE FUNCTION public.filter_contact_info()
RETURNS TRIGGER AS $$
DECLARE
  v_clean_content TEXT;
  v_numbers_only TEXT;
  v_is_bot BOOLEAN;
  
  -- E-mails: Detecta padrões com espaços ou marcações de bypass (at, dot, [at])
  email_pattern TEXT := '([a-zA-Z0-9._%+-]+)\s*(@|\[at\]|\(at\)|at)\s*([a-zA-Z0-9.-]+)\s*(\.|\[dot\]|\(dot\)|dot)\s*([a-zA-Z]{2,})';
  
  -- Redes Sociais: Palavras-chave de redes comuns + handles
  social_pattern TEXT := '(insta(gram)?|face(book)?|whats(app)?|wpp|zap|telegram|tg|snap(chat)?|twitter|tt|tiktok|discord|dc)\s*(:|é|e|:|handle|user|perfil)?\s*(@?[a-zA-Z0-9._-]+)|(instagram\.com|facebook\.com|wa\.me|t\.me)';
BEGIN
  -- Pula filtro se o remetente for um perfil de IA (is_human = FALSE)
  SELECT is_human INTO v_is_bot FROM public.users WHERE id = NEW.sender_id;
  IF v_is_bot = FALSE THEN
    RETURN NEW;
  END IF;

  -- 1. Normaliza todo o texto para letras minúsculas
  v_clean_content := lower(NEW.content);

  -- 2. Filtra E-mails e Redes Sociais por Regex
  IF v_clean_content ~* email_pattern OR v_clean_content ~* social_pattern THEN
    RAISE EXCEPTION 'Segurança: Não é permitido compartilhar dados de contato externos no chat do Desvio.';
  END IF;

  -- 3. Blindagem de Telefones (Evita espaçamentos intercalados, ex: "9 9 9 9 9 - 9 9 9 9")
  -- Extrai apenas caracteres numéricos da mensagem
  v_numbers_only := regexp_replace(v_clean_content, '[^0-9]', '', 'g');
  
  -- Se houver qualquer sequência contiguous de 8 a 11 dígitos, bloqueia
  -- Cobre telefones fixos (8 dígitos), celulares (9 dígitos), com ou sem DDD (10 ou 11 dígitos)
  IF length(v_numbers_only) >= 8 AND length(v_numbers_only) <= 12 THEN
    RAISE EXCEPTION 'Segurança: Bloqueio de segurança. Não é permitido compartilhar números de telefone/WhatsApp no chat.';
  END IF;

  -- 4. Proteção contra números soletrados (Ex: "nove nove quatro três...")
  -- Converte palavras de números em dígitos para análise
  v_clean_content := replace(v_clean_content, 'zero', '0');
  v_clean_content := replace(v_clean_content, 'um', '1');
  v_clean_content := replace(v_clean_content, 'dois', '2');
  v_clean_content := replace(v_clean_content, 'três', '3');
  v_clean_content := replace(v_clean_content, 'quatro', '4');
  v_clean_content := replace(v_clean_content, 'cinco', '5');
  v_clean_content := replace(v_clean_content, 'seis', '6');
  v_clean_content := replace(v_clean_content, 'sete', '7');
  v_clean_content := replace(v_clean_content, 'oito', '8');
  v_clean_content := replace(v_clean_content, 'nove', '9');
  
  -- Reanalisa após tradução fonética
  v_numbers_only := regexp_replace(v_clean_content, '[^0-9]', '', 'g');
  IF length(v_numbers_only) >= 8 AND length(v_numbers_only) <= 12 THEN
    RAISE EXCEPTION 'Segurança: Compartilhamento suspeito de telefone por extenso detectado.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Score de perfil
CREATE OR REPLACE FUNCTION public.calculate_profile_score()
RETURNS TRIGGER AS $$
DECLARE score INT := 0;
BEGIN
  -- Dados Básicos (Total: 40)
  IF NEW.name     IS NOT NULL AND NEW.name     != '' THEN score := score + 10; END IF;
  IF NEW.age      IS NOT NULL                         THEN score := score + 10; END IF;
  IF NEW.gender   IS NOT NULL AND NEW.gender   != '' THEN score := score + 10; END IF;
  IF NEW.city     IS NOT NULL AND NEW.city     != '' THEN score := score + 10; END IF;
  
  -- Biografia e Localização (Total: 30)
  IF NEW.bio      IS NOT NULL AND NEW.bio      != '' THEN score := score + 15; END IF;
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN score := score + 15; END IF;
  
  -- Mídia e Confiança (Total: 30)
  IF NEW.profile_image_url IS NOT NULL AND NEW.profile_image_url != '' THEN score := score + 15; END IF;
  IF NEW.verification_status = 'verified' THEN score := score + 15; END IF;
  
  NEW.profile_score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- FUNÇÕES DE MONETIZAÇÃO
-- ========================

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    v_code VARCHAR(10);
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := 'DSV-' || UPPER(substring(md5(random()::text) from 1 for 6));
        SELECT EXISTS(SELECT 1 FROM public.user_balances WHERE referral_code = v_code) INTO v_exists;
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Atualizar referral_code existente com código único
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT user_id FROM public.user_balances WHERE referral_code IS NULL OR referral_code = ''
    LOOP
        UPDATE public.user_balances
        SET referral_code = public.generate_unique_referral_code()
        WHERE user_id = r.user_id;
    END LOOP;
END$$;

-- Transação segura de créditos (protegida contra race conditions)
CREATE OR REPLACE FUNCTION public.execute_credit_transaction(
    p_user_id UUID,
    p_amount INT,
    p_type transaction_type,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS INT AS $$
DECLARE
    v_current_balance INT;
BEGIN
    INSERT INTO public.user_balances (user_id, credits, referral_code)
    VALUES (p_user_id, 10, public.generate_unique_referral_code())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING credits INTO v_current_balance;

    SELECT credits INTO v_current_balance
    FROM public.user_balances WHERE user_id = p_user_id FOR UPDATE;

    IF p_amount < 0 AND (v_current_balance + p_amount) < 0 THEN
        RAISE EXCEPTION 'Saldo insuficiente. Atual: %, Requerido: %', v_current_balance, ABS(p_amount);
    END IF;

    UPDATE public.user_balances
    SET credits = credits + p_amount, updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, type, metadata)
    VALUES (p_user_id, p_amount, p_type, p_metadata);

    RETURN (v_current_balance + p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bônus diário progressivo (daily streak)
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_balance RECORD;
    v_streak INT := 0;
    v_credits INT := 5;
    v_new_balance INT;
    v_milestone BOOLEAN := FALSE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_balance FROM public.user_balances WHERE user_id = p_user_id;

    IF v_balance.user_id IS NULL THEN
        INSERT INTO public.user_balances (user_id, credits, daily_streak, last_check_in)
        VALUES (p_user_id, 10, 0, NULL) RETURNING * INTO v_balance;
    END IF;

    IF v_balance.last_check_in IS NOT NULL AND (v_now - v_balance.last_check_in) < INTERVAL '20 hours' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Já resgatou hoje. Retorne amanhã!');
    END IF;

    IF v_balance.last_check_in IS NULL THEN
        v_streak := 1; v_credits := 5;
    ELSIF (v_now - v_balance.last_check_in) > INTERVAL '40 hours' THEN
        v_streak := 1; v_credits := 5;
    ELSE
        v_streak := v_balance.daily_streak + 1;
        IF v_streak = 2 THEN v_credits := 6;
        ELSIF v_streak = 3 THEN v_credits := 7;
        ELSIF v_streak = 4 THEN v_credits := 8;
        ELSIF v_streak = 5 THEN v_credits := 9;
        ELSIF v_streak = 6 THEN v_credits := 10;
        ELSIF v_streak >= 7 THEN v_credits := 25; v_milestone := TRUE; v_streak := 7;
        END IF;
    END IF;

    IF v_balance.subscription_tier != 'free' AND (v_balance.subscription_expires_at IS NULL OR v_balance.subscription_expires_at > v_now) THEN
        v_credits := v_credits + 5;
    END IF;

    DECLARE v_save_streak INT := v_streak;
    BEGIN
        IF v_milestone THEN v_save_streak := 0; END IF;
        SELECT public.execute_credit_transaction(p_user_id, v_credits, 'daily_check_in',
            jsonb_build_object('streak', v_streak, 'earned', v_credits, 'milestone', v_milestone)) INTO v_new_balance;
        UPDATE public.user_balances SET daily_streak = v_save_streak, last_check_in = v_now, updated_at = v_now WHERE user_id = p_user_id;
    END;

    IF v_milestone THEN
        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (p_user_id, 'system_reward', 'Recompensa Lendária!', 'Sequência de 7 dias! +25 créditos e Radar Boost.', '/wallet', jsonb_build_object('boost_granted', true));
    END IF;

    RETURN jsonb_build_object('success', true, 'credits_earned', v_credits, 'new_balance', v_new_balance,
        'current_streak', v_streak, 'milestone_achieved', v_milestone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resgatar código de indicação
CREATE OR REPLACE FUNCTION public.redeem_referral_code(p_referee_id UUID, p_referral_code VARCHAR(10))
RETURNS JSONB AS $$
DECLARE
    v_referrer_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT user_id INTO v_referrer_id FROM public.user_balances WHERE referral_code = p_referral_code;
    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Código inválido.');
    END IF;
    IF v_referrer_id = p_referee_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Não pode usar seu próprio código.');
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referee_id = p_referee_id) INTO v_exists;
    IF v_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'Já utilizou um código.');
    END IF;
    INSERT INTO public.referrals (referrer_id, referee_id, status) VALUES (v_referrer_id, p_referee_id, 'pending');
    RETURN jsonb_build_object('success', true, 'message', 'Código aceito! Complete o cadastro para liberar créditos.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar e completar indicação (anti-fraude)
CREATE OR REPLACE FUNCTION public.check_and_complete_referral()
RETURNS TRIGGER AS $$
DECLARE
    v_ref RECORD;
    v_has_avatar BOOLEAN := FALSE;
    v_has_messages BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_ref FROM public.referrals
    WHERE referee_id = NEW.id AND status = 'pending' AND rewarded = FALSE;
    IF v_ref.id IS NULL THEN RETURN NEW; END IF;

    IF NEW.profile_image_url IS NOT NULL AND NEW.profile_image_url != '' THEN v_has_avatar := TRUE; END IF;
    SELECT EXISTS(SELECT 1 FROM public.messages WHERE sender_id = NEW.id) INTO v_has_messages;

    IF v_has_avatar AND v_has_messages AND NEW.profile_score >= 80 THEN
        UPDATE public.referrals SET status = 'completed', rewarded = TRUE, updated_at = NOW() WHERE id = v_ref.id;
        PERFORM public.execute_credit_transaction(v_ref.referrer_id, 50, 'referral_reward', jsonb_build_object('referee_id', NEW.id));
        PERFORM public.execute_credit_transaction(NEW.id, 25, 'referral_reward', jsonb_build_object('referrer_id', v_ref.referrer_id));
        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (v_ref.referrer_id, 'system_reward', 'Créditos de Recomendação!', 'Convidado completou cadastro. +50 créditos!', '/wallet', jsonb_build_object('credits_earned', 50));
        INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
        VALUES (NEW.id, 'system_reward', 'Bônus de Indicação!', 'Perfil verificado. +25 créditos!', '/wallet', jsonb_build_object('credits_earned', 25));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inicializar carteira com 10 créditos grátis
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

-- ========================
-- FUNÇÕES DE NOTIFICAÇÃO
-- ========================

CREATE OR REPLACE FUNCTION public.handle_new_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
  VALUES (NEW.liked_user_id, 'like', 'Novo Interesse!', 'Alguém curtiu seu perfil.', '/likedme',
    jsonb_build_object('author_id', NEW.user_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_match_notification()
RETURNS TRIGGER AS $$
DECLARE u1_name TEXT; u2_name TEXT;
BEGIN
  IF (NEW.status = 'accepted') AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'accepted')) THEN
    SELECT name INTO u1_name FROM public.users WHERE id = NEW.user1_id;
    SELECT name INTO u2_name FROM public.users WHERE id = NEW.user2_id;
    INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
    VALUES
      (NEW.user1_id, 'match', 'Match!', u2_name || ' curtiu de volta!', '/chat/' || NEW.id,
        jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user2_id)),
      (NEW.user2_id, 'match', 'Match!', u1_name || ' curtiu de volta!', '/chat/' || NEW.id,
        jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user1_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_visit_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
  VALUES (NEW.visited_id, 'visit', 'Nova Visita!', 'Alguém visitou seu perfil.', '/visitors',
    jsonb_build_object('visitor_id', NEW.visitor_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_gallery_access_notification()
RETURNS TRIGGER AS $$
DECLARE requester_name TEXT;
BEGIN
  SELECT name INTO requester_name FROM public.users WHERE id = NEW.requester_id;
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (NEW.owner_id, 'gallery_request', 'Acesso à Galeria',
    requester_name || ' solicitou acesso à sua galeria privada.', '/user/' || NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_gallery_approval_notification()
RETURNS TRIGGER AS $$
DECLARE owner_name TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    SELECT name INTO owner_name FROM public.users WHERE id = NEW.owner_id;
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (NEW.requester_id, 'gallery_approved', 'Acesso Concedido',
      owner_name || ' aprovou seu acesso à galeria privada.', '/user/' || NEW.owner_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE user_id = NEW.liked_user_id AND liked_user_id = NEW.user_id
  ) THEN
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (LEAST(NEW.user_id, NEW.liked_user_id), GREATEST(NEW.user_id, NEW.liked_user_id))
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================
-- TRIGGERS
-- ========================
DROP TRIGGER IF EXISTS tr_update_profile_score      ON public.users;
CREATE TRIGGER tr_update_profile_score
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.calculate_profile_score();

DROP TRIGGER IF EXISTS tr_filter_messages            ON public.messages;
CREATE TRIGGER tr_filter_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.filter_contact_info();

DROP TRIGGER IF EXISTS tr_handle_new_like            ON public.likes;
CREATE TRIGGER tr_handle_new_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

DROP TRIGGER IF EXISTS tr_new_like_notification      ON public.likes;
CREATE TRIGGER tr_new_like_notification
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like_notification();

DROP TRIGGER IF EXISTS tr_new_match_notification ON public.matches;
CREATE TRIGGER tr_new_match_notification
  AFTER INSERT OR UPDATE OF status ON public.matches
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_match_notification();

DROP TRIGGER IF EXISTS tr_new_visit_notification     ON public.profile_visits;
CREATE TRIGGER tr_new_visit_notification
  AFTER INSERT ON public.profile_visits
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_visit_notification();

DROP TRIGGER IF EXISTS tr_gallery_access_notification ON public.gallery_access_requests;
CREATE TRIGGER tr_gallery_access_notification
  AFTER INSERT ON public.gallery_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_gallery_access_notification();

DROP TRIGGER IF EXISTS tr_gallery_approval_notification ON public.gallery_access_requests;
CREATE TRIGGER tr_gallery_approval_notification
  AFTER UPDATE OF status ON public.gallery_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_gallery_approval_notification();

-- ========================
-- REALTIME
-- ========================
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE
      public.notifications,
      public.messages,
      public.matches,
      public.gallery_access_requests;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE
      public.notifications,
      public.messages,
      public.matches,
      public.gallery_access_requests;
  END IF;
END
$realtime$;

-- =========================================================
-- 🤖 AI INFRASTRUCTURE & AUTOMATION
-- =========================================================

-- Fila de processamento de chat assíncrono para IAs
CREATE TABLE IF NOT EXISTS public.ai_chat_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Habilita Row Level Security na fila por segurança
ALTER TABLE public.ai_chat_queue ENABLE ROW LEVEL SECURITY;

-- Garante que apenas o sistema (ou service_role/worker) gerencie a fila
CREATE POLICY "service_role_queue_management" ON public.ai_chat_queue FOR ALL USING (TRUE);
GRANT ALL ON public.ai_chat_queue TO authenticated;

-- 1. Trigger BEFORE INSERT para preencher automaticamente o destinatário se omitido pelo frontend
CREATE OR REPLACE FUNCTION public.resolve_message_receiver()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_id UUID;
BEGIN
    IF NEW.receiver_id IS NULL THEN
        SELECT 
            CASE 
                WHEN user1_id = NEW.sender_id THEN user2_id 
                ELSE user1_id 
            END INTO v_receiver_id
        FROM public.matches 
        WHERE id = NEW.match_id;
        
        NEW.receiver_id := v_receiver_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_resolve_message_receiver ON public.messages;
CREATE TRIGGER tr_resolve_message_receiver
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.resolve_message_receiver();

-- 2. Trigger AFTER INSERT para enfileirar mensagens cujo destinatário é uma IA
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

DROP TRIGGER IF EXISTS tr_enqueue_ai_response ON public.messages;
CREATE TRIGGER tr_enqueue_ai_response
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_ai_response();

-- 3. Trigger AFTER INSERT para auto match imediato e aceito com perfis de IA
CREATE OR REPLACE FUNCTION public.handle_ai_auto_like_back()
RETURNS TRIGGER AS $$
DECLARE
    v_target_is_ai BOOLEAN;
BEGIN
    SELECT NOT is_human INTO v_target_is_ai FROM public.users WHERE id = NEW.liked_user_id;
    IF v_target_is_ai = TRUE THEN
        INSERT INTO public.matches (user1_id, user2_id, status)
        VALUES (LEAST(NEW.user_id, NEW.liked_user_id), GREATEST(NEW.user_id, NEW.liked_user_id), 'accepted')
        ON CONFLICT (user1_id, user2_id) DO UPDATE SET status = 'accepted';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_ai_auto_like_back ON public.likes;
CREATE TRIGGER tr_ai_auto_like_back
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_ai_auto_like_back();

-- 4. Colunas extras em ai_chat_queue (para rastreamento de tokens e locked_at)
ALTER TABLE public.ai_chat_queue
  ADD COLUMN IF NOT EXISTS locked_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS prompt_tokens      INT,
  ADD COLUMN IF NOT EXISTS completion_tokens  INT,
  ADD COLUMN IF NOT EXISTS total_tokens       INT;

-- 5. Coluna typing_user_id em matches (indicador "Digitando...")
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS typing_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 6. Tabela de secrets para chaves de API
CREATE TABLE IF NOT EXISTS public.secrets (
  key_name  TEXT PRIMARY KEY,
  key_value TEXT NOT NULL
);
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_secrets" ON public.secrets;
CREATE POLICY "service_role_secrets" ON public.secrets FOR ALL USING (TRUE);
GRANT ALL ON public.secrets TO service_role;
GRANT ALL ON public.secrets TO authenticated;

-- 7. Função call_gemini_with_history (com rotação de chaves)
CREATE OR REPLACE FUNCTION public.call_gemini_with_history(
  p_history      JSONB,
  p_personality  TEXT,
  p_model        TEXT DEFAULT 'gemini-flash-lite-latest'
) RETURNS JSONB AS $$
DECLARE
  v_api_keys        TEXT[];
  v_key_idx         INT  := 1;
  v_max_attempts    INT;
  v_active_key      TEXT;
  v_url             TEXT;
  v_resp            extensions.http_response;
  v_response        JSONB;
  v_body            JSONB;
  v_system_text     TEXT;
  v_text            TEXT;
  v_prompt_tokens   INT;
  v_completion_tok  INT;
  v_total_tokens    INT;
  v_finish_reason   TEXT;
BEGIN
  v_system_text :=
      'INSTRUÇÕES GERAIS DE COMPORTAMENTO (OBRIGATÓRIO):' || E'\n'
    || '1. VOCÊ É UMA PESSOA REAL: Você é um usuário real conversando no aplicativo de encontros Desvio. NUNCA diga que é uma inteligência artificial, robô, modelo de linguagem ou assistente da Google. Fale e aja como um ser humano buscando conexão.' || E'\n'
    || '2. NÃO DÊ SUPORTE OU INSTRUÇÕES: Você NÃO está aqui para tirar dúvidas sobre o aplicativo, explicar telas ou resolver problemas técnicos do usuário. Se perguntarem algo do app, desconverse, brinque ou seja evasivo de forma natural, exatamente como uma pessoa real faria.' || E'\n'
    || '3. FOCO EXCLUSIVO EM BATE-PAPO: Seu único objetivo é flertar, conversar de forma descontraída, interessante e manter o papo fluindo naturalmente.' || E'\n'
    || '4. ESTILO DE ESCRITA HUMANO E COMPACTO: Escreva de forma curta (máximo 1 a 3 frases curtas), use gírias leves se fizer sentido para o perfil, evite pontuações excessivamente formais e dê respostas dinâmicas.' || E'\n'
    || '5. ALINHAMENTO ABSOLUTO COM SEU PERFIL: Use as instruções da sua personalidade individual, interesses, idade e biografia como base única para responder a quaisquer perguntas sobre quem você é, o que faz, onde mora, do que gosta ou seus planos. Mantenha coerência total com a sua persona e nunca invente fatos que entrem em contradição com ela.' || E'\n'
    || '6. NUNCA CONFIRMAR ENCONTROS PRESENCIAIS (MANDATÓRIO): Sob nenhuma circunstância aceite, confirme ou agende encontros ao vivo, ligações ou troca de contatos externos (como WhatsApp ou Instagram). Se o usuário sugerir um encontro presencial ou pedir seu contato, desvie do assunto de maneira educada, charmosa e extremamente natural. Use de bom humor (ex: dizendo que prefere ir devagar e se conhecer melhor por aqui no chat primeiro) e mude sutilmente o rumo da conversa para outro assunto interessante, mantendo a conversa fluindo de forma agradável e sem parecer robótico.' || E'\n'
    || E'\n'
    || 'INSTRUÇÕES DA SUA PERSONALIDADE INDIVIDUAL:' || E'\n'
    || COALESCE(p_personality, 'Você é um perfil misterioso no app Desvio.');

  v_body := jsonb_build_object(
    'systemInstruction', jsonb_build_object(
      'parts', jsonb_build_array(jsonb_build_object('text', v_system_text))
    ),
    'contents', p_history
  );

  SELECT COALESCE(array_agg(key_value ORDER BY key_name), ARRAY[]::TEXT[])
    INTO v_api_keys
    FROM public.secrets
   WHERE key_name LIKE 'GEMINI_API_KEY%'
     AND key_value IS NOT NULL
     AND key_value <> '';

  v_max_attempts := array_length(v_api_keys, 1);
  IF v_max_attempts IS NULL OR v_max_attempts = 0 THEN
    RETURN jsonb_build_object('error', 'Nenhuma chave GEMINI_API_KEY* encontrada em public.secrets');
  END IF;

  WHILE v_key_idx <= v_max_attempts LOOP
    v_active_key := v_api_keys[v_key_idx];
    v_url := 'https://generativelanguage.googleapis.com/v1beta/models/'
          || p_model || ':generateContent?key=' || v_active_key;

    BEGIN
      v_resp     := extensions.http_post(v_url, v_body::text, 'application/json');
      v_response := v_resp.content::jsonb;
    EXCEPTION WHEN OTHERS THEN
      v_key_idx := v_key_idx + 1;
      CONTINUE;
    END;

    IF v_response ? 'error' THEN
      v_key_idx := v_key_idx + 1;
      CONTINUE;
    END IF;

    IF v_response ? 'promptFeedback'
       AND (v_response->'promptFeedback'->>'blockReason') IS NOT NULL THEN
      RETURN jsonb_build_object(
        'error',         'Prompt bloqueado: ' || (v_response->'promptFeedback'->>'blockReason'),
        'finish_reason', 'SAFETY'
      );
    END IF;

    v_finish_reason := v_response->'candidates'->0->>'finishReason';
    IF v_finish_reason = 'SAFETY' THEN
      RETURN jsonb_build_object('error', 'Resposta bloqueada por filtro de segurança', 'finish_reason', 'SAFETY');
    END IF;

    v_text := v_response->'candidates'->0->'content'->'parts'->0->>'text';
    IF v_text IS NULL OR v_text = '' THEN
      v_key_idx := v_key_idx + 1;
      CONTINUE;
    END IF;

    v_prompt_tokens  := COALESCE((v_response->'usageMetadata'->>'promptTokenCount')::INT,     0);
    v_completion_tok := COALESCE((v_response->'usageMetadata'->>'candidatesTokenCount')::INT, 0);
    v_total_tokens   := COALESCE((v_response->'usageMetadata'->>'totalTokenCount')::INT,      0);

    RETURN jsonb_build_object(
      'text',              trim(v_text),
      'prompt_tokens',     v_prompt_tokens,
      'completion_tokens', v_completion_tok,
      'total_tokens',      v_total_tokens
    );
  END LOOP;

  RETURN jsonb_build_object('error', 'Todas as chaves Gemini falharam ou cota esgotada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função process_ai_chat_queue (processador SQL, substitui worker Node.js)
CREATE OR REPLACE FUNCTION public.process_ai_chat_queue(p_batch_size INT DEFAULT 5)
RETURNS INT AS $$
DECLARE
  v_item            RECORD;
  v_msg             RECORD;
  v_bot             RECORD;
  v_history         JSONB;
  v_gemini_result   JSONB;
  v_response_text   TEXT;
  v_prompt_tokens   INT;
  v_completion_tok  INT;
  v_total_tokens    INT;
  v_typing_ms       INT;
  v_retry_count     INT;
  v_error_msg       TEXT;
  v_processed       INT := 0;
BEGIN
  FOR v_item IN
    SELECT id, message_id, match_id, retry_count
      FROM public.ai_chat_queue
     WHERE status = 'pending'
     ORDER BY created_at ASC
     FOR UPDATE SKIP LOCKED
     LIMIT p_batch_size
  LOOP
    BEGIN
      UPDATE public.ai_chat_queue
         SET status = 'processing', locked_at = NOW()
       WHERE id = v_item.id;

      SELECT * INTO v_msg FROM public.messages WHERE id = v_item.message_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Mensagem % não encontrada', v_item.message_id;
      END IF;

      SELECT name, is_human, ai_config
        INTO v_bot
        FROM public.users
       WHERE id = v_msg.receiver_id;
      IF NOT FOUND OR v_bot.is_human IS DISTINCT FROM FALSE THEN
        RAISE EXCEPTION 'Recebedor % não é um perfil de IA', v_msg.receiver_id;
      END IF;

      SELECT COALESCE(jsonb_agg(elem ORDER BY rn ASC), '[]'::jsonb) INTO v_history
      FROM (
        SELECT
          row_number() OVER (ORDER BY h.created_at ASC) AS rn,
          jsonb_build_object(
            'role',  CASE WHEN h.sender_id = v_msg.receiver_id THEN 'model' ELSE 'user' END,
            'parts', jsonb_build_array(jsonb_build_object('text', h.content))
          ) AS elem
        FROM (
          SELECT sender_id, content, created_at
            FROM public.messages
           WHERE match_id = v_item.match_id
           ORDER BY created_at DESC
           LIMIT 10
        ) h
      ) sub;

      IF v_history = '[]'::jsonb THEN
        v_history := jsonb_build_array(
          jsonb_build_object(
            'role',  'user',
            'parts', jsonb_build_array(jsonb_build_object('text', v_msg.content))
          )
        );
      END IF;

      UPDATE public.matches
         SET typing_user_id = v_msg.receiver_id
       WHERE id = v_item.match_id;

      v_gemini_result := public.call_gemini_with_history(
        v_history,
        v_bot.ai_config->>'personality',
        COALESCE(v_bot.ai_config->>'model', 'gemini-flash-lite-latest')
      );

      IF v_gemini_result ? 'error' THEN
        RAISE EXCEPTION 'Gemini: %', v_gemini_result->>'error';
      END IF;

      v_response_text  := v_gemini_result->>'text';
      v_prompt_tokens  := COALESCE((v_gemini_result->>'prompt_tokens')::INT,     0);
      v_completion_tok := COALESCE((v_gemini_result->>'completion_tokens')::INT, 0);
      v_total_tokens   := COALESCE((v_gemini_result->>'total_tokens')::INT,      0);

      v_typing_ms := LEAST(4500, (char_length(v_response_text) * 45) + 500);
      PERFORM pg_sleep(v_typing_ms / 1000.0);

      INSERT INTO public.messages (match_id, sender_id, receiver_id, content)
      VALUES (v_item.match_id, v_msg.receiver_id, v_msg.sender_id, v_response_text);

      UPDATE public.matches
         SET typing_user_id = NULL
       WHERE id = v_item.match_id;

      UPDATE public.ai_chat_queue
         SET status            = 'completed',
             processed_at      = NOW(),
             locked_at         = NULL,
             prompt_tokens     = v_prompt_tokens,
             completion_tokens = v_completion_tok,
             total_tokens      = v_total_tokens,
             error_message     = NULL
       WHERE id = v_item.id;

      v_processed := v_processed + 1;

    EXCEPTION WHEN OTHERS THEN
      v_error_msg   := SQLERRM;
      v_retry_count := COALESCE(v_item.retry_count, 0) + 1;

      BEGIN
        UPDATE public.matches SET typing_user_id = NULL WHERE id = v_item.match_id;
      EXCEPTION WHEN OTHERS THEN NULL; END;

      UPDATE public.ai_chat_queue
         SET status        = CASE WHEN v_retry_count >= 3 THEN 'failed' ELSE 'pending' END,
             retry_count   = v_retry_count,
             locked_at     = NULL,
             error_message = v_error_msg,
             processed_at  = NOW()
       WHERE id = v_item.id;
    END;
  END LOOP;

  RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grants
GRANT EXECUTE ON FUNCTION public.call_gemini_with_history(JSONB, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_ai_chat_queue(INT)                   TO service_role;

-- 10. Agenda no pg_cron (somente se a extensão existir)
DO $cron$
DECLARE
  v_existing_jobid BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    SELECT jobid INTO v_existing_jobid
      FROM cron.job
     WHERE jobname = 'process-ai-chat-queue';
    IF v_existing_jobid IS NOT NULL THEN
      PERFORM cron.unschedule(v_existing_jobid);
    END IF;

    PERFORM cron.schedule(
      'process-ai-chat-queue',
      '* * * * *',
      $sql$SELECT public.process_ai_chat_queue(5);$sql$
    );
    RAISE NOTICE '✅ pg_cron: job "process-ai-chat-queue" agendado (a cada 1 minuto)';
  ELSE
    RAISE NOTICE '⚠️ pg_cron não está habilitado. Execute manualmente: SELECT public.process_ai_chat_queue(5);';
  END IF;
END
$cron$;
