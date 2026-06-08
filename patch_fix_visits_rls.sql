-- =========================================================
-- 🔧 PATCH: Corrige policy de UPDATE em profile_visits
-- =========================================================
-- Erro: 42501 - new row violates row-level security policy
-- Causa: A policy de UPDATE exigia auth.uid() = visited_id
--        (pessoa visitada), mas quem precisa atualizar o
--        last_visit_at é o VISITANTE ao revisitar o perfil.
-- =========================================================

-- 1. Remove a policy errada
DROP POLICY IF EXISTS "visits_update" ON public.profile_visits;

-- 2. Recria permitindo o visitante atualizar (e apenas ele)
CREATE POLICY "visits_update"
    ON public.profile_visits FOR UPDATE
    USING      (auth.uid() = visitor_id)
    WITH CHECK (auth.uid() = visitor_id);

-- 3. Recarrega o schema do PostgREST
NOTIFY pgrst, 'reload schema';
