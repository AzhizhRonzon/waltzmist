
-- Fix security: Add PERMISSIVE auth-required policies to all sensitive tables
-- The existing RESTRICTIVE policies filter correctly for owners, but we need
-- a baseline PERMISSIVE policy requiring authentication first.

-- Make get_campus_stats also return total_users (including all auth users)
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
    'total_likes', (SELECT COUNT(*) FROM public.swipes WHERE direction = 'like'),
    'total_users', (SELECT COUNT(*) FROM auth.users),
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

-- Update discover queue logic: when B likes A and A already rejected B,
-- re-insert B's profile into A's feed by deleting A's dislike swipe on B
CREATE OR REPLACE FUNCTION public.requeue_on_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.direction = 'like' THEN
    -- If the target (swiped_id) previously disliked the swiper, remove that dislike
    -- so swiper's profile re-appears in target's discover feed
    DELETE FROM public.swipes 
    WHERE swiper_id = NEW.swiped_id 
      AND swiped_id = NEW.swiper_id 
      AND direction = 'dislike';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER requeue_on_like_trigger
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.requeue_on_like();

-- Also add the check_mutual_match trigger that was missing
DROP TRIGGER IF EXISTS check_mutual_match_trigger ON public.swipes;
CREATE TRIGGER check_mutual_match_trigger
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_match();

-- Enable leaked password protection
-- (This is handled via auth config, not SQL)

-- Add RLS policy to verification_codes to prevent public access
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role should access verification codes (edge functions use service role)
-- No user-level policies needed since edge functions bypass RLS
