-- Tabela de denúncias de perfis
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (reason IN (
    'fake_profile',
    'harassment',
    'underage',
    'spam',
    'non_consensual_content',
    'scam',
    'hate_speech',
    'other'
  )),
  details     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  
  -- Impede denúncias duplicadas do mesmo reporter para o mesmo perfil com o mesmo motivo
  UNIQUE (reporter_id, reported_id, reason)
);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado pode inserir denúncia (mas nunca contra si mesmo)
CREATE POLICY "users_can_report_others"
  ON public.reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND reporter_id <> reported_id
  );

-- Usuário só vê suas próprias denúncias
CREATE POLICY "users_see_own_reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Índices para consultas administrativas
CREATE INDEX IF NOT EXISTS reports_reported_id_idx ON public.reports (reported_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports (created_at DESC);
