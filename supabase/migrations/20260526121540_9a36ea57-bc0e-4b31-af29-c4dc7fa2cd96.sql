
CREATE TABLE public.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  credential_id text NOT NULL,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text,
  rp_id text NOT NULL,
  device_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE (rp_id, credential_id)
);

CREATE INDEX idx_webauthn_credentials_email_rp ON public.webauthn_credentials (lower(email), rp_id);

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon all on webauthn_credentials"
  ON public.webauthn_credentials FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny authenticated all on webauthn_credentials"
  ON public.webauthn_credentials FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE TABLE public.webauthn_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  challenge text NOT NULL,
  challenge_type text NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
  rp_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webauthn_challenges_lookup ON public.webauthn_challenges (lower(email), rp_id, challenge_type);

ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon all on webauthn_challenges"
  ON public.webauthn_challenges FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny authenticated all on webauthn_challenges"
  ON public.webauthn_challenges FOR ALL TO authenticated
  USING (false) WITH CHECK (false);
