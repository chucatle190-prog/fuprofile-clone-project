-- Enable realtime for specific tables that are not yet enabled

-- Posts table (for feed updates)
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Group posts table (for group updates)
ALTER TABLE public.group_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_posts;

-- Comments table
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Likes table
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;