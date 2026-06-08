-- =========================================================
-- 🔧 FIX - REMOVE ALL HOOKS AND TRIGGERS
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. List ALL functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- 2. List ALL triggers on auth schema
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth';

-- 3. Delete every trigger function we created (match_trigger, create_match, etc)
DROP FUNCTION IF EXISTS public.create_match();
DROP FUNCTION IF EXISTS public.create_user_settings();
DROP TRIGGER IF EXISTS match_trigger ON likes;
DROP TRIGGER IF EXISTS match_trigger ON auth.users;
DROP TRIGGER IF EXISTS user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS user_settings_trigger ON users;

-- 4. Check for postgres hooks (new Supabase feature)
-- Run this to see hooks:
-- SELECT * FROM postgres.hooks;

-- 5. If using hooks, delete them:
-- DROP HOOK IF EXISTS auth.on_authenticated_user_created;

-- 6. Finally, ensure basic structure
-- This is a minimal approach - let your app handle everything
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  name text DEFAULT 'Anonimo',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Simple RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Settings are private" ON user_settings FOR ALL USING (auth.uid() = user_id);

SELECT 'All hooks/triggers removed + clean tables!' as status;