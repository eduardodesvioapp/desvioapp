-- =========================================================
-- 🔧 FIX SIGNUP ERROR
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. Drop potentially conflicting triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS after_user_creation ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- 2. Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS users (
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
  embedding vector(1536),
  last_active timestamp default now(),
  created_at timestamp default now()
);

-- 3. Fix RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users are viewable" ON users;
DROP POLICY IF EXISTS "insert own profile" ON users;
DROP POLICY IF EXISTS "update own profile" ON users;

CREATE POLICY "users are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. Enable RLS on other tables if needed
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- 5. Verify setup
SELECT 'Setup complete!' as status;