-- Create table for property date blocks
CREATE TABLE public.property_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, blocked_date)
);

-- Enable RLS
ALTER TABLE public.property_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Property owners can view their blocks" 
ON public.property_blocks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.properties 
    WHERE properties.id = property_blocks.property_id 
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can create blocks for their properties" 
ON public.property_blocks 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by 
  AND EXISTS (
    SELECT 1 
    FROM public.properties 
    WHERE properties.id = property_blocks.property_id 
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can delete their blocks" 
ON public.property_blocks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.properties 
    WHERE properties.id = property_blocks.property_id 
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all blocks" 
ON public.property_blocks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_property_blocks_updated_at
BEFORE UPDATE ON public.property_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();