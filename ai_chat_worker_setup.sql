-- =========================================================
-- 🤖 CONFIGURAÇÃO DO CHAT DE IA (OPÇÃO B: BACKGROUND WORKER)
-- =========================================================

-- 1. Remover a trigger síncrona antiga para evitar respostas duplicadas ou lentas
DROP TRIGGER IF EXISTS tr_ai_auto_respond ON public.messages;

-- 2. Criar a tabela de fila para processamento assíncrono
CREATE TABLE IF NOT EXISTS public.ai_chat_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    match_id UUID NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Habilitar RLS na fila (Apenas admin/sistema acessa)
ALTER TABLE public.ai_chat_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Apenas admin acessa fila" ON public.ai_chat_queue;
CREATE POLICY "Apenas admin acessa fila" ON public.ai_chat_queue FOR ALL USING (public.is_admin(auth.uid()));

-- 3. Adicionar coluna de digitação na tabela matches para feedback em tempo real
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS typing_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. Trigger BEFORE INSERT para preencher receiver_id dinamicamente (pois o frontend envia nulo)
CREATE OR REPLACE FUNCTION public.resolve_message_receiver()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_id UUID;
BEGIN
    IF NEW.receiver_id IS NULL THEN
        SELECT 
            CASE 
                WHEN user1_id = NEW.sender_id THEN user2_id 
                ELSE user1_id 
            END INTO v_receiver_id
        FROM public.matches 
        WHERE id = NEW.match_id;
        
        NEW.receiver_id := v_receiver_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_resolve_message_receiver ON public.messages;
CREATE TRIGGER tr_resolve_message_receiver
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.resolve_message_receiver();


-- 5. Trigger AFTER INSERT para enfileirar mensagens de IA na fila de processamento
CREATE OR REPLACE FUNCTION public.enqueue_ai_response()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_is_human BOOLEAN;
BEGIN
    -- NEW.receiver_id já estará preenchido graças à trigger BEFORE INSERT!
    SELECT is_human INTO v_receiver_is_human 
    FROM public.users WHERE id = NEW.receiver_id;

    -- Só enfileira se o destinatário for IA (is_human = false)
    IF v_receiver_is_human = FALSE THEN
        INSERT INTO public.ai_chat_queue (message_id, match_id)
        VALUES (NEW.id, NEW.match_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar a trigger assíncrona
DROP TRIGGER IF EXISTS tr_enqueue_ai_response ON public.messages;
CREATE TRIGGER tr_enqueue_ai_response
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_ai_response();
