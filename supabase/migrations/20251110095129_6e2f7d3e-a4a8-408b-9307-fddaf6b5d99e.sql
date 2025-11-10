-- Create user_game_spins table to track remaining spins
CREATE TABLE public.user_game_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  remaining_spins INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.user_game_spins ENABLE ROW LEVEL SECURITY;

-- Policies for user_game_spins
CREATE POLICY "Users can view own game spins"
ON public.user_game_spins
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game spins"
ON public.user_game_spins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game spins"
ON public.user_game_spins
FOR UPDATE
USING (auth.uid() = user_id);

-- Create user_levels table
CREATE TABLE public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  experience_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Policies for user_levels
CREATE POLICY "Levels viewable by everyone"
ON public.user_levels
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own level"
ON public.user_levels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own level"
ON public.user_levels
FOR UPDATE
USING (auth.uid() = user_id);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('score', 'level', 'quiz')),
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Policy for badges
CREATE POLICY "Badges viewable by everyone"
ON public.badges
FOR SELECT
USING (true);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for user_badges
CREATE POLICY "User badges viewable by everyone"
ON public.user_badges
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own badges"
ON public.user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create quiz_completions table (one completion per day)
CREATE TABLE public.quiz_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  spins_awarded INTEGER NOT NULL DEFAULT 3,
  UNIQUE(user_id, group_id, completion_date)
);

-- Enable RLS
ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_completions
CREATE POLICY "Users can view own quiz completions"
ON public.quiz_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz completions"
ON public.quiz_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add triggers
CREATE TRIGGER update_user_game_spins_updated_at
BEFORE UPDATE ON public.user_game_spins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_levels_updated_at
BEFORE UPDATE ON public.user_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
('Người mới', 'Hoàn thành quiz lần đầu', '🌟', 'quiz', 1),
('Cao thủ', 'Đạt cấp độ 5', '⭐', 'level', 5),
('Huyền thoại', 'Tích lũy 1000 điểm', '🏆', 'score', 1000),
('Thiên thần', 'Hoàn thành quiz 10 lần', '👼', 'quiz', 10),
('Vua quay số', 'Tích lũy 5000 BTC', '💰', 'score', 5000);