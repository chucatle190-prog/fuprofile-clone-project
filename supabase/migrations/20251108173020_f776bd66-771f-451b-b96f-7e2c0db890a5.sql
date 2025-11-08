-- Add music fields to stories table
ALTER TABLE public.stories
ADD COLUMN music_name TEXT,
ADD COLUMN music_artist TEXT,
ADD COLUMN music_url TEXT;