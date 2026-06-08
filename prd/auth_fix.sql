-- =========================================================
-- 🔧 CORREÇÃO AUTH - REMOVER TRIGGER PROBLEMÁTICO
-- =========================================================

-- Apenas remover trigger que pode estar causando erro
drop trigger if exists on_auth_user_created on auth.users;