-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  reviewed_id UUID NOT NULL,
  property_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_type TEXT NOT NULL CHECK (review_type IN ('property_review', 'user_review')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reviewer_id, review_type)
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Users can view reviews where they are involved" 
ON public.reviews 
FOR SELECT 
USING (
  auth.uid() = reviewer_id OR 
  auth.uid() = reviewed_id OR
  review_type = 'property_review'
);

CREATE POLICY "Users can create reviews for completed bookings" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 
    FROM bookings 
    WHERE bookings.id = booking_id 
    AND bookings.status = 'confirmed'
    AND bookings.check_out_date < CURRENT_DATE
    AND (
      (bookings.user_id = auth.uid() AND review_type = 'property_review') OR
      (EXISTS (
        SELECT 1 
        FROM properties 
        WHERE properties.id = bookings.property_id 
        AND properties.owner_id = auth.uid()
      ) AND review_type = 'user_review')
    )
  )
);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();