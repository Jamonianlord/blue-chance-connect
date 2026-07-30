-- Replace direct INSERT into friendships with a SECURITY DEFINER wrapper that
-- explicitly rejects requests when a block exists in either direction.
--
-- Direct INSERT RLS policies can be bypassed or behave inconsistently with
-- correlated subqueries, so the block check is enforced inside the DB function.

CREATE OR REPLACE FUNCTION public.send_friend_request(p_addressee_id uuid)
RETURNS TABLE(id uuid, requester_id uuid, addressee_id uuid, status public.friendship_status, chat_id uuid | null, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _new_row public.friendships;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF _me = p_addressee_id THEN
    RAISE EXCEPTION 'cannot send friend request to yourself';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.requester_id = _me AND f.addressee_id = p_addressee_id)
       OR (f.requester_id = p_addressee_id AND f.addressee_id = _me)
  ) THEN
    RAISE EXCEPTION 'friendship already exists or is pending';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.blocker_id = _me AND b.blocked_id = p_addressee_id
  ) THEN
    RAISE EXCEPTION 'you have blocked this user';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.blocker_id = p_addressee_id AND b.blocked_id = _me
  ) THEN
    RAISE EXCEPTION 'this user has blocked you';
  END IF;

  INSERT INTO public.friendships (requester_id, addressee_id, status)
  VALUES (_me, p_addressee_id, 'pending')
  RETURNING * INTO _new_row;

  RETURN QUERY SELECT
    _new_row.id,
    _new_row.requester_id,
    _new_row.addressee_id,
    _new_row.status,
    _new_row.chat_id,
    _new_row.created_at,
    _new_row.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.send_friend_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_friend_request(uuid) TO authenticated;

-- Remove direct INSERT privilege so all inserts must go through the wrapper.
REVOKE INSERT ON public.friendships FROM authenticated;
