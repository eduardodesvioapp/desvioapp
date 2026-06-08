-- Add policy to allow permitted users to view private media
CREATE POLICY "view_private_media_if_approved" 
ON public.user_media FOR SELECT 
USING (
  is_private = false OR 
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.gallery_access_requests 
    WHERE requester_id = auth.uid() 
      AND owner_id = user_media.user_id 
      AND status = 'approved'
  )
);

-- Note: We should probably drop the old "view_public_media" if we are using this broader one
DROP POLICY IF EXISTS "view_public_media" ON public.user_media;
