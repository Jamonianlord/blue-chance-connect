ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz;

CREATE TABLE IF NOT EXISTS public.chat_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  game_type text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_games TO authenticated;
GRANT ALL ON public.chat_games TO service_role;

ALTER TABLE public.chat_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view games"
ON public.chat_games FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_games.chat_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())));

CREATE POLICY "Chat participants can create games"
ON public.chat_games FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_games.chat_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())));

CREATE POLICY "Chat participants can update games"
ON public.chat_games FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_games.chat_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_games.chat_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_games;