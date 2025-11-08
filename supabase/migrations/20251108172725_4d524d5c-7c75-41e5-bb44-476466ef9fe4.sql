-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Stories are viewable by friends"
ON public.stories
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (user_id = auth.uid() AND friend_id = stories.user_id AND status = 'accepted') OR
      (friend_id = auth.uid() AND user_id = stories.user_id AND status = 'accepted')
    )
  )
);

CREATE POLICY "Users can create own stories"
ON public.stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
ON public.stories
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;