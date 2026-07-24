
-- Gender enum
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT NOT NULL CHECK (age >= 18 AND age <= 120),
  gender public.gender_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Waiting pool (users looking for a match)
CREATE TABLE public.waiting_pool (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender public.gender_type NOT NULL,
  looking_for public.gender_type NOT NULL,
  blocked_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiting_pool TO authenticated;
GRANT ALL ON public.waiting_pool TO service_role;
ALTER TABLE public.waiting_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wp_select_all_auth" ON public.waiting_pool FOR SELECT TO authenticated USING (true);
CREATE POLICY "wp_insert_self" ON public.waiting_pool FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wp_delete_self" ON public.waiting_pool FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chats
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ended_at TIMESTAMPTZ,
  ended_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chats_user1_idx ON public.chats(user1_id);
CREATE INDEX chats_user2_idx ON public.chats(user2_id);
GRANT SELECT, INSERT, UPDATE ON public.chats TO authenticated;
GRANT ALL ON public.chats TO service_role;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chats_select_participant" ON public.chats FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "chats_insert_participant" ON public.chats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "chats_update_participant" ON public.chats FOR UPDATE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_chat_idx ON public.messages(chat_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_participant" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)));
CREATE POLICY "messages_insert_participant" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id) AND c.ended_at IS NULL)
  );

-- Typing indicator (ephemeral via broadcast, but keep a table? use realtime broadcast instead)

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert_self" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_self" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Blocks
CREATE TABLE public.blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_manage_self" ON public.blocks FOR ALL TO authenticated
  USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Matchmaking function: atomically find opposite-gender waiting user and create chat
CREATE OR REPLACE FUNCTION public.find_or_wait_match(
  _looking_for public.gender_type
) RETURNS TABLE(chat_id UUID, matched_with UUID) AS $$
DECLARE
  _me UUID := auth.uid();
  _my_gender public.gender_type;
  _partner UUID;
  _new_chat UUID;
  _my_blocks UUID[];
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT gender INTO _my_gender FROM public.profiles WHERE id = _me;
  IF _my_gender IS NULL THEN RAISE EXCEPTION 'no profile'; END IF;

  SELECT COALESCE(array_agg(blocked_id), '{}') INTO _my_blocks FROM public.blocks WHERE blocker_id = _me;

  -- Try to find a waiting user matching criteria
  SELECT w.user_id INTO _partner
  FROM public.waiting_pool w
  WHERE w.user_id <> _me
    AND w.gender = _looking_for
    AND w.looking_for = _my_gender
    AND NOT (w.user_id = ANY(_my_blocks))
    AND NOT (_me = ANY(w.blocked_ids))
  ORDER BY w.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF _partner IS NOT NULL THEN
    DELETE FROM public.waiting_pool WHERE user_id IN (_me, _partner);
    INSERT INTO public.chats(user1_id, user2_id) VALUES (_partner, _me) RETURNING id INTO _new_chat;
    RETURN QUERY SELECT _new_chat, _partner;
  ELSE
    INSERT INTO public.waiting_pool(user_id, gender, looking_for, blocked_ids)
    VALUES (_me, _my_gender, _looking_for, _my_blocks)
    ON CONFLICT (user_id) DO UPDATE SET looking_for = EXCLUDED.looking_for, blocked_ids = EXCLUDED.blocked_ids, created_at = now();
    RETURN QUERY SELECT NULL::UUID, NULL::UUID;
  END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.find_or_wait_match(public.gender_type) TO authenticated;

-- End chat function
CREATE OR REPLACE FUNCTION public.end_chat(_chat_id UUID) RETURNS void AS $$
BEGIN
  UPDATE public.chats SET ended_at = now(), ended_by = auth.uid()
  WHERE id = _chat_id AND (user1_id = auth.uid() OR user2_id = auth.uid()) AND ended_at IS NULL;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.end_chat(UUID) TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
