-- =========================================================
-- 🔧 COMPLETE CLEANUP - Remove everything that blocks signup
-- Run in Supabase SQL Editor
-- =========================================================

-- 1. Remove ALL user-defined functions
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 2. Grant public access to necessary schemas
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA auth TO authenticated;

-- 3. Fresh users table without any constraints
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  name text,
  age int,
  bio text,
  created_at timestamp DEFAULT now()
);

-- 4. Basic RLS (allow all for now)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON users FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON users FOR UPDATE USING (true);
CREATE POLICY "allow_delete" ON users FOR DELETE USING (true);

-- 5. Check auth config
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

SELECT 'Cleanup complete!' as status;