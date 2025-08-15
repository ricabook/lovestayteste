-- Create policy to allow property owners to view bookings for their properties
CREATE POLICY "Property owners can view bookings for their properties" 
ON public.bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.properties 
    WHERE properties.id = bookings.property_id 
    AND properties.owner_id = auth.uid()
  )
);