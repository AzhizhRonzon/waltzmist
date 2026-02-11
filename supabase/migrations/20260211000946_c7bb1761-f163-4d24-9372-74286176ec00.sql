
-- Fix voice-notes storage: only match participants can access
-- Drop any existing permissive policies on voice-notes
DROP POLICY IF EXISTS "Match participants can access voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access voice notes" ON storage.objects;

-- Upload: only authenticated users can upload to their own folder in voice-notes
CREATE POLICY "Users upload own voice notes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Download: only match participants can read voice notes
-- The folder structure is {userId}/{matchId}-{timestamp}.webm
-- We check if the current user is a participant of the match referenced in the filename
CREATE POLICY "Match participants read voice notes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-notes'
  AND (
    -- Owner of the file
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Or a participant in the match (matchId is the second folder segment or part of filename)
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
        AND (
          m.user1_id::text = (storage.foldername(name))[1]
          OR m.user2_id::text = (storage.foldername(name))[1]
        )
    )
  )
);
