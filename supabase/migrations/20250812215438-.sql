-- Allow property owners to update booking status for their properties
CREATE POLICY "Property owners can update bookings for their properties"
ON public.bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.properties
    WHERE properties.id = bookings.property_id
    AND properties.owner_id = auth.uid()
  )
);