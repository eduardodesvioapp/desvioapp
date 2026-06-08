-- Habilitar RLS na tabela messages para corrigir lentidão do Realtime e garantir segurança
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Limpar política se já existir para evitar erros
DROP POLICY IF EXISTS "own_messages" ON public.messages;

-- Criar a política de segurança: apenas usuários do match podem ler e inserir mensagens
CREATE POLICY "own_messages" ON public.messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);
