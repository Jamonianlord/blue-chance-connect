ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric,
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.chat_games(id) ON DELETE SET NULL;