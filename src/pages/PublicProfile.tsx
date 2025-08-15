import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import Navbar from "@/components/Navbar";

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface UserReview {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  booking_id: string;
  bookings: {
    property_id: string;
    properties: {
      title: string;
    };
  };
}

interface HostReview {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  booking_id: string;
  reviewer: {
    full_name: string;
  };
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [guestReviews, setGuestReviews] = useState<UserReview[]>([]);
  const [hostReviews, setHostReviews] = useState<HostReview[]>([]);
  const [averageGuestRating, setAverageGuestRating] = useState<number>(0);
  const [averageHostRating, setAverageHostRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserRole();
      fetchGuestReviews();
      fetchHostReviews();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
      } else {
        setUserRole(data?.role || null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchGuestReviews = async () => {
    try {
      // Buscar avaliações como hóspede (user_review)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, booking_id')
        .eq('reviewed_id', userId)
        .eq('review_type', 'user_review')
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching guest reviews:', reviewsError);
        return;
      }

      if (!reviewsData || reviewsData.length === 0) {
        setGuestReviews([]);
        return;
      }

      // Obter detalhes das reservas para cada avaliação
      const reviewsWithBookings = await Promise.all(
        reviewsData.map(async (review) => {
          const { data: bookingData } = await supabase
            .from('bookings')
            .select(`
              property_id,
              properties!inner (
                title
              )
            `)
            .eq('id', review.booking_id)
            .single();

          return {
            ...review,
            bookings: bookingData || { property_id: '', properties: { title: 'Propriedade não encontrada' } }
          };
        })
      );

      setGuestReviews(reviewsWithBookings);
      
      // Calcular média das avaliações como hóspede
      const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
      const average = totalRating / reviewsData.length;
      setAverageGuestRating(average);
    } catch (error) {
      console.error('Error fetching guest reviews:', error);
    }
  };

  const fetchHostReviews = async () => {
    try {
      // Buscar avaliações como anfitrião (host_review)
      const { data: hostReviewsData, error: hostReviewsError } = await supabase
        .from('reviews')
        .select(`
          id, 
          rating, 
          comment, 
          created_at, 
          booking_id,
          reviewer_id
        `)
        .eq('reviewed_id', userId)
        .eq('review_type', 'host_review')
        .order('created_at', { ascending: false });

      if (hostReviewsError) {
        console.error('Error fetching host reviews:', hostReviewsError);
        return;
      }

      if (!hostReviewsData || hostReviewsData.length === 0) {
        setHostReviews([]);
        return;
      }

      // Obter informações dos reviewers
      const reviewsWithReviewers = await Promise.all(
        hostReviewsData.map(async (review) => {
          const { data: reviewerData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', review.reviewer_id)
            .single();

          return {
            ...review,
            reviewer: reviewerData || { full_name: 'Usuário não encontrado' }
          };
        })
      );

      setHostReviews(reviewsWithReviewers);
      
      // Calcular média das avaliações como anfitrião
      const totalRating = hostReviewsData.reduce((sum, review) => sum + review.rating, 0);
      const average = totalRating / hostReviewsData.length;
      setAverageHostRating(average);
    } catch (error) {
      console.error('Error fetching host reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Carregando perfil...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Perfil não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
                  {(guestReviews.length > 0 || hostReviews.length > 0) && (
                    <div className="flex items-center justify-center mt-2 space-x-2">
                      {guestReviews.length > 0 && (
                        <>
                          <div className="flex">{renderStars(Math.round(averageGuestRating))}</div>
                          <span className="text-sm text-muted-foreground">
                            {averageGuestRating.toFixed(1)} como hóspede
                          </span>
                        </>
                      )}
                      {hostReviews.length > 0 && userRole === 'proprietario' && (
                        <>
                          {guestReviews.length > 0 && <span className="text-muted-foreground">•</span>}
                          <div className="flex">{renderStars(Math.round(averageHostRating))}</div>
                          <span className="text-sm text-muted-foreground">
                            {averageHostRating.toFixed(1)} como anfitrião
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Sections */}
          <div className="space-y-8">
            {/* Avaliações como Hóspede */}
            <Card>
              <CardHeader>
                <CardTitle>Avaliações como Hóspede</CardTitle>
              </CardHeader>
              <CardContent>
                {guestReviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Ainda não há avaliações como hóspede para este usuário.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {guestReviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="flex">{renderStars(review.rating)}</div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Hospedagem em: {review.bookings.properties.title}
                            </p>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-foreground mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Avaliações como Anfitrião - só mostrar para proprietários */}
            {userRole === 'proprietario' && (
              <Card>
                <CardHeader>
                  <CardTitle>Avaliações como Anfitrião</CardTitle>
                </CardHeader>
                <CardContent>
                  {hostReviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Ainda não há avaliações como anfitrião para este usuário.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {hostReviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <div className="flex">{renderStars(review.rating)}</div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Por: {review.reviewer.full_name}
                              </p>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-foreground mt-2">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}