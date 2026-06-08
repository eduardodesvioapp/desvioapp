-- 1. Tabela de Notificações Centralizada
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'match', 'like', 'visit', 'message'
  title text NOT NULL,
  content text,
  link text,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Gatilho para Match (Amizade Iniciada)
CREATE OR REPLACE FUNCTION public.handle_new_match_notification()
RETURNS TRIGGER AS $$
DECLARE
  u1_name text;
  u2_name text;
BEGIN
  SELECT name INTO u1_name FROM public.users WHERE id = NEW.user1_id;
  SELECT name INTO u2_name FROM public.users WHERE id = NEW.user2_id;

  -- Notificação para o User 1
  INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
  VALUES (
    NEW.user1_id, 'match', 'Amizade Iniciada!', 
    u2_name || ' curtiu seu perfil de volta. Comece um papo!', 
    '/chat/' || NEW.id,
    jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user2_id)
  );

  -- Notificação para o User 2
  INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
  VALUES (
    NEW.user2_id, 'match', 'Amizade Iniciada!', 
    u1_name || ' curtiu seu perfil de volta. Comece um papo!', 
    '/chat/' || NEW.id,
    jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user1_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Gatilho para Novo Like (Interesse)
CREATE OR REPLACE FUNCTION public.handle_new_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
  VALUES (
    NEW.liked_user_id, 'like', 'Novo Interesse!', 
    'Alguém curtiu seu perfil. Veja quem é!', 
    '/likedme',
    jsonb_build_object('author_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Gatilho para Visita de Perfil
CREATE OR REPLACE FUNCTION public.handle_new_visit_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
  VALUES (
    NEW.visited_id, 'visit', 'Nova Visita!', 
    'Alguém acabou de olhar seu dossiê.', 
    '/visitors',
    jsonb_build_object('visitor_id', NEW.visitor_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atribuição dos Gatilhos
DROP TRIGGER IF EXISTS tr_new_match_notification ON public.matches;
CREATE TRIGGER tr_new_match_notification
AFTER UPDATE OF status ON public.matches
FOR EACH ROW WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
EXECUTE FUNCTION public.handle_new_match_notification();

DROP TRIGGER IF EXISTS tr_new_like_notification ON public.likes;
CREATE TRIGGER tr_new_like_notification
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_new_like_notification();

DROP TRIGGER IF EXISTS tr_new_visit_notification ON public.profile_visits;
CREATE TRIGGER tr_new_visit_notification
AFTER INSERT ON public.profile_visits
FOR EACH ROW EXECUTE FUNCTION public.handle_new_visit_notification();

-- 8. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
