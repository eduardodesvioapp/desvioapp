-- Drop the old function first
DROP FUNCTION IF EXISTS public.search_users_safe(uuid, int, int, numeric);

-- Create new version WITHOUT interaction filters (allows seeing already liked/matched users)
CREATE OR REPLACE FUNCTION public.search_users_safe(
    p_user_id uuid,
    p_min_age int,
    p_max_age int,
    p_max_dist numeric
)
RETURNS TABLE (
    id uuid,
    name text,
    age int,
    gender text,
    profile_image_url text,
    bio text,
    height int,
    eyes_color text,
    hair_color text,
    km_away numeric,
    last_active timestamptz,
    compatibility int
) AS $$
#variable_conflict use_column
DECLARE
    v_lat numeric;
    v_lon numeric;
BEGIN
    -- Pega localização do usuário que está buscando
    SELECT latitude, longitude INTO v_lat, v_lon FROM public.users WHERE id = p_user_id;

    RETURN QUERY
    SELECT 
        u.id, 
        u.name, 
        u.age, 
        u.gender, 
        u.profile_image_url, 
        u.bio, 
        u.height, 
        u.eyes_color, 
        u.hair_color,
        CASE 
            WHEN v_lat IS NULL OR v_lon IS NULL OR u.latitude IS NULL OR u.longitude IS NULL THEN 0
            ELSE calculate_distance(v_lat, v_lon, u.latitude, u.longitude)
        END as km_away,
        u.last_active,
        COALESCE(
          (
            SELECT 
              LEAST(99, 60 + (count(ui1.interest_id) * 10))::int
            FROM public.user_interests ui1
            JOIN public.user_interests ui2 ON ui1.interest_id = ui2.interest_id
            WHERE ui1.user_id = p_user_id AND ui2.user_id = u.id
          ),
          (40 + (u.profile_score / 4))::int
        ) as compatibility
    FROM public.users u
    WHERE u.id != p_user_id
      AND u.age BETWEEN p_min_age AND p_max_age
      AND (
          v_lat IS NULL OR v_lon IS NULL OR u.latitude IS NULL OR u.longitude IS NULL
          OR calculate_distance(v_lat, v_lon, u.latitude, u.longitude) <= p_max_dist
      )
    ORDER BY u.last_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
