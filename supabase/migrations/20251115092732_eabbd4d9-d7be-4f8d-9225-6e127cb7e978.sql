-- Create pool_games table for game sessions
CREATE TABLE public.pool_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL,
  player2_id UUID,
  current_player INTEGER DEFAULT 0,
  game_state JSONB NOT NULL DEFAULT '{"balls": [], "shooting": false}'::jsonb,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pool_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view games in their groups"
ON public.pool_games
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = pool_games.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create games in their groups"
ON public.pool_games
FOR INSERT
WITH CHECK (
  auth.uid() = player1_id
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = pool_games.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Players can update their games"
ON public.pool_games
FOR UPDATE
USING (
  auth.uid() = player1_id OR auth.uid() = player2_id
);

-- Create index for faster queries
CREATE INDEX idx_pool_games_group_id ON public.pool_games(group_id);
CREATE INDEX idx_pool_games_status ON public.pool_games(status);

-- Create trigger for updated_at
CREATE TRIGGER update_pool_games_updated_at
BEFORE UPDATE ON public.pool_games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for pool_games
ALTER PUBLICATION supabase_realtime ADD TABLE public.pool_games;