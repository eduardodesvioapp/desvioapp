-- =========================================================
-- 🤖 FIX DEFINITIVO: MATCH AUTOMÁTICO E NOTIFICAÇÃO
-- =========================================================

-- 1. Ajuste na Função de Notificação para suportar INSERT e UPDATE
CREATE OR REPLACE FUNCTION public.handle_new_match_notification()
RETURNS TRIGGER AS $$
DECLARE u1_name TEXT; u2_name TEXT;
BEGIN
  -- Lógica de filtro que antes estava no WHEN
  -- Só prossegue se for um match aceito e se for novo (INSERT) ou se mudou para aceito (UPDATE)
  IF (NEW.status = 'accepted') AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'accepted')) THEN
    SELECT name INTO u1_name FROM public.users WHERE id = NEW.user1_id;
    SELECT name INTO u2_name FROM public.users WHERE id = NEW.user2_id;
    
    INSERT INTO public.notifications (user_id, type, title, content, link, metadata)
    VALUES
      (NEW.user1_id, 'match', 'Match!', u2_name || ' curtiu de volta!', '/chat/' || NEW.id,
        jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user2_id)),
      (NEW.user2_id, 'match', 'Match!', u1_name || ' curtiu de volta!', '/chat/' || NEW.id,
        jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user1_id));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger de Notificação simplificado (sem WHEN complexo)
DROP TRIGGER IF EXISTS tr_new_match_notification ON public.matches;
CREATE TRIGGER tr_new_match_notification
  AFTER INSERT OR UPDATE OF status ON public.matches
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_match_notification();

-- 3. Função de Auto Match IA
CREATE OR REPLACE FUNCTION public.handle_ai_auto_like_back()
RETURNS TRIGGER AS $$
DECLARE
    v_target_is_ai BOOLEAN;
BEGIN
    SELECT NOT is_human INTO v_target_is_ai FROM public.users WHERE id = NEW.liked_user_id;
    IF v_target_is_ai = TRUE THEN
        INSERT INTO public.matches (user1_id, user2_id, status)
        VALUES (LEAST(NEW.user_id, NEW.liked_user_id), GREATEST(NEW.user_id, NEW.liked_user_id), 'accepted')
        ON CONFLICT (user1_id, user2_id) DO UPDATE SET status = 'accepted';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger de Auto Like
DROP TRIGGER IF EXISTS tr_ai_auto_like_back ON public.likes;
CREATE TRIGGER tr_ai_auto_like_back
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_ai_auto_like_back();
