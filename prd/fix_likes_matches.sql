-- =========================================================
-- 🚀 ATUALIZAÇÃO DO SISTEMA DE LIKES E MATCHES
-- =========================================================

-- 1. Configuração da Tabela de Likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- PostgREST precisa de chaves estrangeiras explícitas para fazer o JOIN
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE likes ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_liked_user_id_fkey;
ALTER TABLE likes ADD CONSTRAINT likes_liked_user_id_fkey FOREIGN KEY (liked_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Adiciona coluna para controle de visualização
ALTER TABLE likes ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Política para ver likes (essencial para o frontend saber se o coração está preenchido)
CREATE POLICY "Usuários podem ver seus próprios likes e likes recebidos" ON likes
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = liked_user_id);

-- Política para dar likes (Enforcement da regra de 85% de score)
DROP POLICY IF EXISTS "Usuários podem dar likes" ON likes;
CREATE POLICY "Usuários podem dar likes" ON likes
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND profile_score >= 85
  )
);

-- Política para remover likes (Unlike)
DROP POLICY IF EXISTS "Usuários podem remover seus próprios likes" ON likes;
CREATE POLICY "Usuários podem remover seus próprios likes" ON likes
FOR DELETE USING (auth.uid() = user_id);

-- Política para marcar como lido (Update)
DROP POLICY IF EXISTS "Usuários podem marcar likes recebidos como lidos" ON likes;
CREATE POLICY "Usuários podem marcar likes recebidos como lidos" ON likes
FOR UPDATE USING (auth.uid() = liked_user_id)
WITH CHECK (auth.uid() = liked_user_id);

-- 2. Configuração da Tabela de Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Garante que não existam matches duplicados (ex: A-B e B-A)
ALTER TABLE matches DROP CONSTRAINT IF EXISTS unique_match_pair;
ALTER TABLE matches ADD CONSTRAINT unique_match_pair UNIQUE (user1_id, user2_id);

-- Política para ver matches
DROP POLICY IF EXISTS "Usuários podem ver seus próprios matches" ON matches;
CREATE POLICY "Usuários podem ver seus próprios matches" ON matches
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 3. Automação de Match (Trigger)
-- Quando um like é inserido, verifica se existe reciprocidade e cria o match automaticamente.
CREATE OR REPLACE FUNCTION handle_new_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o alvo também já deu like no autor
  IF EXISTS (
    SELECT 1 FROM likes 
    WHERE user_id = NEW.liked_user_id 
    AND liked_user_id = NEW.user_id
  ) THEN
    -- Cria o match garantindo que user1_id < user2_id para unicidade
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.user_id, NEW.liked_user_id),
      GREATEST(NEW.user_id, NEW.liked_user_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_handle_new_like ON likes;
CREATE TRIGGER tr_handle_new_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION handle_new_like();

-- 4. Permissões de Acesso
GRANT ALL ON likes TO authenticated;
GRANT ALL ON matches TO authenticated;
