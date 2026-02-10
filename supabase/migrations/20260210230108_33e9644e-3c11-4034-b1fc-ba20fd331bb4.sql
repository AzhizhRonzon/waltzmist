
-- 1. Make voice-notes bucket private
UPDATE storage.buckets SET public = false WHERE id = 'voice-notes';

-- 2. Drop old public policy for voice notes
DROP POLICY IF EXISTS "Voice notes are publicly accessible" ON storage.objects;

-- 3. Voice notes: only match participants can read
CREATE POLICY "Voice notes match participants only"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-notes'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  )
);

-- 4. Voice notes: users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload voice notes" ON storage.objects;
CREATE POLICY "Users can upload own voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Add RLS policies on verification_codes to prevent public access
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for regular users
-- Only service_role (edge functions) can access this table

-- 6. Update profiles SELECT policy to require authentication
DROP POLICY IF EXISTS "Users can view all non-banned profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view non-banned profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING ((is_shadow_banned = false) OR (id = auth.uid()));
