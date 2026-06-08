-- =========================================================
-- 🔧 CHECK AUTH CONFIG
-- =========================================================

-- 1. Check auth schema
SELECT * FROM auth.schema;

-- 2. Check if there's anything in config
SELECT * FROM auth.config LIMIT 1;

-- 3. Check migrations
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;