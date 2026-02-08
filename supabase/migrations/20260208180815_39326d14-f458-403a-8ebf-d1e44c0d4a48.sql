
-- Add audio_url column to messages for voice notes
ALTER TABLE public.messages ADD COLUMN audio_url text DEFAULT NULL;

-- Create aggregate stats functions for Campus Heat Meter

-- Most active program (most swipes)
CREATE OR REPLACE FUNCTION public.get_campus_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total_swipes', (SELECT COUNT(*) FROM public.swipes),
    'total_matches', (SELECT COUNT(*) FROM public.matches),
    'total_nudges', (SELECT COUNT(*) FROM public.nudges),
    'most_active_program', (
      SELECT p.program FROM public.profiles p 
      JOIN public.swipes s ON s.swiper_id = p.id 
      GROUP BY p.program ORDER BY COUNT(*) DESC LIMIT 1
    ),
    'match_rate', CASE 
      WHEN (SELECT COUNT(*) FROM public.swipes WHERE direction = 'like') > 0 
      THEN ROUND(
        (SELECT COUNT(*) FROM public.matches)::numeric * 2 * 100 / 
        NULLIF((SELECT COUNT(*) FROM public.swipes WHERE direction = 'like'), 0)::numeric
      , 1)
      ELSE 0 
    END,
    'busiest_hour', (
      SELECT EXTRACT(HOUR FROM created_at)::integer 
      FROM public.swipes 
      GROUP BY EXTRACT(HOUR FROM created_at) 
      ORDER BY COUNT(*) DESC LIMIT 1
    ),
    'top_red_flag', (
      SELECT red_flag FROM public.profiles 
      WHERE red_flag IS NOT NULL AND red_flag != '' 
      GROUP BY red_flag ORDER BY COUNT(*) DESC LIMIT 1
    ),
    'prom_pact_count', (SELECT COUNT(*) FROM public.matches)
  );
$$;

-- Function to get count of people who liked you (for "who liked me" teaser)
CREATE OR REPLACE FUNCTION public.get_secret_admirers_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.swipes 
  WHERE swiped_id = p_user_id 
    AND direction = 'like'
    AND swiper_id NOT IN (
      SELECT CASE WHEN user1_id = p_user_id THEN user2_id ELSE user1_id END
      FROM public.matches 
      WHERE user1_id = p_user_id OR user2_id = p_user_id
    );
$$;

-- Function to get anonymous profile snippets (programs only) of people who liked you
CREATE OR REPLACE FUNCTION public.get_secret_admirer_hints(p_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(json_agg(json_build_object(
    'program', p.program,
    'section', p.section,
    'photo_hash', LEFT(s.swiper_id::text, 8)
  )), '[]'::json)
  FROM public.swipes s
  JOIN public.profiles p ON p.id = s.swiper_id
  WHERE s.swiped_id = p_user_id 
    AND s.direction = 'like'
    AND s.swiper_id NOT IN (
      SELECT CASE WHEN user1_id = p_user_id THEN user2_id ELSE user1_id END
      FROM public.matches 
      WHERE user1_id = p_user_id OR user2_id = p_user_id
    );
$$;

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true);

-- Allow authenticated users to upload voice notes
CREATE POLICY "Users can upload voice notes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-notes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read for voice notes
CREATE POLICY "Voice notes are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes');
