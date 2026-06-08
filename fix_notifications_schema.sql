-- Fix missing 'link' column in notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;

-- Re-apply gallery notifications triggers (now with correct columns)
-- Function to handle gallery access request notifications
CREATE OR REPLACE FUNCTION public.handle_gallery_access_notification()
RETURNS TRIGGER AS $$
DECLARE requester_name text;
BEGIN
  -- Get requester name
  SELECT name INTO requester_name FROM public.users WHERE id = NEW.requester_id;
  
  -- Create notification for the owner
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (
    NEW.owner_id, 
    'gallery_request', 
    'Acesso à Galeria', 
    requester_name || ' solicitou acesso à sua galeria privada.', 
    '/user/' || NEW.owner_id
  );
  
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new gallery access requests
DROP TRIGGER IF EXISTS tr_gallery_access_notification ON public.gallery_access_requests;
CREATE TRIGGER tr_gallery_access_notification 
AFTER INSERT ON public.gallery_access_requests 
FOR EACH ROW EXECUTE FUNCTION public.handle_gallery_access_notification();

-- Function to handle gallery access approval notifications
CREATE OR REPLACE FUNCTION public.handle_gallery_approval_notification()
RETURNS TRIGGER AS $$
DECLARE owner_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    -- Get owner name
    SELECT name INTO owner_name FROM public.users WHERE id = NEW.owner_id;
    
    -- Create notification for the requester
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      NEW.requester_id, 
      'gallery_approved', 
      'Acesso Concedido', 
      owner_name || ' aprovou seu acesso à galeria privada.', 
      '/user/' || NEW.owner_id
    );
  END IF;
  
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for gallery access approval
DROP TRIGGER IF EXISTS tr_gallery_approval_notification ON public.gallery_access_requests;
CREATE TRIGGER tr_gallery_approval_notification 
AFTER UPDATE OF status ON public.gallery_access_requests 
FOR EACH ROW EXECUTE FUNCTION public.handle_gallery_approval_notification();
