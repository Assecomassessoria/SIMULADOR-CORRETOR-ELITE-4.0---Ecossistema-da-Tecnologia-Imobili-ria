-- Persistência server-side de PIN definitivo para login em novo terminal
CREATE TABLE IF NOT EXISTS public.user_pin_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  pin_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

ALTER TABLE public.user_pin_access ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_pin_access'
      AND policyname = 'Deny all access on user_pin_access'
  ) THEN
    CREATE POLICY "Deny all access on user_pin_access"
      ON public.user_pin_access
      FOR ALL
      TO public
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;