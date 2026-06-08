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
-- STORAGE BUCKETS (SUPABASE)
-- ========================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Habilita RLS na tabela de storage se não estiver
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- POLICIES: STORAGE.OBJECTS (BUCKETS)
CREATE POLICY "Upload_Media_Proprio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Manage_Media_Proprio" ON storage.objects FOR ALL USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "View_Media_Publico" ON storage.objects FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Upload_Avatar_Proprio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Manage_Avatar_Proprio" ON storage.objects FOR ALL USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "View_Avatar_Publico" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

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

-- Filtro anti-contato no chat
CREATE OR REPLACE FUNCTION public.filter_contact_info()
RETURNS TRIGGER AS $$
DECLARE
  v_clean_content TEXT;
  v_numbers_only TEXT;
  
  -- E-mails: Detecta padrões com espaços ou marcações de bypass (at, dot, [at])
  email_pattern TEXT := '([a-zA-Z0-9._%+-]+)\s*(@|\[at\]|\(at\)|at)\s*([a-zA-Z0-9.-]+)\s*(\.|\[dot\]|\(dot\)|dot)\s*([a-zA-Z]{2,})';
  
  -- Redes Sociais: Palavras-chave de redes comuns + handles
  social_pattern TEXT := '(insta(gram)?|face(book)?|whats(app)?|wpp|zap|telegram|tg|snap(chat)?|twitter|tt|tiktok|discord|dc)\s*(:|é|e|:|handle|user|perfil)?\s*(@?[a-zA-Z0-9._-]+)|(instagram\.com|facebook\.com|wa\.me|t\.me)';
BEGIN
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_access_requests;

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
