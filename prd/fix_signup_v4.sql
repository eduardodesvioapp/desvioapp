-- =========================================================
-- 🔧 COMPLETE RESET - Remove EVERYTHING
-- Run this LAST RESORT in Supabase SQL Editor
-- =========================================================

-- Delete ALL triggers in entire database
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT trigger_name, event_object_table, event_object_schema
    FROM information_schema.triggers
    WHERE event_object_schema IN ('public', 'auth')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', r.trigger_name, r.event_object_schema, r.event_object_table);
  END LOOP;
END $$;

-- Delete ALL functions we created
DROP FUNCTION IF EXISTS public.create_match();
DROP FUNCTION IF EXISTS public.create_user_settings();
DROP FUNCTION IF EXISTS public.get_feed(uuid);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Reset everything
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Fresh start
CREATE TABLE users (
  id uuid PRIMARY KEY,
  name text DEFAULT 'Anonimo'
);

CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- No RLS while debugging (re-enable after)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

SELECT 'Complete reset done!' as status;