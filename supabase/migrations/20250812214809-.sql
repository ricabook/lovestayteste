-- Allow public access to view property owner profiles
CREATE POLICY "Public can view property owner profiles"
ON public.profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.properties
    WHERE properties.owner_id = profiles.user_id
    AND properties.status = 'approved'
    AND properties.is_available = true
  )
);