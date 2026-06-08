-- =============================================================
-- 🤖 MIGRATION: process_ai_chat_queue (SQL-only, sem worker externo)
-- Substitui scratch/ai_chat_worker.cjs por função agendada via pg_cron
-- =============================================================

-- 1. Colunas extras em ai_chat_queue (idempotente)
ALTER TABLE public.ai_chat_queue
  ADD COLUMN IF NOT EXISTS locked_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS prompt_tokens      INT,
  ADD COLUMN IF NOT EXISTS completion_tokens  INT,
  ADD COLUMN IF NOT EXISTS total_tokens       INT;

-- 2. Nova função: call_gemini_with_history (histórico + rotação de chaves)
CREATE OR REPLACE FUNCTION public.call_gemini_with_history(
  p_history      JSONB,
  p_personality  TEXT,
  p_model        TEXT DEFAULT 'gemini-flash-lite-latest'
) RETURNS JSONB AS $$
DECLARE
  v_api_keys        TEXT[];
  v_key_idx         INT  := 1;
  v_max_attempts    INT;
  v_active_key      TEXT;
  v_url             TEXT;
  v_resp            extensions.http_response;
  v_response        JSONB;
  v_body            JSONB;
  v_system_text     TEXT;
  v_text            TEXT;
  v_prompt_tokens   INT;
  v_completion_tok  INT;
  v_total_tokens    INT;
  v_finish_reason   TEXT;
