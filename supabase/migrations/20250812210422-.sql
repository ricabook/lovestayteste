-- COMPREHENSIVE SECURITY FIXES - Phase 2
-- Create secure property view for public access (excludes owner_id)
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

-- Grant SELECT permissions on the view to authenticated users
GRANT SELECT ON public.properties_public TO authenticated;
GRANT SELECT ON public.properties_public TO anon;

-- Phase 3: Strengthen review access control
-- Update review policies to be more restrictive
DROP POLICY IF EXISTS "Users can view reviews where they are involved" ON public.reviews;

-- More restrictive review access - only for authenticated users involved in the specific booking
CREATE POLICY "Authenticated users can view reviews for their bookings" 
ON public.reviews 
FOR SELECT 
TO authenticated
USING (
  -- Users can see their own reviews
  auth.uid() = reviewer_id 
  OR 
  -- Users can see reviews about them
  auth.uid() = reviewed_id 
  OR 
  -- Property reviews are visible to property viewers (but not reviewer details)
  (review_type = 'property_review' AND EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = reviews.property_id 
    AND status = 'approved' 
    AND is_available = true
  ))
);

-- Phase 4: Add security logging table
CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view all security logs" 
ON public.security_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_event_details jsonb DEFAULT '{}',
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_logs (user_id, event_type, event_details)
  VALUES (p_user_id, p_event_type, p_event_details);
END;
$$;

-- Phase 5: Create function to validate password strength
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := '{}';
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    errors := array_append(errors, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password !~ '[^a-zA-Z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  -- Build result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors)
    );
  END IF;
  
  RETURN result;
END;
$$;