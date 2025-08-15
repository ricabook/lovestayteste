-- Update the RLS policy to include host_review type
DROP POLICY IF EXISTS "Users can create reviews for completed bookings" ON reviews;

CREATE POLICY "Users can create reviews for completed bookings" 
ON reviews 
FOR INSERT 
WITH CHECK (
  (auth.uid() = reviewer_id) AND 
  (EXISTS (
    SELECT 1
    FROM bookings
    WHERE (
      bookings.id = reviews.booking_id AND 
      bookings.status = 'confirmed'::text AND 
      bookings.check_out_date < CURRENT_DATE AND 
      (
        -- Property review: guest can review property
        (bookings.user_id = auth.uid() AND reviews.review_type = 'property_review'::text) OR
        
        -- Host review: guest can review host
        (bookings.user_id = auth.uid() AND reviews.review_type = 'host_review'::text) OR
        
        -- User review: property owner can review guest
        (EXISTS (
          SELECT 1
          FROM properties
          WHERE (properties.id = bookings.property_id AND properties.owner_id = auth.uid())
        ) AND reviews.review_type = 'user_review'::text)
      )
    )
  ))
);