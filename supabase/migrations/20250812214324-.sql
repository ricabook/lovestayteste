-- Fix the security definer view issue
-- Remove the problematic view and recreate without security definer
DROP VIEW IF EXISTS public.properties_secure_view;

-- Create a regular view instead
CREATE VIEW public.properties_secure_view AS
SELECT 
  id,
  title,
  description,
  price_per_night,
  address,
  city,
  country,
  bedrooms,
  bathrooms,
  max_guests,
  amenities,
  images,
  is_available,
  created_at,
  updated_at,
  status,
  cep
FROM public.properties
WHERE status = 'approved' AND is_available = true;