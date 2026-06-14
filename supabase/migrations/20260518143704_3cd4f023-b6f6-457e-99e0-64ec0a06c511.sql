
CREATE TABLE public.whatsapp_connection_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  result_state text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_attempts_identifier ON public.whatsapp_connection_attempts(identifier);
CREATE INDEX idx_wa_attempts_created_at ON public.whatsapp_connection_attempts(created_at DESC);

ALTER TABLE public.whatsapp_connection_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon all on whatsapp_connection_attempts"
  ON public.whatsapp_connection_attempts
  FOR ALL TO public
  USING (false) WITH CHECK (false);
