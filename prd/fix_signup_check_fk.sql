-- =========================================================
-- 🔧 FINAL FIX - Check auth.users hook
-- =========================================================

-- The actual problem might be Supabase's internal hook
-- Run in SQL Editor:

-- 1. Check what's in auth.users (should be empty)
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 2. If there's data, there's a trigger somewhere
-- This checks for any hook functions
SELECT * FROM pg_proc WHERE proname LIKE '%hook%' OR proname LIKE '%trigger%';

-- 3. Check for foreign keys referencing auth.users
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND ccu.table_name = 'users';

-- 4. THE FIX: Delete all foreign keys to auth.users
-- Then recreate properly