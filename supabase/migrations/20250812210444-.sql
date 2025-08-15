-- Fix security definer view issue
-- Drop the problematic view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.properties_public;

-- Create a simple view without SECURITY DEFINER (inherits caller's permissions)
CREATE VIEW public.properties_public AS
SELECT 
  id,
  title,
  description,
  address,
  city,
  country,
  cep,
  price_per_night,
  bedrooms,
  bathrooms,
  max_guests,
  amenities,
  images,
  is_available,
  status,
  created_at,
  updated_at
FROM public.properties
WHERE status = 'approved' AND is_available = true;

-- Fix remaining function search path issue
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_roles text[];
BEGIN
  -- Retrieve roles from app_metadata
  SELECT COALESCE(
    (auth.jwt()->>'app_metadata')::jsonb->>'roles', 
    '[]'
  )::text[] INTO user_roles;
  
  -- Check if 'admin' is in the roles array
  RETURN 'admin' = ANY(user_roles);
END;
$$;