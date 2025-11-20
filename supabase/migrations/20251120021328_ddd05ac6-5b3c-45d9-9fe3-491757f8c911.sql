-- Create table for season champions
CREATE TABLE IF NOT EXISTS public.season_champions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  season_number INTEGER NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
  category TEXT NOT NULL CHECK (category IN ('holder', 'receiver', 'sender')),
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(season_number, rank, category)
);

-- Enable RLS
ALTER TABLE public.season_champions ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing champions
CREATE POLICY "Season champions viewable by everyone"
  ON public.season_champions
  FOR SELECT
  USING (true);

-- Create policy for inserting champions (admin only, but we'll use edge function)
CREATE POLICY "System can insert season champions"
  ON public.season_champions
  FOR INSERT
  WITH CHECK (true);

-- Add index for efficient queries
CREATE INDEX idx_season_champions_user_id ON public.season_champions(user_id);
CREATE INDEX idx_season_champions_season ON public.season_champions(season_number);

-- Function to get current season number (week number since launch)
CREATE OR REPLACE FUNCTION public.get_current_season()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  -- Assumes season 1 started on 2025-01-01, adjust as needed
  SELECT FLOOR(EXTRACT(EPOCH FROM (NOW() - '2025-01-01'::timestamp)) / (7 * 24 * 60 * 60))::INTEGER + 1;
$$;