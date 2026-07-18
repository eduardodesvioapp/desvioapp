-- =========================================================
-- 💣 NUKE COMPLETO — DESVIO
-- ATENÇÃO: Apaga TODOS os dados. Use só em dev/staging.
-- Execute na ordem: nuke_complete → schema.sql
-- =========================================================

-- 0. DESABILITAR REALTIME
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
    LOOP
        EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.' || quote_ident(r.tablename);
    END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

-- 1. REMOVER TODOS OS TRIGGERS DO SCHEMA PUBLIC
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT t.tgname, c.relname FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND NOT t.tgisinternal
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON public.' || quote_ident(r.relname) || ' CASCADE';
    END LOOP;
END$$;

-- 2. REMOVER TODAS AS FUNÇÕES DO SCHEMA PUBLIC (exclui funções de extensões)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT p.oid, p.proname
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_depend d
            JOIN pg_extension e ON d.refobjid = e.oid
            WHERE d.objid = p.oid AND d.classid = 'pg_proc'::regclass
        )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
END$$;

-- 3. REMOVER TODAS AS TABELAS (ordem respeitando FKs)
DROP TABLE IF EXISTS public.ai_chat_queue              CASCADE;
DROP TABLE IF EXISTS public.secrets                     CASCADE;
DROP TABLE IF EXISTS public.referrals                   CASCADE;
DROP TABLE IF EXISTS public.credit_transactions         CASCADE;
DROP TABLE IF EXISTS public.user_balances               CASCADE;
DROP TABLE IF EXISTS public.user_settings               CASCADE;
DROP TABLE IF EXISTS public.reports                     CASCADE;
DROP TABLE IF EXISTS public.gallery_access_requests     CASCADE;
DROP TABLE IF EXISTS public.notifications               CASCADE;
DROP TABLE IF EXISTS public.profile_visits              CASCADE;
DROP TABLE IF EXISTS public.messages                    CASCADE;
DROP TABLE IF EXISTS public.matches                     CASCADE;
DROP TABLE IF EXISTS public.likes                       CASCADE;
DROP TABLE IF EXISTS public.user_interests              CASCADE;
DROP TABLE IF EXISTS public.interests                   CASCADE;
DROP TABLE IF EXISTS public.user_media                  CASCADE;
DROP TABLE IF EXISTS public.login_activity              CASCADE;
DROP TABLE IF EXISTS public.emergency_contacts          CASCADE;
DROP TABLE IF EXISTS public.verification_requests       CASCADE;
DROP TABLE IF EXISTS public.safety_alerts               CASCADE;
DROP TABLE IF EXISTS public.users                       CASCADE;

-- 4. REMOVER TIPOS ENUM
DROP TYPE IF EXISTS transaction_type  CASCADE;
DROP TYPE IF EXISTS referral_status   CASCADE;

-- 5. REMOVER EXTENSÕES (opcional - descomente se necessário)
-- DROP EXTENSION IF EXISTS "vector"      CASCADE;
-- DROP EXTENSION IF EXISTS "http"        CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto"    CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp"   CASCADE;

-- 6. LIMPAR USERS DO AUTH (CUIDADO - irreversível!)
-- Descomente para deletar TODOS os usuários autenticados:
-- DELETE FROM auth.users;

-- =========================================================
-- ✅ PRONTO! Execute em seguida: prd/schema.sql
-- =========================================================
