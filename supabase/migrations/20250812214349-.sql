-- Check for and fix all security definer views
-- First, let's see what functions have security definer
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND security_type = 'DEFINER';

-- Drop and recreate the problematic view without security definer
DROP VIEW IF EXISTS public.properties_public;

-- Create the view without security definer
CREATE VIEW public.properties_public AS
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