-- 1. Adicionar colunas na tabela matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS requester_id uuid REFERENCES users(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Garantir que user1_id e user2_id tenham referências (necessário para joins do Supabase)
DO $$ 
BEGIN 
  ALTER TABLE matches ADD CONSTRAINT matches_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES users(id);
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ 
BEGIN 
  ALTER TABLE matches ADD CONSTRAINT matches_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES users(id);
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. Limpar triggers antigos de likes (opcional, se mudarmos totalmente para matches)
-- DROP TRIGGER IF EXISTS tr_handle_new_like ON likes;

-- 3. Políticas de RLS para matches (atualização)
-- Garantir que ambos os usuários possam ver e o destinatário possa atualizar o status.
DROP POLICY IF EXISTS "users can see their own matches" ON matches;
CREATE POLICY "users can see their own matches" 
ON matches FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "users can update their own matches" ON matches;
CREATE POLICY "users can update their own matches" 
ON matches FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "users can insert matches" ON matches;
CREATE POLICY "users can insert matches" 
ON matches FOR INSERT 
WITH CHECK (auth.uid() = requester_id AND (auth.uid() = user1_id OR auth.uid() = user2_id));

DROP POLICY IF EXISTS "users can delete their own matches" ON matches;
CREATE POLICY "users can delete their own matches" 
ON matches FOR DELETE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);
