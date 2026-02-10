
-- Table to store custom OTP codes (only accessed by edge functions via service role)
CREATE TABLE public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
-- No RLS policies = no client access, only service role key can access

-- Index for lookup
CREATE INDEX idx_verification_codes_email ON public.verification_codes (email, used, expires_at);
