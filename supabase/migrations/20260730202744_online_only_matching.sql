-- Update find_or_wait_match to only match with users whose last_seen is recent (online)
-- Heartbeat updates every 60s; 90s threshold gives a small buffer while keeping the pool fresh.

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
    AND w.user_id IN (
      SELECT id FROM public.profiles
      WHERE last_seen IS NOT NULL
        AND last_seen >= now() - interval '90 seconds'
    )
  ORDER BY w.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF _partner IS NOT NULL THEN
    DELETE FROM public.waiting_pool WHERE user_id IN (_me, _partner);
    INSERT INTO public.chats(user1_id, user2_id) VALUES (_partner, _me) RETURNING id INTO _new_chat;
    RETURN QUERY SELECT _new_chat, _partner;
  ELSE
    -- Only add/renew the caller in the pool if they themselves are fresh enough to be considered online
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _me AND last_seen IS NOT NULL AND last_seen >= now() - interval '90 seconds') THEN
      INSERT INTO public.waiting_pool(user_id, gender, looking_for, blocked_ids)
      VALUES (_me, _my_gender, _looking_for, _my_blocks)
      ON CONFLICT (user_id) DO UPDATE SET looking_for = EXCLUDED.looking_for, blocked_ids = EXCLUDED.blocked_ids, created_at = now();
    END IF;
    RETURN QUERY SELECT NULL::UUID, NULL::UUID;
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.find_or_wait_match(public.gender_type) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.find_or_wait_match(public.gender_type) TO authenticated;
