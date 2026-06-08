-- 1. Permite que o usuário veja quem deu like nele
DROP POLICY IF EXISTS "users can see their own likes" ON likes;

CREATE POLICY "users can see their own likes and received likes" 
ON likes FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = liked_user_id);

-- 2. Habilita o Realtime para a tabela likes (para o contador funcionar em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE likes;

-- 3. Caso ainda não tenha adicionado a coluna is_read
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 4. Permite que o destinatário do like marque como lido (UPDATE)
DROP POLICY IF EXISTS "users can update likes received to mark as read" ON public.likes;
CREATE POLICY "users can update likes received to mark as read" 
ON public.likes FOR UPDATE 
USING (auth.uid() = liked_user_id)
WITH CHECK (auth.uid() = liked_user_id);
