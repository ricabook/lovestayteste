import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PropertyRatingProps {
  propertyId: string;
  compact?: boolean;
}

const PropertyRating = ({ propertyId, compact = false }: PropertyRatingProps) => {
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
      const roundedUp = Math.ceil(average * 10) / 10; // Arredondar para cima com 1 casa decimal

      setAverageRating(roundedUp);
      setReviewCount(reviewsData.length);
    } catch (error) {
      console.error('Error fetching average rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (compact) {
    if (loading) {
      return <span className="text-muted-foreground">Carregando...</span>;
    }
    
    return (
      <div className="flex items-center gap-2">
        {reviewCount === 0 ? (
          <span className="text-muted-foreground">Sem avaliações</span>
        ) : (
          <>
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nota do Quarto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando nota...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nota do Quarto</CardTitle>
      </CardHeader>
      <CardContent>
        {reviewCount === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Este quarto ainda não foi avaliado.</p>
            <div className="flex justify-center mt-2">
              {renderStars(0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">0,0</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-2">
              {renderStars(Math.floor(averageRating))}
            </div>
            <p className="text-2xl font-bold text-primary mb-1">
              {averageRating.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">
              Baseado em {reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyRating;