-- Thêm trường để theo dõi chỉnh sửa tin nhắn
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Thêm bảng group_posts cho bài đăng trong nhóm
CREATE TABLE IF NOT EXISTS public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- Policies cho group_posts
CREATE POLICY "Group members can view posts"
ON public.group_posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_posts.group_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Group members can create posts"
ON public.group_posts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_posts.group_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own posts"
ON public.group_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON public.group_posts
FOR DELETE
USING (auth.uid() = user_id);

-- Policy cho phép users update tin nhắn của mình
CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- Policy cho phép users delete tin nhắn của mình  
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);