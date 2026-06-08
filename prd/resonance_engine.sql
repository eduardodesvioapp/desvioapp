-- =========================================================
-- ⚛️ MOTOR DE RESSONÂNCIA (COMPATIBILIDADE DINÂMICA)
-- Algoritmo de Afinidade Baseado em Interesses e IA
-- =========================================================

-- 1. Função de Cálculo de Ressonância
CREATE OR REPLACE FUNCTION calculate_resonance(user_a UUID, user_b UUID)
RETURNS INT AS $$
DECLARE
    final_score INT := 40; -- Base de "vibe" mínima
    interest_match INT;
    vector_match FLOAT;
    u1 users;
    u2 users;
BEGIN
    -- Busca dados dos usuários para comparação direta
    SELECT * INTO u1 FROM users WHERE id = user_a;
    SELECT * INTO u2 FROM users WHERE id = user_b;

    -- Se algum usuário não for encontrado, retorna base neutra
    IF u1.id IS NULL OR u2.id IS NULL THEN
        RETURN 50;
    END IF;

    -- [A] INTERESSES EM COMUM (+10 pontos por tag, máx 30)
    -- Compara a tabela de junção user_interests
    SELECT count(*) INTO interest_match
    FROM user_interests a
    JOIN user_interests b ON a.interest_id = b.interest_id
    WHERE a.user_id = user_a AND b.user_id = user_b;
    
    final_score := final_score + (interest_match * 10);

    -- [B] SIMILARIDADE SEMÂNTICA / IA (máx +20)
    -- Se ambos tiverem embeddings gerados pela bio/perfil
    IF u1.compatibility_embedding IS NOT NULL AND u2.compatibility_embedding IS NOT NULL THEN
        -- O operador <=> calcula a distância do cosseno.
        -- 1 - (distância / 2) nos dá a similaridade normalizada.
        vector_match := (1 - (u1.compatibility_embedding <=> u2.compatibility_embedding)) * 20;
        final_score := final_score + COALESCE(vector_match, 0)::INT;
    END IF;

    -- [C] BÔNUS DE PROXIMIDADE GEOGRÁFICA (+10 se mesma cidade)
    IF u1.city = u2.city AND u1.city IS NOT NULL THEN
        final_score := final_score + 10;
    END IF;

    -- [D] BÔNUS DE SCORE DE PERFIL (+10 se ambos tiverem perfis completos/confiáveis)
    IF u1.profile_score >= 90 AND u2.profile_score >= 90 THEN
        final_score := final_score + 10;
    END IF;

    -- Normaliza o resultado entre 0 e 100
    RETURN GREATEST(10, LEAST(100, final_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Atualizando a Busca Segura para usar Ressonância Real
-- Substituímos o random() pelo cálculo dinâmico
CREATE OR REPLACE FUNCTION search_users_safe(
  p_user_id UUID,
  p_min_age INT,
  p_max_age INT,
  p_max_dist FLOAT,
  p_hair_color TEXT DEFAULT 'Qualquer',
  p_eyes_color TEXT DEFAULT 'Qualquer',
  p_min_height INT DEFAULT 140,
  p_education TEXT DEFAULT 'Qualquer',
  p_lifestyle TEXT[] DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  age INT,
  bio TEXT,
  gender TEXT,
  city TEXT,
  profile_score INT,
  profile_image_url TEXT,
  occupation TEXT,
  height INT,
  hair_color TEXT,
  eyes_color TEXT,
  compatibility INT, -- Agora é a Ressonância Real
  km_away FLOAT,
  last_active TIMESTAMP
) AS $$
DECLARE
    u_lat FLOAT;
    u_lon FLOAT;
BEGIN
    -- Busca coordenadas do usuário logado
    SELECT latitude, longitude INTO u_lat, u_lon FROM users WHERE users.id = p_user_id;

    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.age,
        u.bio,
        u.gender,
        u.city,
        u.profile_score,
        u.profile_image_url,
        u.occupation,
        u.height,
        u.hair_color,
        u.eyes_color,
        calculate_resonance(p_user_id, u.id) as compatibility,
        calculate_distance(u_lat, u_lon, u.latitude, u.longitude) as km_away,
        u.last_active
    FROM users u
    WHERE u.id != p_user_id
      AND u.age BETWEEN p_min_age AND p_max_age
      AND (p_hair_color = 'Qualquer' OR u.hair_color = p_hair_color)
      AND (p_eyes_color = 'Qualquer' OR u.eyes_color = p_eyes_color)
      AND (u.height >= p_min_height)
      AND (p_education = 'Qualquer' OR u.education = p_education)
      AND (calculate_distance(u_lat, u_lon, u.latitude, u.longitude) <= p_max_dist);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
