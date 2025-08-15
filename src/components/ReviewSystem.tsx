import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string;
  review_type: 'property_review' | 'user_review' | 'host_review';
  created_at: string;
  reviewer_id: string;
  reviewed_id: string;
}

interface ReviewSystemProps {
  bookingId: string;
  propertyId: string;
  propertyOwnerId: string;
  userId: string;
  checkOutDate: string;
  propertyTitle: string;
  userName: string;
}

const ReviewSystem = ({ 
  bookingId, 
  propertyId, 
  propertyOwnerId, 
  userId, 
  checkOutDate,
  propertyTitle,
  userName
}: ReviewSystemProps) => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [propertyReview, setPropertyReview] = useState<Review | null>(null);
  const [hostReview, setHostReview] = useState<Review | null>(null);
  
  // Form states for property review
  const [propertyRating, setPropertyRating] = useState(0);
  const [propertyComment, setPropertyComment] = useState('');
  
  // Form states for host review
  const [hostRating, setHostRating] = useState(0);
  const [hostComment, setHostComment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkIfCanReview();
    fetchExistingReviews();
  }, [checkOutDate]);

  const checkIfCanReview = () => {
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Pode avaliar apenas após o check-out
    setCanReview(checkOut < today);
  };

  const fetchExistingReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId);

      if (error) throw error;

      const reviewsData = (data || []) as Review[];
      setReviews(reviewsData);
      
      // Separar avaliações por tipo
      const userRev = reviewsData.find(r => r.review_type === 'user_review');
      const propRev = reviewsData.find(r => r.review_type === 'property_review');
      const hostRev = reviewsData.find(r => r.review_type === 'host_review');
      
      setUserReview(userRev || null);
      setPropertyReview(propRev || null);
      setHostReview(hostRev || null);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitPropertyReview = async () => {
    if (!user || propertyRating === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user.id,
          reviewed_id: propertyOwnerId,
          property_id: propertyId,
          rating: propertyRating,
          comment: propertyComment.trim() || null,
          review_type: 'property_review'
        });

      if (error) throw error;

      toast({
        title: 'Avaliação enviada',
        description: 'Sua avaliação da propriedade foi registrada com sucesso.',
      });

      // Reset form
      setPropertyRating(0);
      setPropertyComment('');
      
      // Refetch reviews
      fetchExistingReviews();
    } catch (error: any) {
      console.error('Error submitting property review:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar avaliação',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitHostReview = async () => {
    if (!user || hostRating === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user.id,
          reviewed_id: propertyOwnerId,
          property_id: propertyId,
          rating: hostRating,
          comment: hostComment.trim() || null,
          review_type: 'host_review'
        });

      if (error) throw error;

      toast({
        title: 'Avaliação enviada',
        description: 'Sua avaliação do anfitrião foi registrada com sucesso.',
      });

      // Reset form
      setHostRating(0);
      setHostComment('');
      
      // Refetch reviews
      fetchExistingReviews();
    } catch (error: any) {
      console.error('Error submitting host review:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar avaliação',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitUserReview = async () => {
    if (!user || propertyRating === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user.id,
          reviewed_id: userId,
          property_id: propertyId,
          rating: propertyRating,
          comment: propertyComment.trim() || null,
          review_type: 'user_review'
        });

      if (error) throw error;

      toast({
        title: 'Avaliação enviada',
        description: 'Sua avaliação do hóspede foi registrada com sucesso.',
      });

      // Reset form
      setPropertyRating(0);
      setPropertyComment('');
      
      // Refetch reviews
      fetchExistingReviews();
    } catch (error: any) {
      console.error('Error submitting user review:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar avaliação',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= currentRating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const canUserReview = canReview && user?.id === userId && (!propertyReview || !hostReview);
  const canOwnerReview = canReview && user?.id === propertyOwnerId && !userReview;

  if (!canReview) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            As avaliações estarão disponíveis após o término da estadia.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Sistema de Avaliações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulários de avaliação para usuário */}
        {canUserReview && (
          <div className="space-y-6">
            {/* Avaliação da Propriedade */}
            {!propertyReview && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold">Avaliar {propertyTitle}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Sua avaliação da propriedade:</label>
                    {renderStars(propertyRating, true, setPropertyRating)}
                  </div>
                  <Textarea
                    placeholder="Deixe um comentário sobre a propriedade (opcional)"
                    value={propertyComment}
                    onChange={(e) => setPropertyComment(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSubmitPropertyReview}
                    disabled={propertyRating === 0 || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Avaliação da Propriedade'}
                  </Button>
                </div>
              </div>
            )}

            {/* Avaliação do Anfitrião */}
            {!hostReview && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold">Avaliar Anfitrião</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Sua avaliação do anfitrião:</label>
                    {renderStars(hostRating, true, setHostRating)}
                  </div>
                  <Textarea
                    placeholder="Deixe um comentário sobre o anfitrião (opcional)"
                    value={hostComment}
                    onChange={(e) => setHostComment(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSubmitHostReview}
                    disabled={hostRating === 0 || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Avaliação do Anfitrião'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formulário de avaliação para proprietário */}
        {canOwnerReview && (
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-semibold">Avaliar Hóspede: {userName}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Sua avaliação:</label>
                {renderStars(propertyRating, true, setPropertyRating)}
              </div>
              <Textarea
                placeholder="Deixe um comentário sobre o hóspede (opcional)"
                value={propertyComment}
                onChange={(e) => setPropertyComment(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleSubmitUserReview}
                disabled={propertyRating === 0 || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </div>
          </div>
        )}

        {/* Exibir avaliações existentes */}
        {reviews.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Avaliações desta Reserva</h3>
            
            {propertyReview && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Avaliação da Propriedade</span>
                  {renderStars(propertyReview.rating)}
                </div>
                {propertyReview.comment && (
                  <p className="text-sm text-muted-foreground">{propertyReview.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(propertyReview.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {hostReview && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Avaliação do Anfitrião</span>
                  {renderStars(hostReview.rating)}
                </div>
                {hostReview.comment && (
                  <p className="text-sm text-muted-foreground">{hostReview.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(hostReview.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {userReview && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Avaliação do Hóspede</span>
                  {renderStars(userReview.rating)}
                </div>
                {userReview.comment && (
                  <p className="text-sm text-muted-foreground">{userReview.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(userReview.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        )}

        {reviews.length === 0 && canReview && !canUserReview && !canOwnerReview && (
          <p className="text-muted-foreground text-center">
            Nenhuma avaliação disponível ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewSystem;