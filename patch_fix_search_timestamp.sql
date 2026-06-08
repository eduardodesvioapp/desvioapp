-- =========================================================
-- 🔧 PATCH: Corrige erro 42804 em search_users_safe
-- =========================================================
-- Erro: "Returned type timestamp without time zone does not
--        match expected type timestamp with time zone"
-- Causa: users.last_active é TIMESTAMP mas a função declara TIMESTAMPTZ
-- Solução: recriar a função com cast explícito + grants + reload cache
-- =========================================================

-- 1. Remove versões antigas (todas as assinaturas)
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure AS sig
              FROM pg_proc
              WHERE proname = 'search_users_safe'
                AND pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

-- 2. Recria com cast em last_active
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
            u.last_active::TIMESTAMPTZ AS last_active,
            u.is_human
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

-- 3. Garante permissão de execução
GRANT EXECUTE ON FUNCTION public.search_users_safe(
    UUID, INT, INT, FLOAT, TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], INT, INT, INT, INT
) TO authenticated, anon;

-- 4. Força PostgREST a recarregar o schema (mata o cache)
NOTIFY pgrst, 'reload schema';

-- 5. Teste rápido (cole o UUID do seu admin)
-- SELECT * FROM public.search_users_safe(
--     p_user_id  := 'COLE-UUID-AQUI',
--     p_min_age  := 18,
--     p_max_age  := 99,
--     p_max_dist := 100
-- );
