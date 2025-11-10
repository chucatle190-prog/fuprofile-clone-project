-- Add streak tracking to daily_tasks
ALTER TABLE public.daily_tasks
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_date DATE;

-- Create reward_history table
CREATE TABLE IF NOT EXISTS public.reward_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reward_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own reward history"
  ON public.reward_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reward history"
  ON public.reward_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);