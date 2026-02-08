
-- ========================================
-- WALTZ: Campus Matchmaking Database
-- ========================================

-- 1. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('PGP24', 'PGP25', 'PGPEx', 'IPM', 'PhD')),
  section TEXT,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
  maggi_metric INTEGER DEFAULT 50,
  favorite_trip TEXT DEFAULT '',
  party_spot TEXT DEFAULT '',
  red_flag TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  is_shadow_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Swipes table
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (swiper_id, swiped_id)
);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- 3. Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 4. Messages table (real-time chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'read')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Nudges table
CREATE TABLE public.nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- 6. Crushes table
CREATE TABLE public.crushes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hint TEXT NOT NULL,
  guesses_left INTEGER NOT NULL DEFAULT 3,
  revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crushes ENABLE ROW LEVEL SECURITY;

-- 7. Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Helper Functions (SECURITY DEFINER)
-- ========================================

-- Check if two users are matched
CREATE OR REPLACE FUNCTION public.is_match(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE (user1_id = user_a AND user2_id = user_b)
       OR (user1_id = user_b AND user2_id = user_a)
  );
$$;

-- Check if user is part of a match
CREATE OR REPLACE FUNCTION public.is_match_participant(p_match_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = p_match_id
      AND (user1_id = p_user_id OR user2_id = p_user_id)
  );
$$;

-- Check nudge rate limit (1 per day)
CREATE OR REPLACE FUNCTION public.can_send_nudge_today(p_sender_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.nudges
    WHERE sender_id = p_sender_id
      AND created_at >= CURRENT_DATE
  );
$$;

-- Check crush limit (max 3 active)
CREATE OR REPLACE FUNCTION public.crush_count(p_sender_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.crushes
  WHERE sender_id = p_sender_id;
$$;

-- ========================================
-- Trigger: Auto-create match on mutual like
-- ========================================

CREATE OR REPLACE FUNCTION public.check_mutual_match()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.direction = 'like' THEN
    -- Check if the other person already liked us
    IF EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.swiped_id
        AND swiped_id = NEW.swiper_id
        AND direction = 'like'
    ) THEN
      -- Create match (lower UUID first to maintain uniqueness)
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATEST(NEW.swiper_id, NEW.swiped_id)
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_mutual_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_match();

-- ========================================
-- Trigger: Update updated_at on profiles
-- ========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- Trigger: Auto-create profile on signup
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, program, sex, age)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'program', 'PGP25'),
    COALESCE(NEW.raw_user_meta_data->>'sex', 'male'),
    COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 22)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- RLS Policies
-- ========================================

-- PROFILES
CREATE POLICY "Users can view all non-banned profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_shadow_banned = false OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- SWIPES
CREATE POLICY "Users can view own swipes"
  ON public.swipes FOR SELECT
  TO authenticated
  USING (swiper_id = auth.uid());

CREATE POLICY "Users can create swipes"
  ON public.swipes FOR INSERT
  TO authenticated
  WITH CHECK (swiper_id = auth.uid() AND swiped_id <> auth.uid());

-- MATCHES
CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- MESSAGES
CREATE POLICY "Users can view messages in their matches"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_match_participant(match_id, auth.uid()));

CREATE POLICY "Users can send messages in their matches"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_match_participant(match_id, auth.uid())
  );

CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    public.is_match_participant(match_id, auth.uid())
    AND sender_id <> auth.uid()
  )
  WITH CHECK (status = 'read');

-- NUDGES
CREATE POLICY "Users can view nudges they sent or received"
  ON public.nudges FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send nudges"
  ON public.nudges FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND receiver_id <> auth.uid()
  );

CREATE POLICY "Users can mark nudges as seen"
  ON public.nudges FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (seen = true);

-- CRUSHES
CREATE POLICY "Senders can view crushes they sent"
  ON public.crushes FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Receivers can view crushes received but not sender"
  ON public.crushes FOR SELECT
  TO authenticated
  USING (receiver_id = auth.uid());

CREATE POLICY "Users can send crushes"
  ON public.crushes FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND receiver_id <> auth.uid()
    AND public.crush_count(auth.uid()) < 3
  );

CREATE POLICY "Receivers can update crush guesses"
  ON public.crushes FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- REPORTS
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND reported_id <> auth.uid()
  );

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- ========================================
-- Enable Realtime for messages
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
