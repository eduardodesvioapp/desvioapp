-- Migration: Add user_media table for gallery management

-- 1. Create the table
CREATE TABLE IF NOT EXISTS user_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_profile BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add RLS policies
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own media
CREATE POLICY "Users can view their own media" 
ON user_media FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to upload their own media
CREATE POLICY "Users can insert their own media" 
ON user_media FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own media
CREATE POLICY "Users can delete their own media" 
ON user_media FOR DELETE 
USING (auth.uid() = user_id);

-- Public media can be viewed by everyone (only public ones)
CREATE POLICY "Public media is visible to everyone" 
ON user_media FOR SELECT 
USING (is_private = false);

-- 3. Storage Bucket Instructions (Run this in the Supabase Dashboard)
-- Go to Storage -> New Bucket -> Name: "media" -> Public: Yes (for public gallery)
-- OR Name: "avatars" for profile pics. Let's use "media".
