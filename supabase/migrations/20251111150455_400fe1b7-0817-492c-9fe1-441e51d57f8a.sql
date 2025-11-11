-- Create table to track which scores have been claimed
CREATE TABLE IF NOT EXISTS public.claimed_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_score_id UUID NOT NULL REFERENCES game_scores(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_amount NUMERIC NOT NULL,
  UNIQUE(game_score_id)
);

-- Enable RLS
ALTER TABLE public.claimed_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own claimed rewards
CREATE POLICY "Users can view own claimed rewards"
ON public.claimed_rewards
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own claimed rewards
CREATE POLICY "Users can insert own claimed rewards"
ON public.claimed_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_claimed_rewards_user_id ON public.claimed_rewards(user_id);
CREATE INDEX idx_claimed_rewards_game_score_id ON public.claimed_rewards(game_score_id);