-- =========================================================
-- 👑 CRIAÇÃO DE USUÁRIO ADMINISTRADOR
-- =========================================================
-- ⚠️ IMPORTANTE: O Supabase NÃO permite inserir manualmente
-- em auth.users via SQL (retorna 500). Siga a ordem:
--
--   1. Painel Supabase > Authentication > Users > "Add user"
--      Preencha: Email + Password + "Auto Confirm User" = ON
--      Copie o UUID gerado.
--
--   2. Substitua o UUID abaixo e rode este script.
-- =========================================================

-- 📝 CONFIGURAÇÃO: edite estes valores
DO $$
DECLARE
    v_admin_id    UUID := '00000000-0000-0000-0000-000000000000'; -- ⚠️ COLE O UUID DO PAINEL AQUI
    v_email       TEXT := 'admin@desvio.com';
    v_name        TEXT := 'Administrador';
    v_age         INT  := 30;
    v_gender      TEXT := 'Outro';
    v_city        TEXT := 'Porto Alegre';
    v_lat         NUMERIC := -30.0346;
    v_lng         NUMERIC := -51.2177;
BEGIN
    -- 0. Limpeza defensiva (caso uma execução anterior tenha falhado no meio)
    DELETE FROM public.user_balances   WHERE user_id = v_admin_id;
    DELETE FROM public.user_settings   WHERE user_id = v_admin_id;
    DELETE FROM public.user_interests  WHERE user_id = v_admin_id;
    DELETE FROM public.users           WHERE id = v_admin_id;

    -- 1. Perfil público (id = mesmo UUID do auth.users)
    INSERT INTO public.users (
        id, email, name, age, gender, city,
        latitude, longitude, profile_image_url,
        is_admin, is_human, verification_status,
        last_active, created_at
    )
    VALUES (
        v_admin_id, v_email, v_name, v_age, v_gender, v_city,
        v_lat, v_lng, NULL,
        TRUE, TRUE, 'verified',
        NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        is_admin = TRUE,
        verification_status = 'verified',
        name = EXCLUDED.name,
        email = EXCLUDED.email;

    -- 2. Settings (preferências padrão)
    INSERT INTO public.user_settings (
        user_id, push_messages, push_matches, profile_visible,
        show_distance, max_distance, theme, invisible_mode, is_premium
    )
    VALUES (
        v_admin_id, TRUE, TRUE, TRUE,
        TRUE, 100, 'dark', FALSE, TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Carteira (10 créditos grátis + premium sem expiração)
    INSERT INTO public.user_balances (
        user_id, credits, referral_code, subscription_tier, subscription_expires_at,
        created_at, updated_at
    )
    VALUES (
        v_admin_id, 1000, public.generate_unique_referral_code(), 'premium',
        NOW() + INTERVAL '100 years', NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        credits = 1000,
        subscription_tier = 'premium',
        subscription_expires_at = NOW() + INTERVAL '100 years',
        updated_at = NOW();

    -- 4. Interesses (vincula todos como exemplo)
    INSERT INTO public.user_interests (user_id, interest_id)
    SELECT v_admin_id, id FROM public.interests
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Admin criado/atualizado: % (%)', v_name, v_email;
    RAISE NOTICE '   UUID: %', v_admin_id;
    RAISE NOTICE '   Credenciais: use o email e senha definidos no painel Auth';
END $$;
