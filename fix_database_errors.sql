-- 1. Corrige o erro 400 do login_activity adicionando a coluna ausente
ALTER TABLE public.login_activity 
ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'LOGIN';

-- 2. Permite que os usuários insiram logs de atividade (corrige erro de RLS)
DROP POLICY IF EXISTS "login_act_insert_own" ON public.login_activity;
CREATE POLICY "login_act_insert_own" ON public.login_activity FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Garante que as tabelas do chat estão no canal de Realtime do Supabase
-- Abordagem segura compatível com todas as versões do PostgreSQL
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.users,
    public.likes,
    public.matches,
    public.profile_visits,
    public.messages,
    public.notifications,
    public.gallery_access_requests,
    public.ai_chat_queue;
