
-- 1. Get admirer profiles with photos for "Who Liked Me" reveal feature
CREATE OR REPLACE FUNCTION public.get_secret_admirer_profiles(p_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(json_agg(json_build_object(
    'id', s.swiper_id,
    'photo_url', COALESCE(p.photo_urls[1], ''),
    'program', p.program,
    'section', p.section,
    'name', p.name
  )), '[]'::json)
  FROM public.swipes s
  JOIN public.profiles p ON p.id = s.swiper_id
  WHERE s.swiped_id = p_user_id 
    AND s.direction = 'like'
    AND s.swiper_id NOT IN (
      SELECT CASE WHEN user1_id = p_user_id THEN user2_id ELSE user1_id END
      FROM public.matches 
      WHERE user1_id = p_user_id OR user2_id = p_user_id
    )
    AND p.is_shadow_banned = false;
$$;

-- 2. Re-swipe on admirer (delete old swipe + insert new, allows re-matching with previously rejected profiles)
CREATE OR REPLACE FUNCTION public.re_swipe_admirer(p_user_id uuid, p_admirer_id uuid, p_direction text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete any existing swipe from user to admirer
  DELETE FROM public.swipes 
  WHERE swiper_id = p_user_id AND swiped_id = p_admirer_id;
  
  -- Insert new swipe (this will trigger check_mutual_match if direction is 'like')
  INSERT INTO public.swipes (swiper_id, swiped_id, direction)
  VALUES (p_user_id, p_admirer_id, p_direction);
  
  RETURN true;
END;
$$;

-- 3. Create match from correct crush guess
CREATE OR REPLACE FUNCTION public.resolve_crush_match(p_crush_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_id uuid;
BEGIN
  SELECT sender_id INTO v_sender_id
  FROM public.crushes
  WHERE id = p_crush_id AND receiver_id = p_user_id AND revealed = true;
  
  IF v_sender_id IS NULL THEN RETURN false; END IF;
  
  INSERT INTO public.matches (user1_id, user2_id)
  VALUES (LEAST(v_sender_id, p_user_id), GREATEST(v_sender_id, p_user_id))
  ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$;

-- 4. Update campus stats to include total likes
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
