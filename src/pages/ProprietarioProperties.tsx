import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { Plus, Upload, X, Edit, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import ReviewSystem from '@/components/ReviewSystem';
import { ReorderableImageGallery } from '@/components/ReorderableImageGallery';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  address: string;
  city: string;
  country: string;
  amenities: string[];
  images: string[];
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  is_available: boolean;
  owner_id: string;
  updated_at: string;
}

interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_nights: number;
  total_price: number;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url?: string;
    whatsapp_number?: string;
  };
  properties: {
    id: string;
    title: string;
    owner_id: string;
  };
}

interface PropertyBlock {
  id: string;
  property_id: string;
  blocked_date: string;
  reason?: string;
  created_at: string;
}

const ProprietarioProperties = () => {
  const { user, loading: userLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [propertyBlocks, setPropertyBlocks] = useState<PropertyBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<Record<string, boolean>>({});
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false);
  
  // Calendar state
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>();
  const [blockReason, setBlockReason] = useState('');
  
  // Form state (used for both new and edit)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_night: '',
    address: '',
    city: '',
    country: '',
    amenities: '',
    common_area: '',
    bathroom_type: '',
  });
  const [formImages, setFormImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const fetchProperties = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties((data || []) as Property[]);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar quartos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Fetching bookings for user:', user.id);
      
      // Primeiro buscar todas as reservas das propriedades do usuário
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner (id, title, owner_id)
        `)
        .eq('properties.owner_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Bookings query result:', { bookingsData, bookingsError });

      if (bookingsError) throw bookingsError;

      if (!bookingsData || bookingsData.length === 0) {
        console.log('No bookings found for user properties');
        setBookings([]);
        return;
      }

      // Buscar perfis separadamente para cada reserva
      const bookingsWithProfiles = await Promise.all(
        bookingsData.map(async (booking) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url, whatsapp_number')
            .eq('user_id', booking.user_id)
            .single();

          return {
            ...booking,
            profiles: profile || { full_name: 'N/A', email: 'N/A', avatar_url: null, whatsapp_number: 'N/A' }
          };
        })
      );

      setBookings(bookingsWithProfiles as any);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar reservas.",
        variant: "destructive",
      });
    }
  };

  const fetchPropertyBlocks = async () => {
    if (!user?.id) return;
    
    try {
      // Primeiro buscar as propriedades do usuário para obter os IDs
      const { data: userProperties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      if (propertiesError) throw propertiesError;

      if (!userProperties || userProperties.length === 0) {
        setPropertyBlocks([]);
        return;
      }

      // Extrair os IDs das propriedades
      const propertyIds = userProperties.map(p => p.id);

      // Buscar bloqueios apenas para essas propriedades
      const { data, error } = await supabase
        .from('property_blocks')
        .select('*')
        .in('property_id', propertyIds)
        .order('blocked_date', { ascending: true });

      if (error) throw error;
      setPropertyBlocks((data || []) as PropertyBlock[]);
    } catch (error) {
      console.error('Error fetching property blocks:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar bloqueios de datas.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user?.id && role === 'proprietario') {
      fetchProperties();
      fetchBookings();
      fetchPropertyBlocks();
      
      // Subscribe to real-time updates for bookings of this property owner
      const channel = supabase
        .channel('proprietario-bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
          },
          () => {
            console.log('Booking updated for proprietario, refetching...');
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, role]);

  // Handle access control
  useEffect(() => {
    if (!userLoading && !roleLoading && user && role !== 'proprietario') {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [user, role, userLoading, roleLoading, toast]);

  // Reset form state
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price_per_night: '',
      address: '',
      city: '',
      country: '',
      amenities: '',
      common_area: '',
      bathroom_type: '',
    });
    setFormImages([]);
    setExistingImages([]);
    setEditingProperty(null);
    setShowNewPropertyForm(false);
  };

  // Initialize form for editing
  const initializeEditForm = (property: Property) => {
    setFormData({
      title: property.title,
      description: property.description,
      price_per_night: property.price_per_night.toString(),
      address: property.address,
      city: property.city,
      country: property.country,
      amenities: property.amenities.join(', '),
      common_area: '', // Novo campo, inicializar vazio
      bathroom_type: '', // Novo campo, inicializar vazio
    });
    setExistingImages(property.images || []);
    setFormImages([]);
    setEditingProperty(property);
    setShowNewPropertyForm(false);
  };

  const handleExistingImagesReorder = (newImages: string[]) => {
    setExistingImages(newImages);
  };

  const removeExistingImageFromList = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormImages(Array.from(e.target.files));
    }
  };

  const removeNewImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Upload new images
      const newImageUrls: string[] = [];
      for (const image of formImages) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrl);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      const propertyData = {
        title: formData.title,
        description: formData.description,
        price_per_night: parseFloat(formData.price_per_night),
        address: formData.address,
        city: formData.city,
        country: formData.country,
        amenities: formData.amenities.split(',').map(a => a.trim()),
        images: allImages,
        bedrooms: 1, // Valor fixo já que removemos o campo
        bathrooms: 1, // Valor fixo já que removemos o campo
        max_guests: 2, // Valor fixo já que removemos o campo
        is_available: true
      };

      if (editingProperty) {
        // Update existing property
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingProperty.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Quarto atualizado com sucesso!",
        });
      } else {
        // Create new property
        const { error } = await supabase
          .from('properties')
          .insert({
            ...propertyData,
            owner_id: user?.id,
            status: 'pending'
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Quarto cadastrado com sucesso! Aguardando aprovação.",
        });
      }

      resetForm();
      fetchProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Erro",
        description: editingProperty ? "Erro ao atualizar quarto." : "Erro ao cadastrar quarto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'denied':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovada';
      case 'pending':
        return 'Pendente';
      case 'denied':
        return 'Negada';
      default:
        return status;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleBlockDate = async () => {
    if (!selectedProperty || !selectedDateRange?.from) {
      toast({
        title: "Erro",
        description: "Selecione um quarto e pelo menos uma data inicial.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Criar array de datas para bloquear
      let datesToBlock: Date[] = [];
      
      if (selectedDateRange.to && selectedDateRange.from < selectedDateRange.to) {
        // Intervalo de datas
        datesToBlock = eachDayOfInterval({
          start: selectedDateRange.from,
          end: selectedDateRange.to
        });
      } else {
        // Apenas uma data
        datesToBlock = [selectedDateRange.from];
      }

      // Inserir bloqueios para cada data
      const blockInserts = datesToBlock.map(date => ({
        property_id: selectedProperty,
        blocked_date: format(date, 'yyyy-MM-dd'),
        reason: blockReason.trim() || null,
        created_by: user?.id
      }));

      const { error } = await supabase
        .from('property_blocks')
        .insert(blockInserts);

      if (error) throw error;

      const datesCount = datesToBlock.length;
      toast({
        title: "Sucesso",
        description: `${datesCount} ${datesCount === 1 ? 'data bloqueada' : 'datas bloqueadas'} com sucesso!`,
      });

      setSelectedDateRange(undefined);
      setBlockReason('');
      fetchPropertyBlocks();
    } catch (error: any) {
      console.error('Error blocking date:', error);
      toast({
        title: "Erro",
        description: error.message?.includes('duplicate') 
          ? "Algumas datas já estão bloqueadas para este quarto."
          : "Erro ao bloquear datas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockDate = async (blockId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('property_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Bloqueio removido com sucesso!",
      });

      fetchPropertyBlocks();
    } catch (error: any) {
      console.error('Error unblocking date:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover bloqueio.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      setBookingLoading(prev => ({ ...prev, [bookingId]: true }));
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Reserva ${newStatus === 'confirmed' ? 'confirmada' : 'cancelada'} com sucesso!`,
      });

      // Atualizar imediatamente o estado local para feedback instantâneo
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        )
      );

      // Refetch para garantir sincronização com o banco
      await fetchBookings();
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da reserva.",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const getBlockedDatesForProperty = (propertyId: string) => {
    return propertyBlocks
      .filter(block => block.property_id === propertyId)
      .map(block => new Date(block.blocked_date));
  };

  const isDateBlocked = (date: Date) => {
    if (!selectedProperty) return false;
    const blockedDates = getBlockedDatesForProperty(selectedProperty);
    return blockedDates.some(blockedDate => 
      blockedDate.toDateString() === date.toDateString()
    );
  };

  const isDateInSelectedRange = (date: Date) => {
    if (!selectedDateRange?.from) return false;
    if (!selectedDateRange.to) {
      return date.toDateString() === selectedDateRange.from.toDateString();
    }
    return date >= selectedDateRange.from && date <= selectedDateRange.to;
  };

  // Check authentication and role
  if (userLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role !== 'proprietario') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          Carregando...
        </div>
      </div>
    );
  }

  const isFormVisible = showNewPropertyForm || !!editingProperty;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meus Quartos</h1>
          <Button 
            onClick={() => {
              resetForm();
              setShowNewPropertyForm(true);
            }}
            disabled={isFormVisible}
          >
            <Plus className="w-4 h-4 mr-2" />
             Novo Quarto
          </Button>
        </div>

        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList>
            <TabsTrigger value="properties">Quartos</TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="calendar">Agenda</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            {isFormVisible && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingProperty ? 'Editar Quarto' : 'Novo Quarto'}
                  </CardTitle>
                  <CardDescription>
                    {editingProperty 
                      ? 'Edite as informações do quarto' 
                      : 'Cadastre um novo quarto para aprovação'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="price">Preço da Diária (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price_per_night}
                        onChange={(e) => setFormData({...formData, price_per_night: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">País</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                     
                      <div>
                        <Label htmlFor="common_area">Área comum</Label>
                        <Input
                          id="common_area"
                          value={formData.common_area}
                          onChange={(e) => setFormData({...formData, common_area: e.target.value})}
                          placeholder="Ex: Cozinha, Sala"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bathroom_type">Banheiros</Label>
                        <Select 
                          value={formData.bathroom_type} 
                          onValueChange={(value) => setFormData({...formData, bathroom_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de banheiro" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compartilhado">Banheiro compartilhado</SelectItem>
                            <SelectItem value="suite">Suíte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                     
                     <div>
                       <Label htmlFor="amenities">Comodidades (separadas por vírgula)</Label>
                      <Input
                        id="amenities"
                        value={formData.amenities}
                        onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                        placeholder="WiFi, Ar condicionado, Piscina"
                        required
                      />
                    </div>
                    
                     {/* Existing Images - Show only when editing */}
                     {editingProperty && existingImages.length > 0 && (
                       <ReorderableImageGallery
                         images={existingImages}
                         onImagesReorder={handleExistingImagesReorder}
                         onImageRemove={removeExistingImageFromList}
                         title="Fotos Atuais do Quarto"
                       />
                     )}

                     <div>
                       <Label htmlFor="images">
                         {editingProperty ? 'Adicionar Novas Fotos' : 'Fotos do Quarto'}
                       </Label>
                       
                       <Input
                         id="images"
                         type="file"
                         multiple
                         accept="image/*"
                         onChange={handleImageChange}
                         required={!editingProperty && existingImages.length === 0}
                       />
                       
                       {/* New images preview */}
                       {formImages.length > 0 && (
                         <div className="mt-2">
                           <Label className="text-sm text-muted-foreground">Novas imagens:</Label>
                           <div className="mt-2 flex flex-wrap gap-2">
                             {formImages.map((image, index) => (
                               <div key={index} className="relative">
                                 <img
                                   src={URL.createObjectURL(image)}
                                   alt={`Preview ${index + 1}`}
                                   className="w-20 h-20 object-cover rounded"
                                 />
                                 <Button
                                   type="button"
                                   variant="destructive"
                                   size="sm"
                                   className="absolute -top-2 -right-2 w-6 h-6 p-0"
                                   onClick={() => removeNewImage(index)}
                                 >
                                   <X className="w-4 h-4" />
                                 </Button>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        <Upload className="w-4 h-4 mr-2" />
                        {editingProperty ? 'Atualizar Quarto' : 'Cadastrar Quarto'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <Card key={property.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <Badge className={getStatusColor(property.status)}>
                        {getStatusText(property.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {property.city}, {property.country} • R$ {property.price_per_night}/diária
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {property.images && property.images.length > 0 && (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-32 object-cover rounded mb-4"
                      />
                    )}
                    <p className="text-sm text-muted-foreground mb-4">
                      {property.description.substring(0, 100)}...
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {property.amenities ? property.amenities.length : 0} comodidades
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => initializeEditForm(property)}
                        disabled={isFormVisible}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhuma reserva foi feita nos seus quartos ainda.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{booking.properties.title}</CardTitle>
                        <Badge className={getBookingStatusColor(booking.status)}>
                          {booking.status === 'pending' ? 'Pendente' : 
                           booking.status === 'confirmed' ? 'Confirmada' :
                           booking.status === 'cancelled' ? 'Cancelada' : booking.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Período: {new Date(booking.check_in_date).toLocaleDateString('pt-BR')} até {new Date(booking.check_out_date).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-6">
                      {/* Guest Information with Avatar */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={booking.profiles.avatar_url || ''} />
                          <AvatarFallback>
                            {booking.profiles.full_name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || 'H'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{booking.profiles.full_name}</p>
                          <p className="text-muted-foreground">{booking.profiles.email}</p>
                          {booking.status === 'confirmed' && booking.profiles.whatsapp_number && (
                            <p className="text-green-600 font-medium">
                              WhatsApp: {booking.profiles.whatsapp_number}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">{booking.guest_count} hóspedes</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p><strong>Total de noites:</strong> {booking.total_nights}</p>
                          <p><strong>Valor total:</strong> R$ {booking.total_price.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                          <p><strong>Reserva feita em:</strong> {new Date(booking.created_at).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Check-in:</strong> {new Date(booking.check_in_date).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Check-out:</strong> {new Date(booking.check_out_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      
                      {/* Botões de ação para reservas pendentes */}
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                            disabled={bookingLoading[booking.id]}
                            className="flex-1"
                          >
                            {bookingLoading[booking.id] ? 'Confirmando...' : 'Confirmar Reserva'}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleBookingStatusUpdate(booking.id, 'cancelled')}
                            disabled={bookingLoading[booking.id]}
                            className="flex-1"
                          >
                            {bookingLoading[booking.id] ? 'Cancelando...' : 'Cancelar Reserva'}
                          </Button>
                        </div>
                      )}

                      {/* Sistema de Avaliações - Agora dentro do mesmo card */}
                      {booking.status === 'confirmed' && (
                        <div className="border-t pt-6">
                          <ReviewSystem
                            bookingId={booking.id}
                            propertyId={booking.properties.id}
                            propertyOwnerId={booking.properties.owner_id}
                            userId={booking.user_id}
                            checkOutDate={booking.check_out_date}
                            propertyTitle={booking.properties.title}
                            userName={booking.profiles.full_name}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Disponibilidade</CardTitle>
                <CardDescription>
                  Bloqueie datas específicas dos seus quartos para torná-las indisponíveis para reservas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="property-select">Selecione um quarto</Label>
                    <select
                      id="property-select"
                      value={selectedProperty}
                      onChange={(e) => setSelectedProperty(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione um quarto</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProperty && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Selecione o período para bloquear</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedDateRange?.from && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                 {selectedDateRange?.from ? (
                                   selectedDateRange.to ? (
                                     `${format(selectedDateRange.from, "dd/MM/yyyy")} - ${format(selectedDateRange.to, "dd/MM/yyyy")}`
                                   ) : (
                                     format(selectedDateRange.from, "dd/MM/yyyy")
                                   )
                                 ) : (
                                   "Selecione as datas"
                                 )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="range"
                                selected={selectedDateRange}
                                onSelect={setSelectedDateRange}
                                disabled={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today || isDateBlocked(date);
                                }}
                                initialFocus
                                className="pointer-events-auto"
                                numberOfMonths={2}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <Label htmlFor="reason">Motivo (opcional)</Label>
                          <Input
                            id="reason"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Ex: Manutenção, uso pessoal..."
                          />
                        </div>

                        <Button 
                          onClick={handleBlockDate}
                          disabled={!selectedProperty || !selectedDateRange?.from || loading}
                          className="w-full"
                        >
                          {selectedDateRange?.from && selectedDateRange?.to 
                            ? 'Bloquear Período' 
                            : 'Bloquear Data'
                          }
                        </Button>
                      </div>

                      <div>
                        <Label>Datas bloqueadas</Label>
                        <div className="max-h-80 overflow-y-auto space-y-2 mt-2">
                          {propertyBlocks
                            .filter(block => block.property_id === selectedProperty)
                            .map((block) => (
                              <div key={block.id} className="flex items-center justify-between p-3 border rounded-md">
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(block.blocked_date), "dd/MM/yyyy")}
                                  </p>
                                  {block.reason && (
                                    <p className="text-sm text-muted-foreground">{block.reason}</p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnblockDate(block.id)}
                                  disabled={loading}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          {propertyBlocks.filter(block => block.property_id === selectedProperty).length === 0 && (
                            <p className="text-center text-muted-foreground py-4">
                              Nenhuma data bloqueada para este quarto.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProprietarioProperties;
