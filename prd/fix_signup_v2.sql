-- =========================================================
-- 🔧 AGGRESSIVE FIX - Drop ALL triggers on auth.users
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. Drop EVERYTHING on auth.users
DROP TRIGGER IF EXISTS user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS match_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS after_user_creation ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS autouser_trigger ON auth.users;

-- 2. Also drop triggers on public.users if exists
DROP TRIGGER IF EXISTS user_settings_trigger ON users;
DROP TRIGGER IF EXISTS match_trigger ON users;

-- 3. Ensure user_settings table exists
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_messages boolean default true,
  push_matches boolean default true,
  do_not_disturb boolean default false,
  dnd_start time,
  dnd_end time,
  profile_visible boolean default true,
  show_distance boolean default true,
  max_distance int default 50,
  theme text default 'dark',
  invisible_mode boolean default false,
  is_premium boolean default false,
  created_at timestamp default now()
);

-- 4. Ensure users table structure
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

-- 5. Fix RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users are viewable" ON users;
DROP POLICY IF EXISTS "insert own profile" ON users;
DROP POLICY IF EXISTS "update own profile" ON users;

CREATE POLICY "users are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- 6. Test auth.users is accessible
SELECT count(*) FROM auth.users;

SELECT 'Fix complete!' as status;