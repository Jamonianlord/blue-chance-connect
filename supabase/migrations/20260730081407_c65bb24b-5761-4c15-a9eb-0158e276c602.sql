ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

NOTIFY pgrst, 'reload schema';