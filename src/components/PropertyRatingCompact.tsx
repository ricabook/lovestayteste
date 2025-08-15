import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface PropertyRatingCompactProps {
  propertyId: string;
}

const PropertyRatingCompact = ({ propertyId }: PropertyRatingCompactProps) => {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAverageRating();
  }, [propertyId]);

  const fetchAverageRating = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId)
        .eq('review_type', 'property_review');

      if (error) throw error;

      if (!reviewsData || reviewsData.length === 0) {
        setAverageRating(0);
        setReviewCount(0);
        setLoading(false);
        return;
      }

      // Calcular média e arredondar para cima
      const sum = reviewsData.reduce((acc, review) => acc + review.rating, 0);
      const average = sum / reviewsData.length;
      const roundedAverage = Math.round(average * 10) / 10; // Arredondar com 1 casa decimal

      setAverageRating(roundedAverage);
      setReviewCount(reviewsData.length);
    } catch (error) {
      console.error('Error fetching average rating:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="w-12 h-4 bg-muted rounded animate-pulse"></div>;
  }

  if (reviewCount === 0) {
    return (
      <Badge variant="secondary" className="text-xs">
        Nova
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm">⭐</span>
      <span className="text-sm text-foreground">
        {averageRating.toFixed(1)}
      </span>
    </div>
  );
};

export default PropertyRatingCompact;