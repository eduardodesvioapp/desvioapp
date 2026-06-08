-- =========================================================
-- 🧠 ATUALIZAÇÃO PARA EMBEDDINGS LOCAIS (TRANSFORMERS.JS)
-- Alterando a dimensão de 1536 (OpenAI) para 384 (MiniLM)
-- =========================================================

-- 1. Remove a coluna antiga (seja embedding ou users_compatibility_embedding)
ALTER TABLE users DROP COLUMN IF EXISTS embedding;
ALTER TABLE users DROP COLUMN IF EXISTS compatibility_embedding;

-- 2. Adiciona a nova coluna com o nome semântico correto
ALTER TABLE users ADD COLUMN compatibility_embedding vector(384);

-- 3. Recria o índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_users_compatibility_embedding ON users USING ivfflat (compatibility_embedding vector_cosine_ops)
WITH (lists = 100);
