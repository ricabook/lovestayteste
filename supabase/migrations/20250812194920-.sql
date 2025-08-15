-- Update the review_type column to include host_review
ALTER TYPE review_type RENAME TO review_type_old;

CREATE TYPE review_type AS ENUM ('property_review', 'user_review', 'host_review');

-- Update the reviews table to use the new enum
ALTER TABLE reviews ALTER COLUMN review_type TYPE review_type 
USING review_type::text::review_type;

-- Drop the old type
DROP TYPE review_type_old;