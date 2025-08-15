-- Allow users to upload their own avatar images
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' AND 
  name LIKE 'avatars/' || auth.uid()::text || '%'
);

-- Allow users to update their own avatar images
CREATE POLICY "Users can update their own avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-images' AND 
  name LIKE 'avatars/' || auth.uid()::text || '%'
);

-- Allow users to delete their own avatar images
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-images' AND 
  name LIKE 'avatars/' || auth.uid()::text || '%'
);

-- Allow users to view their own avatar images
CREATE POLICY "Users can view their own avatars" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'property-images' AND 
  name LIKE 'avatars/' || auth.uid()::text || '%'
);