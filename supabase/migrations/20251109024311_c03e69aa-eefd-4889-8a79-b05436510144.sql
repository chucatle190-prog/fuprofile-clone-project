-- Create storage policies for covers bucket (marketplace images)
CREATE POLICY "Users can upload their own marketplace images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own marketplace images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own marketplace images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Marketplace images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'covers');