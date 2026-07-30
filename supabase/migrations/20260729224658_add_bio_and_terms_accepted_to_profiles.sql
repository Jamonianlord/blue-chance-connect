-- Add bio and terms_accepted_at columns to profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text NULL,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz NULL;