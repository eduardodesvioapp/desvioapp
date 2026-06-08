-- =========================================================
-- 🚀 ATUALIZAÇÃO: BUSCA SEGURA COM FILTRO TOTAL (v3 - NUCLEAR)
-- Suporte a todos os filtros físicos e compatibilidade.
-- =========================================================

-- Limpeza nuclear de todas as versões anteriores
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Limpa busca
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'search_users_safe' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
    
    -- Limpa ressonância
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'calculate_resonance' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;

    -- Limpa distância
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'calculate_distance' AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

-- 1. Função de Distância (Haversine)
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 float8, lon1 float8, lat2 float8, lon2 float8)
RETURNS float8 AS $$
DECLARE
    R float8 := 6371; -- Raio da Terra em km
    dLat float8 := radians(lat2 - lat1);
    dLon float8 := radians(lon2 - lon1);
    a float8;
    c float8;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN RETURN 0; END IF;
    a := sin(dLat/2) * sin(dLat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Garantir que a função de ressonância exista
CREATE OR REPLACE FUNCTION public.calculate_resonance(u1_id UUID, u2_id UUID)
RETURNS INT AS $$
DECLARE
    score INT := 0;
    shared_count INT;
BEGIN
    IF u1_id IS NULL OR u2_id IS NULL THEN RETURN 50; END IF;
    
    -- 1. Base Determinística (40-60%) para evitar 0 total
    score := 40 + (abs(hashtext(u1_id::text || u2_id::text)) % 20);
    
    -- 2. Bônus por Interesses (até 40%)
    SELECT COUNT(*) INTO shared_count
    FROM public.user_interests ui1
    JOIN public.user_interests ui2 ON ui1.interest_id = ui2.interest_id
    WHERE ui1.user_id = u1_id AND ui2.user_id = u2_id;
    
    score := score + (shared_count * 15);
    
    RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.search_users_safe(
  p_user_id      UUID,
  p_min_age      INT,
  p_max_age      INT,
  p_max_dist     FLOAT,
  p_type         TEXT     DEFAULT 'all',
  p_gender       TEXT     DEFAULT 'all',
  p_hair_colors  TEXT[]   DEFAULT '{}',
  p_eyes_colors  TEXT[]   DEFAULT '{}',
  p_skin_colors  TEXT[]   DEFAULT '{}',
  p_weights      TEXT[]   DEFAULT '{}',
  p_min_height   INT      DEFAULT 140,
  p_max_height   INT      DEFAULT 220,
  p_min_compat   INT      DEFAULT 0,
  p_max_compat   INT      DEFAULT 100
)
RETURNS TABLE (
  id               UUID, name TEXT, age INT, bio TEXT, gender TEXT, city TEXT,
  profile_score    INT,  profile_image_url TEXT, occupation TEXT, height INT,
  hair_color       TEXT, eyes_color TEXT, skin_color TEXT, weight TEXT, 
  compatibility    INT, km_away FLOAT8, last_active TIMESTAMPTZ, is_human BOOLEAN
) AS $$
DECLARE u_lat FLOAT8; u_lon FLOAT8;
BEGIN
  SELECT latitude, longitude INTO u_lat, u_lon FROM public.users WHERE users.id = p_user_id;
  
  RETURN QUERY
  SELECT * FROM (
    SELECT
      u.id, u.name, u.age, u.bio, u.gender, u.city, u.profile_score,
      u.profile_image_url, u.occupation, u.height, u.hair_color, u.eyes_color,
      u.skin_color, u.weight,
      public.calculate_resonance(p_user_id, u.id) as res,
      public.calculate_distance(u_lat, u_lon, u.latitude, u.longitude) as dist,
      u.last_active, u.is_human
    FROM public.users u
    WHERE u.id != p_user_id
      AND u.age BETWEEN p_min_age AND p_max_age
      AND u.profile_score >= 85
      AND (p_type = 'all' OR (p_type = 'human' AND u.is_human = TRUE) OR (p_type = 'ai' AND u.is_human = FALSE))
      AND (p_gender = 'all' OR u.gender = p_gender)
      AND (p_hair_colors IS NULL OR cardinality(p_hair_colors) = 0 OR u.hair_color = ANY(p_hair_colors))
      AND (p_eyes_colors IS NULL OR cardinality(p_eyes_colors) = 0 OR u.eyes_color = ANY(p_eyes_colors))
      AND (p_skin_colors IS NULL OR cardinality(p_skin_colors) = 0 OR u.skin_color = ANY(p_skin_colors))
      AND (p_weights IS NULL OR cardinality(p_weights) = 0 OR u.weight = ANY(p_weights))
      AND (COALESCE(u.height, 170) BETWEEN p_min_height AND p_max_height)
      AND NOT EXISTS (SELECT 1 FROM public.likes l WHERE l.user_id = p_user_id AND l.liked_user_id = u.id)
      AND NOT EXISTS (SELECT 1 FROM public.matches m WHERE
        (m.user1_id = p_user_id AND m.user2_id = u.id) OR
        (m.user1_id = u.id AND m.user2_id = p_user_id))
  ) sub
  WHERE sub.dist <= p_max_dist
    AND sub.res BETWEEN p_min_compat AND p_max_compat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