BEGIN
  v_system_text :=
      'INSTRUÇÕES GERAIS DE COMPORTAMENTO (OBRIGATÓRIO):' || E'\n'
    || '1. VOCÊ É UMA PESSOA REAL: Você é um usuário real conversando no aplicativo de encontros Desvio. NUNCA diga que é uma inteligência artificial, robô, modelo de linguagem ou assistente da Google. Fale e aja como um ser humano buscando conexão.' || E'\n'
    || '2. NÃO DÊ SUPORTE OU INSTRUÇÕES: Você NÃO está aqui para tirar dúvidas sobre o aplicativo, explicar telas ou resolver problemas técnicos do usuário. Se perguntarem algo do app, desconverse, brinque ou seja evasivo de forma natural, exatamente como uma pessoa real faria.' || E'\n'
    || '3. FOCO EXCLUSIVO EM BATE-PAPO: Seu único objetivo é flertar, conversar de forma descontraída, interessante e manter o papo fluindo naturalmente.' || E'\n'
    || '4. ESTILO DE ESCRITA HUMANO E COMPACTO: Escreva de forma curta (máximo 1 a 3 frases curtas), use gírias leves se fizer sentido para o perfil, evite pontuações excessivamente formais e dê respostas dinâmicas.' || E'\n'
    || '5. ALINHAMENTO ABSOLUTO COM SEU PERFIL: Use as instruções da sua personalidade individual, interesses, idade e biografia como base única para responder a quaisquer perguntas sobre quem você é, o que faz, onde mora, do que gosta ou seus planos. Mantenha coerência total com a sua persona e nunca invente fatos que entrem em contradição com ela.' || E'\n'
    || '6. NUNCA CONFIRMAR ENCONTROS PRESENCIAIS (MANDATÓRIO): Sob nenhuma circunstância aceite, confirme ou agende encontros ao vivo, ligações ou troca de contatos externos (como WhatsApp ou Instagram). Se o usuário sugerir um encontro presencial ou pedir seu contato, desvie do assunto de maneira educada, charmosa e extremamente natural. Use de bom humor (ex: dizendo que prefere ir devagar e se conhecer melhor por aqui no chat primeiro) e mude sutilmente o rumo da conversa para outro assunto interessante, mantendo a conversa fluindo de forma agradável e sem parecer robótico.' || E'\n'
    || E'\n'
    || 'INSTRUÇÕES DA SUA PERSONALIDADE INDIVIDUAL:' || E'\n'
    || COALESCE(p_personality, 'Você é um perfil misterioso no app Desvio.');

  v_body := jsonb_build_object(
    'systemInstruction', jsonb_build_object(
      'parts', jsonb_build_array(jsonb_build_object('text', v_system_text))
    ),
    'contents', p_history
  );

  -- Coleta todas as chaves GEMINI_API_KEY* em ordem alfabética
  SELECT COALESCE(array_agg(key_value ORDER BY key_name), ARRAY[]::TEXT[])
    INTO v_api_keys
    FROM public.secrets
   WHERE key_name LIKE 'GEMINI_API_KEY%'
     AND key_value IS NOT NULL
     AND key_value <> '';

  v_max_attempts := array_length(v_api_keys, 1);
  IF v_max_attempts IS NULL OR v_max_attempts = 0 THEN
    RETURN jsonb_build_object('error', 'Nenhuma chave GEMINI_API_KEY* encontrada em public.secrets');
  END IF;

  WHILE v_key_idx <= v_max_attempts LOOP
    v_active_key := v_api_keys[v_key_idx];
    v_url := 'https://generativelanguage.googleapis.com/v1beta/models/'
          || p_model || ':generateContent?key=' || v_active_key;

    BEGIN
      v_resp     := extensions.http_post(v_url, v_body::text, 'application/json');
      v_response := v_resp.content::jsonb;
    EXCEPTION WHEN OTHERS THEN
      v_key_idx := v_key_idx + 1;
      CONTINUE;
    END;

    -- Erro retornado pela API (ex.: cota, chave inválida)
    IF v_response ? 'error' THEN
      v_key_idx := v_key_idx + 1;
      CONTINUE;
    END IF;

    -- Prompt bloqueado pelo filtro de segurança
    IF v_response ? 'promptFeedback'
       AND (v_response->'promptFeedback'->>'blockReason') IS NOT NULL THEN
      RETURN jsonb_build_object(
        'error',         'Prompt bloqueado: ' || (v_response->'promptFeedback'->>'blockReason'),
        'finish_reason', 'SAFETY'
      );
    END IF;

    v_finish_reason := v_response->'candidates'->0->>'finishReason';
    IF v_finish_reason = 'SAFETY' THEN
      RETURN jsonb_build_object('error', 'Resposta bloqueada por filtro de segurança', 'finish_reason', 'SAFETY');
    END IF;

    v_text := v_response->'candidates'->0->'content'->'parts'->0->>'text';
    IF v_text IS NULL OR v_text = '' THEN
      v_key_idx := v_key_idx + 1;
      CONTINUE;
    END IF;

    v_prompt_tokens  := COALESCE((v_response->'usageMetadata'->>'promptTokenCount')::INT,     0);
    v_completion_tok := COALESCE((v_response->'usageMetadata'->>'candidatesTokenCount')::INT, 0);
    v_total_tokens   := COALESCE((v_response->'usageMetadata'->>'totalTokenCount')::INT,      0);

    RETURN jsonb_build_object(
      'text',              trim(v_text),
      'prompt_tokens',     v_prompt_tokens,
      'completion_tokens', v_completion_tok,
      'total_tokens',      v_total_tokens
    );
  END LOOP;

  RETURN jsonb_build_object('error', 'Todas as chaves Gemini falharam ou cota esgotada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Processador principal da fila (substitui o worker Node.js)
CREATE OR REPLACE FUNCTION public.process_ai_chat_queue(p_batch_size INT DEFAULT 5)
RETURNS INT AS $$
DECLARE
  v_item            RECORD;
  v_msg             RECORD;
  v_bot             RECORD;
  v_history         JSONB;
  v_gemini_result   JSONB;
  v_response_text   TEXT;
  v_prompt_tokens   INT;
  v_completion_tok  INT;
  v_total_tokens    INT;
  v_typing_ms       INT;
  v_retry_count     INT;
  v_error_msg       TEXT;
  v_processed       INT := 0;
BEGIN
  -- Pega lote de itens pendentes, com SKIP LOCKED para paralelismo seguro
  FOR v_item IN
    SELECT id, message_id, match_id, retry_count
      FROM public.ai_chat_queue
     WHERE status = 'pending'
     ORDER BY created_at ASC
     FOR UPDATE SKIP LOCKED
     LIMIT p_batch_size
  LOOP
    BEGIN
      -- 1. Marca como em processamento
      UPDATE public.ai_chat_queue
         SET status = 'processing', locked_at = NOW()
       WHERE id = v_item.id;

      -- 2. Carrega a mensagem original
      SELECT * INTO v_msg FROM public.messages WHERE id = v_item.message_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Mensagem % não encontrada', v_item.message_id;
      END IF;

      -- 3. Carrega o perfil da IA
      SELECT name, is_human, ai_config
        INTO v_bot
        FROM public.users
       WHERE id = v_msg.receiver_id;
      IF NOT FOUND OR v_bot.is_human IS DISTINCT FROM FALSE THEN
        RAISE EXCEPTION 'Recebedor % não é um perfil de IA', v_msg.receiver_id;
      END IF;

      -- 4. Histórico das últimas 10 mensagens (mais antigas -> mais novas)
      SELECT COALESCE(jsonb_agg(elem ORDER BY rn ASC), '[]'::jsonb) INTO v_history
      FROM (
        SELECT
          row_number() OVER (ORDER BY h.created_at ASC) AS rn,
          jsonb_build_object(
            'role',  CASE WHEN h.sender_id = v_msg.receiver_id THEN 'model' ELSE 'user' END,
            'parts', jsonb_build_array(jsonb_build_object('text', h.content))
          ) AS elem
        FROM (
          SELECT sender_id, content, created_at
            FROM public.messages
           WHERE match_id = v_item.match_id
           ORDER BY created_at DESC
           LIMIT 10
        ) h
      ) sub;

      -- 5. Fallback: garante pelo menos a mensagem atual
      IF v_history = '[]'::jsonb THEN
        v_history := jsonb_build_array(
          jsonb_build_object(
            'role',  'user',
            'parts', jsonb_build_array(jsonb_build_object('text', v_msg.content))
          )
        );
      END IF;

      -- 6. Liga indicador "Digitando..."
      UPDATE public.matches
         SET typing_user_id = v_msg.receiver_id
       WHERE id = v_item.match_id;

      -- 7. Chama Gemini com histórico completo
      v_gemini_result := public.call_gemini_with_history(
        v_history,
        v_bot.ai_config->>'personality',
        COALESCE(v_bot.ai_config->>'model', 'gemini-flash-lite-latest')
      );

      IF v_gemini_result ? 'error' THEN
        RAISE EXCEPTION 'Gemini: %', v_gemini_result->>'error';
      END IF;

      v_response_text  := v_gemini_result->>'text';
      v_prompt_tokens  := COALESCE((v_gemini_result->>'prompt_tokens')::INT,     0);
      v_completion_tok := COALESCE((v_gemini_result->>'completion_tokens')::INT, 0);
      v_total_tokens   := COALESCE((v_gemini_result->>'total_tokens')::INT,      0);

      -- 8. Atraso realista de digitação (~45ms/caractere + 500ms, máx 4.5s)
      v_typing_ms := LEAST(4500, (char_length(v_response_text) * 45) + 500);
      PERFORM pg_sleep(v_typing_ms / 1000.0);

      -- 9. Grava resposta da IA
      INSERT INTO public.messages (match_id, sender_id, receiver_id, content)
      VALUES (v_item.match_id, v_msg.receiver_id, v_msg.sender_id, v_response_text);

      -- 10. Desliga "Digitando..."
      UPDATE public.matches
         SET typing_user_id = NULL
       WHERE id = v_item.match_id;

      -- 11. Marca como concluído
      UPDATE public.ai_chat_queue
         SET status            = 'completed',
             processed_at      = NOW(),
             locked_at         = NULL,
             prompt_tokens     = v_prompt_tokens,
             completion_tokens = v_completion_tok,
             total_tokens      = v_total_tokens,
             error_message     = NULL
       WHERE id = v_item.id;

      v_processed := v_processed + 1;

    EXCEPTION WHEN OTHERS THEN
      v_error_msg   := SQLERRM;
      v_retry_count := COALESCE(v_item.retry_count, 0) + 1;

      -- Desliga typing (best effort)
      BEGIN
        UPDATE public.matches SET typing_user_id = NULL WHERE id = v_item.match_id;
      EXCEPTION WHEN OTHERS THEN NULL; END;

      -- Reaplica estado final (savepoint rollback desfaz o UPDATE anterior)
      UPDATE public.ai_chat_queue
         SET status        = CASE WHEN v_retry_count >= 3 THEN 'failed' ELSE 'pending' END,
             retry_count   = v_retry_count,
             locked_at     = NULL,
             error_message = v_error_msg,
             processed_at  = NOW()
       WHERE id = v_item.id;
    END;
  END LOOP;

  RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grants
GRANT EXECUTE ON FUNCTION public.call_gemini_with_history(JSONB, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_ai_chat_queue(INT)                   TO service_role;

-- 5. Agenda no pg_cron (somente se a extensão existir)
DO $cron$
DECLARE
  v_existing_jobid BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove job anterior, se existir (cron.unschedule levanta exceção se não achar)
    SELECT jobid INTO v_existing_jobid
      FROM cron.job
     WHERE jobname = 'process-ai-chat-queue';
    IF v_existing_jobid IS NOT NULL THEN
      PERFORM cron.unschedule(v_existing_jobid);
    END IF;

    PERFORM cron.schedule(
      'process-ai-chat-queue',
      '* * * * *',
      $sql$SELECT public.process_ai_chat_queue(5);$sql$
    );
    RAISE NOTICE '✅ pg_cron: job "process-ai-chat-queue" agendado (a cada 1 minuto)';
  ELSE
    RAISE NOTICE '⚠️ pg_cron não está habilitado. Chame SELECT public.process_ai_chat_queue(5); manualmente.';
  END IF;
END
$cron$;

-- 6. Recarrega schema do PostgREST
NOTIFY pgrst, 'reload schema';
