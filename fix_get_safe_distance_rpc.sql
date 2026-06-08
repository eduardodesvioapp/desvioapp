-- Improved distance calculation with precision protection
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric AS $$
DECLARE
    dist numeric;
BEGIN
    -- Protection against acos precision errors (prevents 400 Bad Request)
    dist := 6371 * acos(
        LEAST(1.0, GREATEST(-1.0, 
            cos(radians(lat1)) * cos(radians(lat2)) * 
            cos(radians(lon2) - radians(lon1)) + 
            sin(radians(lat1)) * sin(radians(lat2))
        ))
    );
    RETURN dist;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Improved safe distance RPC
CREATE OR REPLACE FUNCTION public.get_safe_distance(target_user_id uuid)
RETURNS numeric AS $$
DECLARE
    v_my_lat numeric; v_my_lon numeric;
    v_target_lat numeric; v_target_lon numeric;
    v_show_distance boolean;
BEGIN
    -- 1. Check privacy
    SELECT show_distance INTO v_show_distance FROM public.user_settings WHERE user_id = target_user_id;
    IF v_show_distance = false THEN RETURN NULL; END IF;

    -- 2. Get coords
    SELECT latitude, longitude INTO v_my_lat, v_my_lon FROM public.users WHERE id = auth.uid();
    SELECT latitude, longitude INTO v_target_lat, v_target_lon FROM public.users WHERE id = target_user_id;

    -- 3. Validate
    IF v_my_lat IS NULL OR v_my_lon IS NULL OR v_target_lat IS NULL OR v_target_lon IS NULL THEN
        RETURN NULL;
    END IF;

    -- 4. Calculate
    RETURN public.calculate_distance(v_my_lat, v_my_lon, v_target_lat, v_target_lon);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
