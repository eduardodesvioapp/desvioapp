-- Run this in Supabase SQL Editor
ALTER TABLE likes ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Adicionar constraint (opcional)
-- ALTER TABLE likes ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected'));
