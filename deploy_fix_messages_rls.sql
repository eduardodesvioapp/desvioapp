-- Fix: Permite que perfis IA respondam no chat
-- O trigger handle_ai_response insere com sender_id = AI user, mas auth.uid() = humano
-- Precisamos de uma policy que permita isso

-- Remove policies antigas
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "own_messages" ON public.messages;

-- SELECT: participantes do match
CREATE POLICY "messages_select" ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = messages.match_id
              AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
    );

-- INSERT: humano envia OU bot responde (SECURITY DEFINER no trigger faz auth.uid() = humano)
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
    WITH CHECK (
        -- Caso 1: humano enviando sua própria mensagem
        (auth.uid() = sender_id)
        OR
        -- Caso 2: bot respondendo (sender_id é um perfil is_human=FALSE no mesmo match)
        (
            EXISTS (
                SELECT 1 FROM public.users u
                JOIN public.matches m ON m.id = match_id
                WHERE u.id = sender_id
                  AND u.is_human = FALSE
                  AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
            )
        )
    );

-- UPDATE: apenas receptor marca como lido
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE
    USING (auth.uid() = receiver_id);
