import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format, differenceInDays, addDays, parseISO, eachDayOfInterval, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Users, Bed, Bath, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import { getOrCreateConversationForProperty } from '@/hooks/useMessaging';
import PropertyReviews from '@/components/PropertyReviews';
import PropertyRating from '@/components/PropertyRating';
import PropertyOwnerCard from '@/components/PropertyOwnerCard';
import { ImageLightbox } from '@/components/ImageLightbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  address: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  images: string[];
  is_available: boolean;
  created_at: string;
  owner_id?: string; // Optional since public view doesn't include it
}



const PropertyDetails = () => {
  const handleStartChat = async () => {
    try {
      if (!property?.id) {
        toast?.error?.('Imóvel não encontrado.') ?? console.error('Imóvel não encontrado.');
        return;
      }
      if (!user?.id) {
        if (typeof toast !== 'undefined') {
          toast('Faça login para conversar com o proprietário.', { description: 'Você será redirecionado para a página de login.' });
        }
        navigate(`/auth?next=${encodeURIComponent(location.pathname)}`);
        return;
      }
      const convId = await getOrCreateConversationForProperty(property.id);
      if (!convId) {
        toast?.error?.('Não foi possível iniciar a conversa.') ?? console.error('Não foi possível iniciar a conversa.');
        return;
      }
      if (typeof toast !== 'undefined') toast.success('Conversa iniciada.');
      navigate(`/mensagens#${convId}`);
    } catch (e) {
      console.error('start chat error', e);
      if (typeof toast !== 'undefined') toast.error('Erro ao iniciar conversa.');
    }
  };

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  
  // Booking form states
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [guestCount, setGuestCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    fetchProperty();
    fetchBookedDates();

    // Subscribe to real-time updates for bookings
    const channel = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `property_id=eq.${id}`
        },
        () => {
          // Refetch booked dates when a booking is updated (e.g., confirmed by admin)
          fetchBookedDates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  const fetchBookedDates = async () => {
    if (!id) return;
    
    try {
      // Buscar todas as reservas confirmadas para esta propriedade
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('check_in_date, check_out_date')
        .eq('property_id', id)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error('Error fetching booked dates:', bookingsError);
        return;
      }

      // Buscar datas bloqueadas pelo proprietário
      const { data: blocks, error: blocksError } = await supabase
        .from('property_blocks')
        .select('blocked_date')
        .eq('property_id', id);

      if (blocksError) {
        console.error('Error fetching blocked dates:', blocksError);
      }

      // Converter as datas de reserva em um array de datas ocupadas
      const occupiedDates: Date[] = [];
      
      if (bookings) {
        bookings.forEach(booking => {
          const checkIn = parseISO(booking.check_in_date);
          const checkOut = parseISO(booking.check_out_date);
          
          // Incluir todas as datas entre check-in e check-out (exclusive check-out)
          const datesInRange = eachDayOfInterval({
            start: checkIn,
            end: addDays(checkOut, -1) // Excluir o dia de check-out
          });
          
          occupiedDates.push(...datesInRange);
        });
      }

      // Adicionar datas bloqueadas pelo proprietário
      if (blocks) {
        blocks.forEach(block => {
          occupiedDates.push(parseISO(block.blocked_date));
        });
      }
      
      setBookedDates(occupiedDates);
    } catch (error) {
      console.error('Error fetching booked dates:', error);
    }
  };

  const fetchProperty = async () => {
    try {
      // First try to get from properties table to get owner_id
      const { data: fullProperty, error: fullError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .eq('is_available', true)
        .maybeSingle();

      if (fullError) {
        console.error('Error fetching full property:', fullError);
        // Fallback to public view
        const { data, error } = await supabase
          .from('properties_public')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching property:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao carregar propriedade',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        if (!data) {
          toast({
            title: 'Propriedade não encontrada',
            description: 'A propriedade solicitada não foi encontrada.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setProperty(data);
      } else if (!fullProperty) {
        toast({
          title: 'Propriedade não encontrada',
          description: 'A propriedade solicitada não foi encontrada.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      } else {
        setProperty(fullProperty);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar propriedade',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!checkInDate || !checkOutDate || !property) return 0;
    const nights = differenceInDays(checkOutDate, checkInDate);
    return nights * property.price_per_night;
  };

  const calculateTotalNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    return differenceInDays(checkOutDate, checkInDate);
  };

  // Função para verificar se um período tem conflito com reservas existentes
  const hasDateConflict = (startDate: Date, endDate: Date) => {
    const requestedDates = eachDayOfInterval({
      start: startDate,
      end: addDays(endDate, -1) // Excluir o dia de check-out
    });
    
    return requestedDates.some(requestedDate => 
      bookedDates.some(bookedDate => isEqual(requestedDate, bookedDate))
    );
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Você precisa estar logado para fazer uma reserva.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast({
        title: 'Datas obrigatórias',
        description: 'Por favor, selecione as datas de check-in e check-out.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se há conflito de datas
    if (hasDateConflict(checkInDate, checkOutDate)) {
      toast({
        title: 'Datas não disponíveis',
        description: 'As datas selecionadas já estão ocupadas. Por favor, escolha outras datas.',
        variant: 'destructive',
      });
      return;
    }

    if (guestCount > (property?.max_guests || 0)) {
      toast({
        title: 'Número de hóspedes excedido',
        description: `Esta propriedade suporta no máximo ${property?.max_guests} hóspedes.`,
        variant: 'destructive',
      });
      return;
    }

    setBookingLoading(true);

    try {
      const totalNights = calculateTotalNights();
      const totalPrice = calculateTotalPrice();

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          property_id: id,
          check_in_date: format(checkInDate, 'yyyy-MM-dd'),
          check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
          guest_count: guestCount,
          total_nights: totalNights,
          total_price: totalPrice,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      setBookingConfirmed(true);
      toast({
        title: 'Reserva confirmada!',
        description: 'Sua pré-reserva foi registrada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Erro na reserva',
        description: error.message || 'Erro ao processar sua reserva.',
        variant: 'destructive',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    // Desabilitar datas no passado
    if (date < new Date()) {
      return true;
    }
    
    // Desabilitar datas já ocupadas
    return bookedDates.some(bookedDate => isEqual(date, bookedDate));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Carregando propriedade...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Propriedade não encontrada.</p>
        </div>
      </div>
    );
  }

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Pré-reserva Confirmada!</h1>
            <div className="bg-muted rounded-lg p-6 mb-8">
              <p className="text-lg mb-4">
                Sua pré-reserva foi confirmada. Entraremos em contato para confirmar seus dados e finalizar o pagamento.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Propriedade:</strong> {property.title}</p>
                <p><strong>Check-in:</strong> {checkInDate ? format(checkInDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</p>
                <p><strong>Check-out:</strong> {checkOutDate ? format(checkOutDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</p>
                <p><strong>Hóspedes:</strong> {guestCount}</p>
                <p><strong>Total de diárias:</strong> {calculateTotalNights()}</p>
                <p><strong>Valor total:</strong> R$ {calculateTotalPrice().toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/')}>
                Voltar ao início
              </Button>
              <Button onClick={() => navigate('/bookings')} variant="outline">
                Ver minhas reservas
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mr-4 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <PropertyRating propertyId={property.id} compact />
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              {property.city}, {property.country}
            </div>
            <Badge variant={property.is_available ? "default" : "secondary"}>
              {property.is_available ? 'Disponível' : 'Indisponível'}
            </Badge>
          </div>
        </div>

        {/* Images Gallery */}
        <div className="mb-8">
          {property.images && property.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-xl overflow-hidden">
              {/* Main Image */}
              <div className="md:col-span-2 md:row-span-2">
                <img
                  src={property.images[0]}
                  alt={`${property.title} - Imagem principal`}
                  className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-all"
                  onClick={() => {
                    setSelectedImageIndex(0);
                    setLightboxOpen(true);
                  }}
                />
              </div>
              
              {/* Secondary Images */}
              {property.images.slice(1, 5).map((imageUrl, index) => (
                <div key={index + 1} className="hidden md:block">
                  <img
                    src={imageUrl}
                    alt={`${property.title} - Imagem ${index + 2}`}
                    className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-all"
                    onClick={() => {
                      setSelectedImageIndex(index + 1);
                      setLightboxOpen(true);
                    }}
                  />
                </div>
              ))}
              
              {/* Show All Photos Button */}
              {property.images.length > 5 && (
                <Button
                  variant="outline"
                  className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm"
                  onClick={() => {
                    setSelectedImageIndex(0);
                    setLightboxOpen(true);
                  }}
                >
                  <span className="text-sm">Mostrar todas as {property.images.length} fotos</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              <p className="text-muted-foreground">Nenhuma imagem disponível</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Info */}
            <div className="border-b pb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Espaço inteiro: {property.title.toLowerCase()}
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{property.max_guests} {property.max_guests === 1 ? 'hóspede' : 'hóspedes'}</span>
                    <span>•</span>
                    <span>{property.bedrooms} {property.bedrooms === 1 ? 'quarto' : 'quartos'}</span>
                    <span>•</span>
                    <span>{property.bathrooms} {property.bathrooms === 1 ? 'banheiro' : 'banheiros'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b pb-8">
              <h3 className="text-lg font-semibold mb-4">Sobre este espaço</h3>
              <p className="text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="border-b pb-8">
                <h3 className="text-lg font-semibold mb-4">O que este lugar oferece</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Info - Only show if available */}
            {property.owner_id && (
              <div className="border-b pb-8">
                <h3 className="text-lg font-semibold mb-4">Anfitrião</h3>
                <PropertyOwnerCard ownerId={property.owner_id} />
              </div>
            )}

            {/* Location */}
            <div className="border-b pb-8">
              <h3 className="text-lg font-semibold mb-4">Onde você vai ficar</h3>
              <div className="space-y-2">
                <p className="font-medium">{property.address}</p>
                <p className="text-muted-foreground">{property.city}, {property.country}</p>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <PropertyReviews propertyId={property.id} />
            </div>
          </div>

          {/* Right Sidebar - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="border shadow-lg">
                <CardContent className="p-6">
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        R$ {property.price_per_night.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">diária</span>
                    </div>
                  </div>

                  {/* Dates Selection */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
                      <div className="border-r">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full h-14 justify-start flex-col items-start rounded-none"
                            >
                              <span className="text-xs font-medium text-muted-foreground">CHECK-IN</span>
                              <span className="text-sm">
                                {checkInDate ? format(checkInDate, "dd/MM/yyyy") : "Adicionar data"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={checkInDate}
                              onSelect={setCheckInDate}
                              disabled={isDateDisabled}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full h-14 justify-start flex-col items-start rounded-none"
                            >
                              <span className="text-xs font-medium text-muted-foreground">CHECK-OUT</span>
                              <span className="text-sm">
                                {checkOutDate ? format(checkOutDate, "dd/MM/yyyy") : "Adicionar data"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={checkOutDate}
                              onSelect={setCheckOutDate}
                              disabled={(date) => 
                                isDateDisabled(date) || 
                                (checkInDate ? date <= checkInDate : false)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Guests */}
                    <div className="border rounded-lg">
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">HÓSPEDES</div>
                          <div className="text-sm">{guestCount} {guestCount === 1 ? 'hóspede' : 'hóspedes'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                            disabled={guestCount <= 1}
                          >
                            -
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setGuestCount(Math.min(property.max_guests, guestCount + 1))}
                            disabled={guestCount >= property.max_guests}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  {checkInDate && checkOutDate && (
                    <div className="space-y-3 mb-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span>R$ {property.price_per_night.toFixed(2)} x {calculateTotalNights()} diárias</span>
                        <span>R$ {calculateTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>R$ {calculateTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleBooking}
                    disabled={!checkInDate || !checkOutDate || !property.is_available || bookingLoading}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {bookingLoading ? 'Processando...' : 'Reservar'}
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={handleStartChat}
                    className="w-full h-12 mt-2"
                  >
                    Iniciar conversa com o proprietário
                  </Button>


                  {bookedDates.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      ⚠️ Datas em cinza no calendário já estão ocupadas
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={property.images || []}
        initialIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        propertyTitle={property.title}
      />
    </div>
  );
};

export default PropertyDetails;