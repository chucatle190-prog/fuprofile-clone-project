-- Create game_scores table for leaderboard
CREATE TABLE public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('spin_wheel', 'word_puzzle')),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Policies for game_scores
CREATE POLICY "Game scores viewable by group members"
ON public.game_scores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = game_scores.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own game scores"
ON public.game_scores
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = game_scores.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own game scores"
ON public.game_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_game_scores_group_game ON public.game_scores(group_id, game_type, score DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_game_scores_updated_at
BEFORE UPDATE ON public.game_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for game_scores
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;

-- Create group_notifications table for realtime notifications
CREATE TABLE public.group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'member_joined', 'member_left', 'game_score')),
  content TEXT NOT NULL,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for group_notifications
CREATE POLICY "Group notifications viewable by group members"
ON public.group_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_notifications.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create group notifications"
ON public.group_notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_notifications.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Enable realtime for group_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_notifications;