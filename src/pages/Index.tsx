import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { OptimizedImage } from '@/components/ui/optimized-image';
import AirbnbSearchBar from '@/components/AirbnbSearchBar';
import PropertyRatingCompact from '@/components/PropertyRatingCompact';
import { supabase } from '@/integrations/supabase/client';
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
  status?: 'pending' | 'approved' | 'denied';
}

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties_public')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar quartos',
          variant: 'destructive',
        });
      } else {
        const propertiesData = (data || []) as Property[];
        setAllProperties(propertiesData);
        setProperties(propertiesData);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar quartos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAirbnbSearch = async (filters: {
    destination: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
  }) => {
    const { destination, checkIn, checkOut } = filters;
    
    if (!destination.trim()) {
      setProperties(allProperties);
      return;
    }

    setSearching(true);
    try {
      // Buscar no banco de dados com filtros
      const { data, error } = await supabase
        .from('properties_public')
        .select('*')
        .or(`city.ilike.%${destination}%,country.ilike.%${destination}%,address.ilike.%${destination}%,title.ilike.%${destination}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching properties:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao buscar quartos',
          variant: 'destructive',
        });
        // Fallback para busca local
        const filtered = allProperties.filter(property =>
          property.city.toLowerCase().includes(destination.toLowerCase()) ||
          property.country.toLowerCase().includes(destination.toLowerCase()) ||
          property.address.toLowerCase().includes(destination.toLowerCase()) ||
          property.title.toLowerCase().includes(destination.toLowerCase())
        );
        setProperties(filtered);
      } else {
        setProperties((data || []) as Property[]);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback para busca local
      const filtered = allProperties.filter(property =>
        property.city.toLowerCase().includes(destination.toLowerCase()) ||
        property.country.toLowerCase().includes(destination.toLowerCase()) ||
        property.address.toLowerCase().includes(destination.toLowerCase()) ||
        property.title.toLowerCase().includes(destination.toLowerCase())
      );
      setProperties(filtered);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative py-16 sm:py-24 lg:py-32 min-h-[70vh] sm:min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image Otimizada */}
        <OptimizedImage
          src="/lovable-uploads/3c3db1f9-49f0-4f1f-abe9-0ba46ac4244e.png"
          alt="Hero background - encontre o quarto perfeito"
          className="absolute inset-0 w-full h-full object-cover"
          priority={true}
          thumbnailSrc="/lovable-uploads/3c3db1f9-49f0-4f1f-abe9-0ba46ac4244e.png"
        />
        
        {/* Overlay para melhorar legibilidade */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        <div className="container relative z-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg text-balance">
              Encontre o quarto perfeito para seu atendimento
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-12 drop-shadow-md text-pretty">
              Descubra quartos únicos em destinos incríveis
            </p>
            
            {/* Airbnb-style Search Bar */}
            <div className="px-4 sm:px-0">
              <AirbnbSearchBar 
                onSearch={handleAirbnbSearch}
                className="drop-shadow-2xl"
              />
              {searching && (
                <div className="text-center mt-4">
                  <div className="inline-flex items-center text-white/90">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Buscando quartos...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="container py-8 sm:py-12 lg:py-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-video bg-muted rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <p className="text-muted-foreground text-lg mb-4">
                Nenhum quarto encontrado para essa busca.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setProperties(allProperties)}
                className="touch-target"
              >
                Ver todos os quartos
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-balance">
                Quartos disponíveis
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                {properties.length} {properties.length === 1 ? 'quarto encontrado' : 'quartos encontrados'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {properties.map((property, index) => (
                <Link key={property.id} to={`/property/${property.id}`} className="group cursor-pointer">
                  <div className="transition-transform duration-200 hover:-translate-y-1">
                    {/* Imagem quadrada com cantos arredondados */}
                    <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
                      {property.images && property.images.length > 0 ? (
                        <OptimizedImage
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={index < 4}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center mx-auto mb-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-xs">Sem imagem</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Informações abaixo da imagem */}
                    <div className="space-y-1 px-1">
                      {/* Título da propriedade */}
                      <h3 className="font-medium text-foreground line-clamp-1 text-sm">
                        {property.title}
                      </h3>
                      
                      {/* Preço e avaliação */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-semibold text-foreground">
                            R$ {property.price_per_night.toFixed(0)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            noite
                          </span>
                        </div>
                        <PropertyRatingCompact propertyId={property.id} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
