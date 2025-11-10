-- Create daily_tasks table for tracking user daily tasks
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  post_created BOOLEAN DEFAULT FALSE,
  games_played INTEGER DEFAULT 0,
  messages_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_date)
);

-- Enable RLS
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily tasks"
  ON public.daily_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily tasks"
  ON public.daily_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tasks"
  ON public.daily_tasks
  FOR UPDATE
  USING (auth.uid() = user_id);