
-- chat_type on chats
DO $$ BEGIN
  CREATE TYPE public.chat_type_enum AS ENUM ('random','friend');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS chat_type public.chat_type_enum NOT NULL DEFAULT 'random';

-- friendship status
DO $$ BEGIN
  CREATE TYPE public.friendship_status AS ENUM ('pending','accepted','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  chat_id uuid REFERENCES public.chats(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_unique
  ON public.friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS friendships_select_participant ON public.friendships;
CREATE POLICY friendships_select_participant ON public.friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS friendships_insert_requester ON public.friendships;
CREATE POLICY friendships_insert_requester ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

DROP POLICY IF EXISTS friendships_update_addressee_pending ON public.friendships;
CREATE POLICY friendships_update_addressee_pending ON public.friendships
  FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id AND status = 'pending')
  WITH CHECK (auth.uid() = addressee_id);

DROP POLICY IF EXISTS friendships_delete_participant ON public.friendships;
CREATE POLICY friendships_delete_participant ON public.friendships
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TRIGGER friendships_set_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- accept_friend_request: flip to accepted + create the friend chat
CREATE OR REPLACE FUNCTION public.accept_friend_request(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _f public.friendships%ROWTYPE;
  _chat_id uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _f FROM public.friendships WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
  IF _f.addressee_id <> _me THEN RAISE EXCEPTION 'not addressee'; END IF;
  IF _f.status <> 'pending' THEN RAISE EXCEPTION 'not pending'; END IF;

  IF _f.chat_id IS NULL THEN
    INSERT INTO public.chats(user1_id, user2_id, chat_type)
      VALUES (_f.requester_id, _f.addressee_id, 'friend')
      RETURNING id INTO _chat_id;
  ELSE
    _chat_id := _f.chat_id;
  END IF;

  UPDATE public.friendships
    SET status = 'accepted', chat_id = _chat_id, updated_at = now()
    WHERE id = p_request_id;

  RETURN _chat_id;
END; $$;

REVOKE ALL ON FUNCTION public.accept_friend_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_friend_request(uuid) TO authenticated;

-- unfriend: end associated chat + delete friendship
CREATE OR REPLACE FUNCTION public.unfriend(p_friendship_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _f public.friendships%ROWTYPE;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _f FROM public.friendships WHERE id = p_friendship_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF _me NOT IN (_f.requester_id, _f.addressee_id) THEN
    RAISE EXCEPTION 'not participant';
  END IF;
  IF _f.chat_id IS NOT NULL THEN
    UPDATE public.chats SET ended_at = COALESCE(ended_at, now()), ended_by = COALESCE(ended_by, _me)
      WHERE id = _f.chat_id;
  END IF;
  DELETE FROM public.friendships WHERE id = p_friendship_id;
END; $$;

REVOKE ALL ON FUNCTION public.unfriend(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unfriend(uuid) TO authenticated;
