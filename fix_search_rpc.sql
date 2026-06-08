-- =========================================================
-- 🛠️ CORREÇÃO DEFINITIVA DA BUSCA (SEARCH_USERS_SAFE)
-- =========================================================

-- 1. Garantir que as extensões necessárias existam
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Recriar função de Distância (Limpando versões antigas)
DROP FUNCTION IF EXISTS public.calculate_distance(numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS public.calculate_distance(float, float, float, float);

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC)
RETURNS FLOAT AS $$
DECLARE                                                                                    
    dist FLOAT = 0;
    lat1rad FLOAT;
    lat2rad FLOAT;
    dLat FLOAT;
    dLon FLOAT;
    a FLOAT;
    c FLOAT;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN 0;
    END IF;

    lat1rad := RADIANS(lat1);
    lat2rad := RADIANS(lat2);
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);

    a := SIN(dLat / 2) * SIN(dLat / 2) + COS(lat1rad) * COS(lat2rad) * SIN(dLon / 2) * SIN(dLon / 2);
    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
    dist := 6371 * c;

    RETURN dist;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Recriar função de Ressonância (Limpando versões antigas)
DROP FUNCTION IF EXISTS public.calculate_resonance(uuid, uuid);

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

  -- Match de Interesses
  SELECT COUNT(*) INTO interest_match
  FROM public.user_interests a
  JOIN public.user_interests b ON a.interest_id = b.interest_id
  WHERE a.user_id = user_a AND b.user_id = user_b;
  
  final_score := final_score + LEAST(interest_match * 10, 30);

  -- Match Vetorial (se existir vector)
  IF u1.compatibility_embedding IS NOT NULL AND u2.compatibility_embedding IS NOT NULL THEN
    vector_match := (1 - (u1.compatibility_embedding <=> u2.compatibility_embedding)) * 20;
    final_score  := final_score + COALESCE(vector_match, 0)::INT;
  END IF;

  IF u1.city = u2.city AND u1.city IS NOT NULL THEN final_score := final_score + 10; END IF;
  
  RETURN GREATEST(10, LEAST(100, final_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Recriar Busca Segura (Resetando assinatura para evitar conflitos)
DROP FUNCTION IF EXISTS public.search_users_safe(UUID,INT,INT,FLOAT);
DROP FUNCTION IF EXISTS public.search_users_safe(UUID,INT,INT,FLOAT,TEXT,TEXT,INT,TEXT,TEXT[]);
DROP FUNCTION IF EXISTS public.search_users_safe(UUID,INT,INT,FLOAT,TEXT,TEXT,TEXT,INT,TEXT,TEXT[]);
DROP FUNCTION IF EXISTS public.search_users_safe(uuid,integer,integer,double precision,text,text,text,text,integer,text,text[]);

CREATE OR REPLACE FUNCTION public.search_users_safe(
  p_user_id    UUID,
  p_min_age    INT     DEFAULT 18,
  p_max_age    INT     DEFAULT 99,
  p_max_dist   FLOAT   DEFAULT 100,
  p_type       TEXT    DEFAULT 'all',
  p_gender     TEXT    DEFAULT 'all',
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
  last_active      TIMESTAMPTZ, is_human BOOLEAN
) AS $$
DECLARE 
  u_lat NUMERIC; 
  u_lon NUMERIC;
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
    -- Filtros de IA/Humanos
    AND (p_type = 'all' OR (p_type = 'human' AND u.is_human = TRUE) OR (p_type = 'ai' AND u.is_human = FALSE))
    -- Filtro de Gênero
    AND (p_gender = 'all' OR u.gender = p_gender)
    -- Demais Filtros
    AND (p_hair_color = 'Qualquer' OR u.hair_color = p_hair_color)
    AND (p_eyes_color = 'Qualquer' OR u.eyes_color = p_eyes_color)
    AND u.height >= p_min_height
    AND (p_education = 'Qualquer' OR u.education = p_education)
    -- Distância
    AND public.calculate_distance(u_lat, u_lon, u.latitude, u.longitude) <= p_max_dist
    -- Excluir interações existentes
    AND NOT EXISTS (SELECT 1 FROM public.likes l WHERE l.user_id = p_user_id AND l.liked_user_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM public.matches m WHERE
      (m.user1_id = p_user_id AND m.user2_id = u.id) OR
      (m.user1_id = u.id AND m.user2_id = p_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
