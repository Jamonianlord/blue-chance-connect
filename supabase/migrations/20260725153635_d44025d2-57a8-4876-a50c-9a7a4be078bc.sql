
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_content_or_image') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_content_or_image
      CHECK (content IS NOT NULL OR image_url IS NOT NULL);
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_chat_partner(uuid);
CREATE OR REPLACE FUNCTION public.get_chat_partner(_chat_id uuid)
 RETURNS TABLE(id uuid, name text, avatar_url text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  RETURN QUERY SELECT p.id, p.name, p.avatar_url FROM public.profiles p WHERE p.id = _partner;
END;
$function$;

-- Storage RLS policies
-- profile-photos (public bucket): anyone can read, users write only their own folder
CREATE POLICY "profile_photos_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "profile_photos_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "profile_photos_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- chat-images (private bucket): only chat participants can read/write, path = {chatId}/...
CREATE POLICY "chat_images_read_participant" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-images' AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );
CREATE POLICY "chat_images_insert_participant" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images' AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        AND c.ended_at IS NULL
    )
  );
