-- =========================================================
-- 🔧 DEFINITIVE FIX - Match Supabase schema
-- =========================================================

-- 1. Drop and recreate users exactly matching what auth expects
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- 2. Create with proper FK to auth.users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT 'Anonimo',
  age int,
  bio text,
  gender text,
  interested_in text[],
  latitude numeric,
  longitude numeric,
  travel_mode boolean DEFAULT false,
  travel_lat numeric,
  travel_lng numeric,
  last_active timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);

CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_messages boolean DEFAULT true,
  push_matches boolean DEFAULT true,
  profile_visible boolean DEFAULT true,
  show_distance boolean DEFAULT true,
  max_distance int DEFAULT 50,
  theme text DEFAULT 'dark',
  invisible_mode boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- 3. RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;

CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "settings_all" ON user_settings;
CREATE POLICY "settings_all" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- 4. Grant permissions
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON user_settings TO anon, authenticated;

SELECT 'Done! With FK to auth.users' as status;