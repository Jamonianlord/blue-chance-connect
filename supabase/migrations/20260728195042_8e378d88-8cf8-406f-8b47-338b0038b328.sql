ALTER TABLE public.friendships
  ADD COLUMN IF NOT EXISTS requester_last_read_at timestamptz NOT NULL DEFAULT '-infinity',
  ADD COLUMN IF NOT EXISTS addressee_last_read_at timestamptz NOT NULL DEFAULT '-infinity';

DROP FUNCTION IF EXISTS public.get_my_friends();

CREATE FUNCTION public.get_my_friends()
RETURNS TABLE(
  friendship_id uuid,
  chat_id uuid,
  friend_id uuid,
  friend_name text,
  friend_avatar_url text,
  created_at timestamptz,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  last_message_kind text,
  last_message_text text,
  unread_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _me uuid := auth.uid();
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  RETURN QUERY
  SELECT
    f.id,
    f.chat_id,
    p.id,
    p.name,
    p.avatar_url,
    f.created_at,
    lm.created_at,
    lm.sender_id,
    lm.kind,
    lm.text,
    COALESCE(uc.cnt, 0)::int
  FROM public.friendships f
  JOIN public.profiles p
    ON p.id = CASE WHEN f.requester_id = _me THEN f.addressee_id ELSE f.requester_id END
  LEFT JOIN LATERAL (
    SELECT m.created_at,
           m.sender_id,
           CASE
             WHEN COALESCE(to_jsonb(m) ->> 'audio_url', '') <> '' THEN 'audio'
             WHEN COALESCE(m.image_url, '') <> '' THEN 'image'
             ELSE 'text'
           END AS kind,
           m.content AS text
    FROM public.messages m
    WHERE m.chat_id = f.chat_id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON TRUE
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM public.messages m2
    WHERE m2.chat_id = f.chat_id
      AND m2.sender_id <> _me
      AND m2.created_at > CASE WHEN f.requester_id = _me THEN f.requester_last_read_at ELSE f.addressee_last_read_at END
  ) uc ON TRUE
  WHERE f.status = 'accepted'
    AND (f.requester_id = _me OR f.addressee_id = _me)
  ORDER BY COALESCE(lm.created_at, f.created_at) DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_friends() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_friends() TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_chat_read(_chat_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _me uuid := auth.uid();
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.friendships f
    SET requester_last_read_at = CASE WHEN f.requester_id = _me THEN now() ELSE f.requester_last_read_at END,
        addressee_last_read_at = CASE WHEN f.addressee_id = _me THEN now() ELSE f.addressee_last_read_at END
  WHERE f.chat_id = _chat_id AND (f.requester_id = _me OR f.addressee_id = _me);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_chat_read(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mark_chat_read(uuid) TO authenticated;