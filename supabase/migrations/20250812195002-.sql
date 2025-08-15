-- Add constraint to allow the new review type
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;

-- Add new constraint that includes host_review
ALTER TABLE reviews ADD CONSTRAINT reviews_review_type_check 
CHECK (review_type IN ('property_review', 'user_review', 'host_review'));