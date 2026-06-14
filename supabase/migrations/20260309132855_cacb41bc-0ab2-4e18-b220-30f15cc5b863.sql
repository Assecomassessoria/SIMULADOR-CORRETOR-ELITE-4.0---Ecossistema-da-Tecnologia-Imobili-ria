CREATE TABLE public.used_liberation_passwords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_by_email TEXT,
  used_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.used_liberation_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon all on used_liberation_passwords"
  ON public.used_liberation_passwords
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);