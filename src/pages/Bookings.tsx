import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ReviewSystem from '@/components/ReviewSystem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  total_price: number;
  guest_count: number;
  status: string;
  property_id: string;
  user_id: string;
  properties: {
    id: string;
    title: string;
    city: string;
    country: string;
    images: string[];
    owner_id: string;
  } | null;
}

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBookings();
      
      // Subscribe to real-time updates for bookings
      const channel = supabase
        .channel('bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('Booking updated, refetching...');
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            id,
            title,
            city,
            country,
            images,
            owner_id
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar reservas',
          variant: 'destructive',
        });
      } else {
        const bookingsData = data || [];
        setBookings(bookingsData);
        
        // Buscar perfis dos usuários para mostrar nos nomes
        const userIds = [...new Set([
          user?.id,
          ...bookingsData.filter(b => b.properties).map(b => b.properties!.owner_id)
        ].filter(Boolean))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        const profilesMap = (profiles || []).reduce((acc, profile) => {
          acc[profile.user_id] = profile.full_name;
          return acc;
        }, {} as Record<string, string>);
        
        setUserProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Concluída';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Minhas Reservas</h1>

        {loading ? (
          <div className="text-center">
            <p className="text-muted-foreground">Carregando reservas...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center">
            <p className="text-muted-foreground">Você ainda não fez nenhuma reserva.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.filter(booking => booking.properties).map((booking) => (
              <div key={booking.id} className="space-y-4">
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                    <div className="aspect-video lg:aspect-square bg-muted relative">
                      {booking.properties?.images && booking.properties.images.length > 0 ? (
                        <img
                          src={booking.properties.images[0]}
                          alt={booking.properties.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Sem imagem
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2 p-6">
                      <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-xl leading-tight">
                          {booking.properties?.title || 'Quarto indisponível'}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-1" />
                          {booking.properties?.city || 'N/A'}, {booking.properties?.country || 'N/A'}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span>
                                {new Date(booking.check_in_date).toLocaleDateString('pt-BR')} - {' '}
                                {new Date(booking.check_out_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-sm">
                              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span>{booking.guest_count} hóspedes</span>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {booking.total_nights} {booking.total_nights === 1 ? 'noite' : 'noites'}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-start sm:justify-end">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Total:</div>
                              <div className="text-xl font-bold">
                                R$ {booking.total_price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
                
                {/* Sistema de Avaliações */}
                {booking.status === 'confirmed' && booking.properties && (
                  <ReviewSystem
                    bookingId={booking.id}
                    propertyId={booking.properties.id}
                    propertyOwnerId={booking.properties.owner_id}
                    userId={booking.user_id}
                    checkOutDate={booking.check_out_date}
                    propertyTitle={booking.properties.title}
                    userName={userProfiles[booking.user_id] || 'Usuário'}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;