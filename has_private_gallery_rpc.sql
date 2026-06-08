CREATE OR REPLACE FUNCTION public.check_user_has_private_gallery(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  has_private boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_media 
    WHERE user_id = p_user_id 
      AND is_private = true
  ) INTO has_private;
  
  RETURN has_private;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
