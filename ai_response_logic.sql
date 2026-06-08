-- 1. Tabela para chaves de API (Segurança)
CREATE TABLE IF NOT EXISTS public.secrets (
    key_name TEXT PRIMARY KEY,
    key_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Apenas administradores ou o próprio sistema podem ver
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Apenas admin vê secrets" ON public.secrets;
CREATE POLICY "Apenas admin vê secrets" ON public.secrets FOR ALL USING (public.is_admin(auth.uid()));

-- 2. Função para chamar o Gemini via HTTP
CREATE OR REPLACE FUNCTION public.call_gemini(
    p_prompt TEXT,
    p_personality TEXT,
    p_model TEXT DEFAULT 'gemini-pro'
) RETURNS TEXT AS $$
DECLARE
    v_api_key TEXT;
    v_url TEXT;
    v_resp extensions.http_response;
    v_response JSONB;
    v_body JSONB;
BEGIN
    -- Busca a chave no banco
    SELECT key_value INTO v_api_key FROM public.secrets WHERE key_name = 'GEMINI_API_KEY';
    
    IF v_api_key IS NULL THEN
        RETURN 'Erro: GEMINI_API_KEY não configurada em public.secrets';
    END IF;

    v_url := 'https://generativelanguage.googleapis.com/v1beta/models/' || p_model || ':generateContent?key=' || v_api_key;
    
    -- Monta o corpo da requisição
    v_body := jsonb_build_object(
        'contents', jsonb_build_array(
            jsonb_build_object(
                'role', 'user',
                'parts', jsonb_build_array(
                    jsonb_build_object('text', 'Instruções de Personalidade: ' || p_personality || ' Mensagem do usuário: ' || p_prompt)
                )
            )
        )
    );

    -- Chamada HTTP POST
    BEGIN
        v_resp := extensions.http_post(v_url, v_body::text, 'application/json');
        v_response := v_resp.content::jsonb;
    EXCEPTION WHEN OTHERS THEN
        RETURN 'Erro na chamada HTTP: ' || SQLERRM;
    END;

    -- Extrai o texto da resposta
    IF v_response ? 'candidates' THEN
        RETURN v_response->'candidates'->0->'content'->'parts'->0->>'text';
    ELSE
        RETURN 'Erro API Gemini: ' || v_response::text;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger para resposta automática
CREATE OR REPLACE FUNCTION public.handle_ai_response()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_is_human BOOLEAN;
    v_ai_config JSONB;
    v_response_text TEXT;
BEGIN
    -- Verifica se o destinatário é IA
    SELECT is_human, ai_config INTO v_receiver_is_human, v_ai_config 
    FROM public.users WHERE id = NEW.receiver_id;

    -- Só responde se o destinatário for IA e a mensagem original vier de um humano
    IF v_receiver_is_human = FALSE THEN
        -- Chama o Gemini
        v_response_text := public.call_gemini(
            NEW.content, 
            v_ai_config->>'personality', 
            COALESCE(v_ai_config->>'model', 'gemini-1.5-flash')
        );

        -- Insere a resposta da IA na tabela de mensagens
        INSERT INTO public.messages (match_id, sender_id, receiver_id, content)
        VALUES (NEW.match_id, NEW.receiver_id, NEW.sender_id, v_response_text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplica o trigger
DROP TRIGGER IF EXISTS tr_ai_auto_respond ON public.messages;
CREATE TRIGGER tr_ai_auto_respond
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_ai_response();
