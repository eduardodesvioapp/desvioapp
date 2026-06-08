-- =========================================================
-- 🔧 PATCH: Adiciona RPC handle_like (chamada por LikedButton)
-- =========================================================
-- Erro: PGRST202 - function public.handle_like does not exist
-- Causa: O frontend chama supabase.rpc('handle_like', { p_target_user_id })
--        mas a função não foi criada no new_installation.sql.
-- =========================================================

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
     WHERE (user_id = v_my_id          AND liked_user_id = p_target_user_id)
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

GRANT EXECUTE ON FUNCTION public.handle_like(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
