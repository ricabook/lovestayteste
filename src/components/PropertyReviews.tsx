import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  profiles?: {
    full_name: string;
  };
}

interface PropertyReviewsProps {
  propertyId: string;
}

const PropertyReviews = ({ propertyId }: PropertyReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      // Buscar reviews simples primeiro
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('property_id', propertyId)
        .eq('review_type', 'property_review')
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      // Buscar perfis dos reviewers
      const reviewsWithProfiles = await Promise.all(
        reviewsData.map(async (review) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', review.reviewer_id)
            .single();

          return {
            ...review,
            profiles: profileData || { full_name: 'Usuário' }
          };
        })
      );

      setReviews(reviewsWithProfiles);

      // Calcular média de avaliações
      const average = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
      setAverageRating(Math.round(average * 10) / 10);
    } catch (error) {
      console.error('Error fetching reviews:', error);
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
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando avaliações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Avaliações ({reviews.length})</span>
          {reviews.length > 0 && (
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} de 5
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Esta propriedade ainda não possui avaliações.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <Link 
                      to={`/profile/${review.reviewer_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {review.profiles?.full_name || 'Hóspede'}
                    </Link>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyReviews;