-- =========================================================
-- 🔔 FILA DE NOTIFICAÇÕES (sem Edge Functions)
-- =========================================================
-- O trigger em auth.users insere um registro em
-- public.email_outbox. Um worker Node.js rodando na VPS
-- (scripts/admin-mailer/worker.mjs) lê a fila, busca os
-- admins em public.users e dispara o SMTP do Gmail.
-- =========================================================

-- 1) Tabela outbox (somente service_role lê/escreve)
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT        NOT NULL,        -- account_created | account_confirmed
  payload       JSONB       NOT NULL,        -- user_id, user_email, datas
  status        TEXT        NOT NULL DEFAULT 'pending', -- pending|sending|sent|failed
  attempts      INT         NOT NULL DEFAULT 0,
  last_error    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_pending
  ON public.email_outbox (created_at)
  WHERE status = 'pending';

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
-- Sem policies = inacessível via Data API. Só service_role (ou
-- conexão direta via psql) mexe.

-- 2) Função de trigger
CREATE OR REPLACE FUNCTION public.enqueue_account_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_event TEXT;
  v_payload JSONB;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_event   := 'account_created';
    v_payload := jsonb_build_object(
      'user_id',      NEW.id,
      'user_email',   NEW.email,
      'created_at',   NEW.created_at,
      'confirmed_at', NEW.email_confirmed_at
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Só dispara quando a confirmação acontece AGORA
    IF OLD.email_confirmed_at IS NULL
       AND NEW.email_confirmed_at IS NOT NULL THEN
      v_event   := 'account_confirmed';
      v_payload := jsonb_build_object(
        'user_id',      NEW.id,
        'user_email',   NEW.email,
        'created_at',   NEW.created_at,
        'confirmed_at', NEW.email_confirmed_at
      );
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.email_outbox (event_type, payload)
  VALUES (v_event, v_payload);

  -- Avisa listeners (worker) que há trabalho novo
  PERFORM pg_notify('email_outbox_new', v_event);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3) Trigger
DROP TRIGGER IF EXISTS trg_enqueue_account_event ON auth.users;
CREATE TRIGGER trg_enqueue_account_event
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_account_event();

-- 4) Log de auditoria (opcional, mesma estrutura de antes)
CREATE TABLE IF NOT EXISTS public.admin_notifications_log (
  id           BIGSERIAL PRIMARY KEY,
  event        TEXT        NOT NULL,
  user_id      UUID,
  user_email   TEXT,
  recipients   TEXT[]      NOT NULL DEFAULT '{}',
  failures     TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_notifications_log ENABLE ROW LEVEL SECURITY;
