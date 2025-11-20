-- Create table for favorite songs
CREATE TABLE public.favorite_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, song_id)
);

-- Enable RLS
ALTER TABLE public.favorite_songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorite_songs
CREATE POLICY "Users can view own favorites"
  ON public.favorite_songs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
  ON public.favorite_songs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON public.favorite_songs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for song lyrics with timestamps
CREATE TABLE public.song_lyrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  lyrics JSONB NOT NULL, -- Array of {text: string, startTime: number, endTime: number}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.song_lyrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for song_lyrics (public read)
CREATE POLICY "Lyrics viewable by everyone"
  ON public.song_lyrics
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert lyrics"
  ON public.song_lyrics
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lyrics"
  ON public.song_lyrics
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Enable realtime for favorite_songs
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_songs;