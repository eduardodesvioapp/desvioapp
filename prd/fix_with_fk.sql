-- =========================================================
-- 🔧 MATCH SUPABASE EXPECTATIONS
-- =========================================================

-- The issue might be that users table doesn't have foreign key to auth.users
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT 'Anonimo',
  created_at timestamp DEFAULT now()
);

-- Allow authenticated users to access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;

CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- Allow anon too for debugging
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;

SELECT 'Created with FK to auth.users!' as status;