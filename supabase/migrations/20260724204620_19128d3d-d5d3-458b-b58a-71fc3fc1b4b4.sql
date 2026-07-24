
-- 1. PROFILES: replace broad SELECT with own-row + chat-partner name lookup
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Security-definer helper returns only the minimal fields needed to display a chat partner
CREATE OR REPLACE FUNCTION public.get_chat_partner(_chat_id uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _partner uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT CASE WHEN c.user1_id = _me THEN c.user2_id
              WHEN c.user2_id = _me THEN c.user1_id
              ELSE NULL END
    INTO _partner
    FROM public.chats c WHERE c.id = _chat_id;
  IF _partner IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT p.id, p.name FROM public.profiles p WHERE p.id = _partner;
END;
$$;

REVOKE ALL ON FUNCTION public.get_chat_partner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_partner(uuid) TO authenticated;

-- 2. WAITING_POOL: restrict SELECT to own row only
DROP POLICY IF EXISTS wp_select_all_auth ON public.waiting_pool;

CREATE POLICY wp_select_self ON public.waiting_pool
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Harden find_or_wait_match: cross-check blocks table both directions in real time
CREATE OR REPLACE FUNCTION public.find_or_wait_match(_looking_for gender_type)
RETURNS TABLE(chat_id uuid, matched_with uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  SELECT w.user_id INTO _partner
  FROM public.waiting_pool w
  WHERE w.user_id <> _me
    AND w.gender = _looking_for
    AND w.looking_for = _my_gender
    AND NOT (w.user_id = ANY(_my_blocks))
    AND NOT (_me = ANY(w.blocked_ids))
    AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE b.blocker_id = _me AND b.blocked_id = w.user_id)
    AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE b.blocker_id = w.user_id AND b.blocked_id = _me)
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
END; $$;

-- 5. Lock down set_updated_at (internal trigger helper only)
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
