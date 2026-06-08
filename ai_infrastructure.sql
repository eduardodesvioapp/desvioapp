-- 1. Evolução da Tabela de Usuários
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_human BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ai_config JSONB DEFAULT '{
  "model": "gemini-1.5-flash",
  "personality": "Você é uma pessoa misteriosa e atraente que busca conexões profundas no app Desvio.",
  "temperature": 0.7
}';

CREATE INDEX IF NOT EXISTS idx_users_is_human ON public.users(is_human);

-- 2. Atualização da Função de Busca (RPC)
-- Removendo a antiga para evitar conflitos de assinatura
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
