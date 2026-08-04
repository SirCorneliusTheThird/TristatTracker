CREATE TYPE public.platform AS ENUM ('steam','epic');
CREATE TYPE public.visibility AS ENUM ('public','friends','private');
CREATE TYPE public.presence AS ENUM ('online','offline','in-game','idle');
CREATE TYPE public.goal_type AS ENUM ('playtime','achievement','game');
CREATE TYPE public.goal_status AS ENUM ('active','completed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Player',
  avatar_url text,
  visibility public.visibility NOT NULL DEFAULT 'public',
  hide_playtime boolean NOT NULL DEFAULT false,
  hide_achievements boolean NOT NULL DEFAULT false,
  hide_online_status boolean NOT NULL DEFAULT false,
  hide_activity boolean NOT NULL DEFAULT false,
  kids_mode boolean NOT NULL DEFAULT false,
  hide_friends_list boolean NOT NULL DEFAULT false,
  parental_pin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.linked_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  platform public.platform NOT NULL,
  platform_user_id text NOT NULL,
  platform_username text NOT NULL,
  avatar_url text,
  linked_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz,
  UNIQUE (user_id, platform)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linked_accounts TO authenticated;
GRANT ALL ON public.linked_accounts TO service_role;
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own links" ON public.linked_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  platform public.platform NOT NULL,
  app_id text NOT NULL,
  name text NOT NULL,
  cover_url text,
  playtime_minutes integer NOT NULL DEFAULT 0,
  achievements_unlocked integer NOT NULL DEFAULT 0,
  achievements_total integer NOT NULL DEFAULT 0,
  last_played_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, app_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own games" ON public.games FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  platform public.platform NOT NULL,
  platform_friend_id text NOT NULL,
  name text NOT NULL,
  avatar_url text,
  status public.presence NOT NULL DEFAULT 'offline',
  current_game text,
  last_played_game text,
  last_played_at timestamptz,
  is_private boolean NOT NULL DEFAULT false,
  total_playtime_minutes integer NOT NULL DEFAULT 0,
  games_count integer NOT NULL DEFAULT 0,
  achievements_count integer NOT NULL DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, platform_friend_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friends TO authenticated;
GRANT ALL ON public.friends TO service_role;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own friends" ON public.friends FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  friend_id uuid REFERENCES public.friends(id) ON DELETE CASCADE,
  platform public.platform NOT NULL,
  kind text NOT NULL,
  actor_name text NOT NULL,
  actor_avatar text,
  title text NOT NULL,
  detail text,
  game_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity" ON public.activity_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  goal_type public.goal_type NOT NULL,
  platform public.platform,
  game_name text,
  target_value integer NOT NULL CHECK (target_value > 0),
  current_value integer NOT NULL DEFAULT 0,
  status public.goal_status NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
  kind text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_events TO authenticated;
GRANT ALL ON public.goal_events TO service_role;
ALTER TABLE public.goal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal events" ON public.goal_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), 'Player'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();