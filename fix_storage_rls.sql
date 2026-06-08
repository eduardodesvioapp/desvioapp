-- =========================================================
-- STORAGE BUCKETS AND RLS POLICIES
-- =========================================================

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policies for 'media' bucket
-- Allow users to upload files to their own folder
CREATE POLICY "Allow users to upload to their own media folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update/delete their own files
CREATE POLICY "Allow users to manage their own media files" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public viewing of media files
CREATE POLICY "Allow public viewing of media files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

-- 4. Policies for 'avatars' bucket
-- Allow users to upload to their own avatars folder
CREATE POLICY "Allow users to upload to their own avatars folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to manage their own avatars
CREATE POLICY "Allow users to manage their own avatars" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public viewing of avatars
CREATE POLICY "Allow public viewing of avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');
