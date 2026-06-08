-- =========================================================
-- 🔧 CHECK WHAT'S BLOCKING SIGNUP
-- Run in Supabase SQL Editor first
-- =========================================================

-- 1. Check if there's a hook configured
SELECT * FROM pgHooks;

-- 2. Check auth hooks
SELECT * FROM auth.hooks;

-- 3. Look for any trigger on auth.users
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 4. Check if there's a foreign key from auth.users to anything we own
SELECT
    tc.constraint_name,
    tc.table_name
FROM information_schema.table_constraints tc
WHERE constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'auth';