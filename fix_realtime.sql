-- Garante que a tabela messages (e outras) estão na publicação do Realtime
BEGIN;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes, public.matches, public.profile_visits, public.messages, public.notifications, public.users;
