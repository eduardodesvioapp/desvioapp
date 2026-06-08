-- 1. Adicionar coluna status na tabela likes (se não existir)
ALTER TABLE likes ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 2. Garantir que a tabela matches suporte exclusão em cascata ou manual
-- (Já existe na schema.sql original)

-- 3. Nova função para lidar com a criação de matches baseada no status 'accepted'
CREATE OR REPLACE FUNCTION handle_like_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou para 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.user_id, NEW.liked_user_id),
      GREATEST(NEW.user_id, NEW.liked_user_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;

  -- Se o registro foi deletado (unmatch) ou rejeitado, poderíamos remover o match
  -- Mas lidaremos com isso via RLS ou deleção explícita no front para maior controle.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para monitorar updates no status
DROP TRIGGER IF EXISTS tr_handle_like_status_change ON likes;
CREATE TRIGGER tr_handle_like_status_change
AFTER UPDATE ON likes
FOR EACH ROW EXECUTE FUNCTION handle_like_status_change();

-- 5. Remover o trigger antigo que criava match automático no insert
DROP TRIGGER IF EXISTS tr_handle_new_like ON likes;

-- 6. Adicionar trigger para remover match ao deletar like (Unmatch)
CREATE OR REPLACE FUNCTION handle_like_deletion()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM matches 
  WHERE (user1_id = OLD.user_id AND user2_id = OLD.liked_user_id)
     OR (user1_id = OLD.liked_user_id AND user2_id = OLD.user_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_handle_like_deletion ON likes;
CREATE TRIGGER tr_handle_like_deletion
AFTER DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION handle_like_deletion();
