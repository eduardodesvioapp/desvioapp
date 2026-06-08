-- =========================================================
-- 🔧 FIX WITHOUT VECTOR EXTENSION
-- Run this if previous fix doesn't work
-- =========================================================

-- 1. Recreate WITHOUT vector column (simpler schema)
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id uuid primary key,
  name text,
  age int,
  bio text,
  gender text,
  interested_in text[],
  latitude numeric,
  longitude numeric,
  travel_mode boolean default false,
  travel_lat numeric,
  travel_lng numeric,
  last_active timestamp default now(),
  created_at timestamp default now()
);

-- 2. Fix RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users are viewable" ON users;
DROP POLICY IF EXISTS "insert own profile" ON users;
DROP POLICY IF EXISTS "update own profile" ON users;

CREATE POLICY "users are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

SELECT 'Fixed without vector!' as status;