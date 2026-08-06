-- Meet actions table for tracking Add/Skip actions
CREATE TABLE IF NOT EXISTS public.meet_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('add', 'skip')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, target_id)
);

ALTER TABLE public.meet_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meet_actions_insert_self" ON public.meet_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meet_actions_select_self" ON public.meet_actions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX ON public.meet_actions (user_id, action, created_at);