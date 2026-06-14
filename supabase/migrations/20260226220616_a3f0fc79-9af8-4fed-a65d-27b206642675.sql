
-- Table to track active sessions per email
CREATE TABLE public.active_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Index for fast lookups by email
CREATE INDEX idx_active_sessions_email ON public.active_sessions (email, is_active);

-- Index for token validation
CREATE INDEX idx_active_sessions_token ON public.active_sessions (session_token, is_active);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- No direct client access — all operations go through edge functions
-- The service role key is used in edge functions to manage sessions
