-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']::text[]
);

-- Create RLS policies for videos bucket
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);