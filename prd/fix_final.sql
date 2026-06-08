-- =========================================================
-- 🆘 FINAL FIX - Run in SQL Editor
-- =========================================================

-- DROP ALL triggers/functions we created
DROP TRIGGER IF EXISTS match_trigger ON likes;
DROP TRIGGER IF EXISTS user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS user_settings_trigger ON users;
DROP FUNCTION IF EXISTS public.create_match;
DROP FUNCTION IF EXISTS public.create_user_settings;
DROP FUNCTION IF EXISTS public.get_feed;

-- Clean users table  
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  name text DEFAULT 'Anonimo',
  created_at timestamp DEFAULT now()
);

-- NO RLS for debugging (re-enable after)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test insert manually
-- INSERT INTO users (id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'test');

SELECT 'Done! Try signup now.' as status;