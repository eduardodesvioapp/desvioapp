-- =========================================================
-- 💣 NUKE & REBUILD — DESVIO
-- ATENÇÃO: Apaga TODOS os dados. Use só em dev/staging.
-- Execute na ordem: este arquivo → schema.sql
-- =========================================================

-- 1. REMOVER TRIGGERS
DROP TRIGGER IF EXISTS tr_update_profile_score         ON public.users;
DROP TRIGGER IF EXISTS tr_filter_messages              ON public.messages;
DROP TRIGGER IF EXISTS tr_handle_new_like              ON public.likes;
DROP TRIGGER IF EXISTS tr_new_like_notification        ON public.likes;
DROP TRIGGER IF EXISTS tr_new_match_notification       ON public.matches;
DROP TRIGGER IF EXISTS tr_new_visit_notification       ON public.profile_visits;
DROP TRIGGER IF EXISTS tr_gallery_access_notification  ON public.gallery_access_requests;
DROP TRIGGER IF EXISTS tr_gallery_approval_notification ON public.gallery_access_requests;
DROP TRIGGER IF EXISTS tr_handle_like_status_change    ON public.likes;
DROP TRIGGER IF EXISTS tr_new_match_notification       ON public.matches;

-- 2. REMOVER FUNÇÕES
DROP FUNCTION IF EXISTS public.calculate_profile_score()          CASCADE;
DROP FUNCTION IF EXISTS public.filter_contact_info()              CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_like()                  CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_like_notification()     CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_match_notification()    CASCADE;
DROP FUNCTION IF EXISTS public.handle_like_status_change()        CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_visit_notification()    CASCADE;
DROP FUNCTION IF EXISTS public.handle_gallery_access_notification() CASCADE;
DROP FUNCTION IF EXISTS public.handle_gallery_approval_notification() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance(FLOAT,FLOAT,FLOAT,FLOAT) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_resonance(UUID,UUID)     CASCADE;
DROP FUNCTION IF EXISTS public.get_safe_distance(UUID)            CASCADE;
DROP FUNCTION IF EXISTS public.check_user_has_private_gallery(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.search_users_safe(UUID,INT,INT,FLOAT,TEXT,TEXT,INT,TEXT,TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(UUID)                      CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_active_reports()         CASCADE;
DROP FUNCTION IF EXISTS public.trigger_safety_alerts()         CASCADE;

-- 3. REMOVER TABELAS (ordem respeitando FKs)
DROP TABLE IF EXISTS public.reports                 CASCADE;
DROP TABLE IF EXISTS public.gallery_access_requests CASCADE;
DROP TABLE IF EXISTS public.notifications           CASCADE;
DROP TABLE IF EXISTS public.profile_visits          CASCADE;
DROP TABLE IF EXISTS public.messages                CASCADE;
DROP TABLE IF EXISTS public.matches                 CASCADE;
DROP TABLE IF EXISTS public.likes                   CASCADE;
DROP TABLE IF EXISTS public.user_interests          CASCADE;
DROP TABLE IF EXISTS public.interests               CASCADE;
DROP TABLE IF EXISTS public.user_media              CASCADE;
DROP TABLE IF EXISTS public.login_activity          CASCADE;
DROP TABLE IF EXISTS public.emergency_contacts      CASCADE;
DROP TABLE IF EXISTS public.verification_requests   CASCADE;
DROP TABLE IF EXISTS public.safety_alerts           CASCADE;
DROP TABLE IF EXISTS public.users                   CASCADE;

-- =========================================================
-- Após executar este script, execute prd/schema.sql
-- =========================================================
