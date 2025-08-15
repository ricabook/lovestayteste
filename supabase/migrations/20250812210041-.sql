-- CRITICAL SECURITY FIXES
-- Phase 1: Remove dangerous public access policies

-- Drop public access to profiles table (CRITICAL: exposes personal data)
DROP POLICY IF EXISTS "Everyone can view basic profile info" ON public.profiles;

-- Drop public access to user_roles table (CRITICAL: exposes role information)
DROP POLICY IF EXISTS "Everyone can view user roles" ON public.user_roles;

-- Phase 2: Create secure, targeted profile access policies
-- Property owners can view profiles of users who have bookings with their properties
CREATE POLICY "Property owners can view guest profiles for their bookings" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.bookings b
    JOIN public.properties p ON b.property_id = p.id
    WHERE b.user_id = profiles.user_id 
    AND p.owner_id = auth.uid()
  )
);

-- Users involved in reviews can view each other's basic profile info
CREATE POLICY "Users can view profiles of review participants" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.reviews r
    WHERE (r.reviewer_id = auth.uid() AND r.reviewed_id = profiles.user_id)
    OR (r.reviewed_id = auth.uid() AND r.reviewer_id = profiles.user_id)
  )
);

-- Phase 3: Fix database function security vulnerabilities
-- Update get_current_user_role function with proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Update has_role function with explicit search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;