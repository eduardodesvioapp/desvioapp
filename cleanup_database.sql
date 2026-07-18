-- =========================================================
-- DESVIO - LIMPEZA COMPLETA DO BANCO DE DADOS
-- ⚠️ Execute BLOCO POR BLOCO no SQL Editor.
-- =========================================================

-- =========================================================
-- BLOCO 1: TRIGGERS
-- =========================================================
DROP TRIGGER IF EXISTS tr_update_profile_score ON users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_like_notification ON likes CASCADE;
DROP TRIGGER IF EXISTS on_match_notification ON matches CASCADE;
DROP TRIGGER IF EXISTS on_visit_notification ON profile_visits CASCADE;
DROP TRIGGER IF EXISTS on_gallery_request ON gallery_access_requests CASCADE;
DROP TRIGGER IF EXISTS on_gallery_approval ON gallery_access_requests CASCADE;
DROP TRIGGER IF EXISTS on_new_like_match ON likes CASCADE;
DROP TRIGGER IF EXISTS on_ai_auto_like ON likes CASCADE;
DROP TRIGGER IF EXISTS on_message_resolve_receiver ON messages CASCADE;
DROP TRIGGER IF EXISTS on_enqueue_ai_response ON messages CASCADE;
DROP TRIGGER IF EXISTS filter_contact_info_trigger ON messages CASCADE;

-- =========================================================
-- BLOCO 2: TABELAS (ordem importa por causa de FK)
-- =========================================================
DROP TABLE IF EXISTS public.ai_chat_queue CASCADE;
DROP TABLE IF EXISTS public.ai_generation_logs CASCADE;
DROP TABLE IF EXISTS public.secrets CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.user_balances CASCADE;
DROP TABLE IF EXISTS public.safety_alerts CASCADE;
DROP TABLE IF EXISTS public.verification_requests CASCADE;
DROP TABLE IF EXISTS public.emergency_contacts CASCADE;
DROP TABLE IF EXISTS public.login_activity CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.gallery_access_requests CASCADE;
DROP TABLE IF EXISTS public.profile_visits CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.user_interests CASCADE;
DROP TABLE IF EXISTS public.interests CASCADE;
DROP TABLE IF EXISTS public.user_media CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =========================================================
-- BLOCO 3: FUNÇÕES
-- =========================================================
DROP FUNCTION IF EXISTS public.calculate_distance(float, float, float, float) CASCADE;
DROP FUNCTION IF EXISTS public.get_safe_distance(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_has_private_gallery(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_active_reports() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_safety_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_resonance(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.search_users_safe(uuid, int, int, float, text, text, text[], text[], text[], text[], int, int, int, int) CASCADE;
DROP FUNCTION IF EXISTS public.filter_contact_info() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_profile_score() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_like_notification() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_match_notification() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_visit_notification() CASCADE;
DROP FUNCTION IF EXISTS public.handle_gallery_access_notification() CASCADE;
DROP FUNCTION IF EXISTS public.handle_gallery_approval_notification() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_like() CASCADE;
DROP FUNCTION IF EXISTS public.handle_like(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_ai_auto_like_back() CASCADE;
DROP FUNCTION IF EXISTS public.resolve_message_receiver() CASCADE;
DROP FUNCTION IF EXISTS public.enqueue_ai_response() CASCADE;
DROP FUNCTION IF EXISTS public.call_gemini(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.spawn_synthetic_user(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.generate_unique_referral_code() CASCADE;
DROP FUNCTION IF EXISTS public.execute_credit_transaction(uuid, int, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.claim_daily_bonus(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.redeem_referral_code(uuid, varchar) CASCADE;
DROP FUNCTION IF EXISTS public.check_and_complete_referral_manual(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_user_settings() CASCADE;

-- =========================================================
-- BLOCO 4: TIPOS ENUM
-- =========================================================
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.referral_status CASCADE;

-- =========================================================
-- BLOCO 5: POLICIES (RLS)
-- =========================================================
DO $$ DECLARE r RECORD; BEGIN
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- =========================================================
-- BLOCO 6: STORAGE
-- =========================================================
DELETE FROM storage.objects WHERE bucket_id IN ('media', 'avatars');
DELETE FROM storage.buckets WHERE id IN ('media', 'avatars');

-- =========================================================
-- BLOCO 7: PUBLICATIONS
-- =========================================================
DROP PUBLICATION IF EXISTS supabase_realtime;

-- =========================================================
-- BLOCO 8: AUTH.USERS
-- =========================================================
DELETE FROM auth.users;

-- =========================================================
-- FIM
-- =========================================================
SELECT '✅ LIMPEZA COMPLETA. Execute: new_installation_create_user_admin.sql' AS resultado;