-- =========================================================
-- ⚛️ MOTOR DE IA NO BACKEND (SUPABASE)
-- Resolve o problema de CORS e protege o Token
-- =========================================================

-- 1. Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função para chamar a IA do Hugging Face via SQL
CREATE OR REPLACE FUNCTION generate_bio_embedding()
RETURNS TRIGGER AS $$
DECLARE
  hf_token TEXT := 'SEU_TOKEN_AQUI'; -- O usuário deve substituir aqui
  model_id TEXT := 'sentence-transformers/all-MiniLM-L6-v2';
  request_id BIGINT;
BEGIN
  -- Só dispara se a bio mudou ou é nova
  IF (TG_OP = 'INSERT' OR NEW.bio IS DISTINCT FROM OLD.bio) AND NEW.bio IS NOT NULL THEN
    
    -- Faz a chamada assíncrona para a API
    -- O resultado será processado e gravado na coluna compatibility_embedding
    SELECT net.http_post(
      url := 'https://api-inference.huggingface.co/models/' || model_id,
      body := jsonb_build_object('inputs', NEW.bio),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || hf_token,
        'Content-Type', 'application/json'
      )
    ) INTO request_id;

    -- Nota: O pg_net é assíncrono. Para gravar o resultado de volta, 
    -- precisaríamos de um worker ou cron. 
    -- Para simplificar agora, vamos focar no salvamento do frontend.
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
