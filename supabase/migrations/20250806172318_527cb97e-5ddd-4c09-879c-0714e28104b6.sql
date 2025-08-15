-- Add new role to the enum
ALTER TYPE app_role ADD VALUE 'proprietario';

-- Add status column to properties table
ALTER TABLE public.properties 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

-- Add constraint for valid status values
ALTER TABLE public.properties 
ADD CONSTRAINT properties_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing properties to be approved (so they remain visible)
UPDATE public.properties SET status = 'approved';

-- Create new RLS policies for proprietario role

-- Allow proprietarios to create properties (with pending status)
CREATE POLICY "Proprietarios can create properties" 
ON public.properties 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'proprietario'::app_role) AND 
  owner_id = auth.uid() AND 
  status = 'pending'
);

-- Allow proprietarios to view their own properties (any status)
CREATE POLICY "Proprietarios can view their own properties" 
ON public.properties 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'proprietario'::app_role) AND 
  owner_id = auth.uid()
);

-- Allow proprietarios to update their own properties (only certain fields)
CREATE POLICY "Proprietarios can update their own properties" 
ON public.properties 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'proprietario'::app_role) AND 
  owner_id = auth.uid()
);

-- Allow proprietarios to delete their own properties
CREATE POLICY "Proprietarios can delete their own properties" 
ON public.properties 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'proprietario'::app_role) AND 
  owner_id = auth.uid()
);

-- Update the existing public view policy to only show approved properties
DROP POLICY "Everyone can view available properties" ON public.properties;

CREATE POLICY "Everyone can view approved available properties" 
ON public.properties 
FOR SELECT 
USING (
  is_available = true AND 
  status = 'approved'
);

-- Allow proprietarios to view bookings for their properties
CREATE POLICY "Proprietarios can view bookings for their properties" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = bookings.property_id 
    AND properties.owner_id = auth.uid()
    AND has_role(auth.uid(), 'proprietario'::app_role)
  )
);