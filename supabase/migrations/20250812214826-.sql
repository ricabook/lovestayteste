-- Allow public access to view property owner roles
CREATE POLICY "Public can view property owner roles"
ON public.user_roles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.properties
    WHERE properties.owner_id = user_roles.user_id
    AND properties.status = 'approved'
    AND properties.is_available = true
  )
);