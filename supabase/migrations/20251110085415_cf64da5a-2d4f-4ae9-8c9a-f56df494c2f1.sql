-- Create story_reactions table
CREATE TABLE public.story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Story reactions viewable by everyone"
  ON public.story_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create story reactions"
  ON public.story_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own story reactions"
  ON public.story_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own story reactions"
  ON public.story_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Message reactions viewable by conversation members"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation members can create message reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own message reactions"
  ON public.message_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own message reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;