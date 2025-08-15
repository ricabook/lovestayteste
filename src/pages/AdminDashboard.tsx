import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Shield, ShieldCheck, X, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { ReorderableImageGallery } from '@/components/ReorderableImageGallery';

interface Property {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  address: string;
  city: string;
  country: string;
  cep?: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  images: string[];
  is_available: boolean;
  status?: 'pending' | 'approved' | 'denied';
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  total_price: number;
  guest_count: number;
  status: string;
  properties: {
    title: string;
    city: string;
    country: string;
  };
  profiles: {
    full_name: string;
    email: string;
    avatar_url?: string;
    whatsapp_number?: string;
  };
}

const AdminDashboard = () => {
  const { user, loading: userLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { optimizeAndUpload } = useImageOptimization();
  const navigate = useNavigate();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [thirdPartyProperties, setThirdPartyProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_night: '',
    address: '',
    city: '',
    cep: '',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    amenities: '',
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  useEffect(() => {
    // Aguarda o carregamento completo de user e role
    if (!userLoading && !roleLoading) {
      if (!user) {
        setAccessDenied(true);
        toast({
          title: 'Acesso negado',
          description: 'Você precisa estar logado para acessar esta página.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }
      
      if (!isAdmin) {
        setAccessDenied(true);
        toast({
          title: 'Acesso negado',
          description: 'Você não tem permissão de administrador para acessar esta página.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      
      // Se chegou até aqui, usuário tem acesso
      setAccessDenied(false);
    }
  }, [user, isAdmin, userLoading, roleLoading, navigate]);

  useEffect(() => {
    // Só busca dados quando user está logado, é admin e não há negação de acesso
    if (user && isAdmin && !accessDenied && !userLoading && !roleLoading) {
      fetchProperties();
      fetchThirdPartyProperties();
      fetchBookings();
      
      // Subscribe to real-time updates for bookings
      const channel = supabase
        .channel('admin-bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
          },
          () => {
            console.log('Booking updated in admin, refetching...');
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin, accessDenied, userLoading, roleLoading]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
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
        setProperties((data || []) as Property[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThirdPartyProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching third party properties:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar quartos de terceiros',
          variant: 'destructive',
        });
      } else {
        const filtered = (data || []).filter(p => 
          p.owner_id !== user?.id && 
          ['pending', 'denied'].includes((p as any).status)
        );
        setThirdPartyProperties(filtered as Property[]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            title,
            city,
            country
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar reservas',
          variant: 'destructive',
        });
        return;
      }

      if (!data) {
        setBookings([]);
        return;
      }

      // Fetch profile data separately for each booking
      const bookingsWithProfiles = await Promise.all(
        data.map(async (booking) => {
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

      setBookings(bookingsWithProfiles);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBookingStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Status atualizado',
        description: `Reserva ${newStatus === 'confirmed' ? 'confirmada' : 'cancelada'} com sucesso.`,
      });

      // Atualizar a lista de reservas
      fetchBookings();
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar status da reserva',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amenitiesArray = formData.amenities
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // Upload e otimização de imagens
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setImageUploadLoading(true);
        
        for (const image of selectedImages) {
          try {
            const result = await optimizeAndUpload({
              file: image,
              bucket: 'property-images',
              path: 'properties',
              onProgress: (progress) => {
                console.log(`Upload progress: ${progress}%`);
              }
            });

            imageUrls.push(result.urls.optimized);
            
            toast({
              title: 'Imagem otimizada',
              description: `Economia de ${result.compressionRatio.toFixed(1)}% no tamanho.`,
            });
          } catch (uploadError) {
            console.error('Error optimizing image:', uploadError);
            toast({
              title: 'Erro na otimização',
              description: 'Falha ao otimizar uma das imagens. Continuando...',
              variant: 'destructive',
            });
          }
        }
        
        setImageUploadLoading(false);
      }

      if (editingProperty) {
        // Atualizar propriedade existente
        const { error } = await supabase
          .from('properties')
          .update({
            title: formData.title,
            description: formData.description,
            price_per_night: parseFloat(formData.price_per_night),
            address: formData.address,
            cep: formData.cep,
            country: 'Brasil',
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            max_guests: formData.max_guests,
            amenities: amenitiesArray,
            images: imageUrls.length > 0 ? [...existingImages, ...imageUrls] : existingImages,
          })
          .eq('id', editingProperty.id);

        if (error) {
          throw error;
        }

        toast({
          title: 'Sucesso!',
          description: 'Propriedade atualizada com sucesso.',
        });
      } else {
        // Criar nova propriedade
        const { error } = await supabase
          .from('properties')
          .insert([{
            owner_id: user?.id,
            title: formData.title,
            description: formData.description,
            price_per_night: parseFloat(formData.price_per_night),
            address: formData.address,
            city: formData.city,
            cep: formData.cep,
            country: 'Brasil',
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            max_guests: formData.max_guests,
            amenities: amenitiesArray,
            images: imageUrls,
          }]);

        if (error) {
          throw error;
        }

        toast({
          title: 'Sucesso!',
          description: 'Propriedade cadastrada com sucesso.',
        });
      }

      // Reset form
      setEditingProperty(null);
      setFormData({
        title: '',
        description: '',
        price_per_night: '',
        address: '',
        city: '',
        cep: '',
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        amenities: '',
      });
      setSelectedImages([]);
      setExistingImages([]);

      fetchProperties();
      fetchThirdPartyProperties();
    } catch (error: any) {
      console.error('Error creating property:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cadastrar propriedade',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setImageUploadLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedImages.length > 10) {
      toast({
        title: 'Limite excedido',
        description: 'Máximo de 10 imagens por propriedade.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar tipos de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: 'Formato inválido',
        description: 'Apenas arquivos JPG, PNG e WebP são permitidos.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar tamanho dos arquivos (máximo 10MB por arquivo)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Tamanho máximo de 10MB por imagem.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleExistingImagesReorder = (newImages: string[]) => {
    setExistingImages(newImages);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    setFormData(prev => ({ ...prev, cep: cleanCep }));
    
    if (cleanCep.length === 8) {
      setCepLoading(true);
      
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          toast({
            title: 'CEP não encontrado',
            description: 'Por favor, verifique o CEP informado.',
            variant: 'destructive',
          });
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          address: `${data.logradouro}, ${data.bairro}`,
          city: data.localidade,
        }));
        
        toast({
          title: 'CEP encontrado',
          description: 'Endereço preenchido automaticamente.',
        });
      } catch (error) {
        console.error('Error fetching CEP:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao buscar informações do CEP.',
          variant: 'destructive',
        });
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleEditProperty = (property: Property) => {
    console.log('Edit property clicked:', property.id, property.title);
    
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      price_per_night: property.price_per_night.toString(),
      address: property.address,
      city: property.city,
      cep: property.cep || '',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      max_guests: property.max_guests,
      amenities: property.amenities?.join(', ') || '',
    });
    setSelectedImages([]);
    setExistingImages(property.images || []);
    
    // Scroll para o formulário
    const formElement = document.querySelector('[data-form="property-form"]');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    console.log('Form data updated for editing');
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta propriedade? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Propriedade excluída',
        description: 'A propriedade foi removida com sucesso.',
      });

      fetchProperties();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir propriedade',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingProperty(null);
    setFormData({
      title: '',
      description: '',
      price_per_night: '',
      address: '',
      city: '',
      cep: '',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 2,
      amenities: '',
    });
    setSelectedImages([]);
    setExistingImages([]);
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
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
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
      case 'approved':
        return 'Aprovada';
      case 'denied':
        return 'Negada';
      default:
        return status;
    }
  };

  const handlePropertyStatusUpdate = async (propertyId: string, newStatus: 'approved' | 'denied') => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        } as any)
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Propriedade ${newStatus === 'approved' ? 'aprovada' : 'negada'} com sucesso.`,
      });

      fetchThirdPartyProperties();
    } catch (error: any) {
      console.error('Error updating property status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar status da propriedade',
        variant: 'destructive',
      });
    }
  };

  const handlePropertyAvailabilityToggle = async (propertyId: string, currentStatus: 'approved' | 'pending') => {
    try {
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
      
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: 'Disponibilidade atualizada',
        description: `Propriedade ${newStatus === 'approved' ? 'disponibilizada' : 'colocada como pendente'} com sucesso.`,
      });

      fetchProperties();
    } catch (error: any) {
      console.error('Error updating property availability:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar disponibilidade da propriedade',
        variant: 'destructive',
      });
    }
  };

  // Mostra loading enquanto carrega
  if (userLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se acesso foi negado ou usuário não tem permissão, não renderiza nada
  if (accessDenied || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">Esta página é restrita a administradores.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-12">
        <div className="flex items-center mb-6 sm:mb-8">
          <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary mr-2 sm:mr-3" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Dashboard Administrativo</h1>
        </div>

        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0 h-auto sm:h-10">
            <TabsTrigger value="properties" className="text-xs sm:text-sm px-2 py-3 sm:py-2">
              <span className="block sm:inline">Quartos</span>
            </TabsTrigger>
            <TabsTrigger value="third-party-properties" className="text-xs sm:text-sm px-2 py-3 sm:py-2">
              <span className="block sm:inline">Terceiros</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs sm:text-sm px-2 py-3 sm:py-2">
              <span className="block sm:inline">Reservas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-6">
            {/* Add Property Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    {editingProperty ? 'Editar Propriedade' : 'Cadastrar Nova Propriedade'}
                  </div>
                  {editingProperty && (
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent data-form="property-form">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Preço por noite (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price_per_night}
                        onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={8}
                        required
                      />
                      {cepLoading && <p className="text-sm text-muted-foreground mt-1">Buscando endereço...</p>}
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        readOnly
                      />
                    </div>
                    <div>
                      <Label htmlFor="bedrooms">Quartos</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        min="1"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bathrooms">Banheiros</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        min="1"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_guests">Máximo de hóspedes</Label>
                      <Input
                        id="max_guests"
                        type="number"
                        min="1"
                        value={formData.max_guests}
                        onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  
                   <div>
                     <Label htmlFor="amenities">Comodidades (separadas por vírgula)</Label>
                     <Input
                       id="amenities"
                       placeholder="Ex: Wi-Fi, Ar condicionado, Piscina"
                       value={formData.amenities}
                       onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                     />
                   </div>

                   {/* Existing Images - Show only when editing */}
                   {editingProperty && existingImages.length > 0 && (
                     <ReorderableImageGallery
                       images={existingImages}
                       onImagesReorder={handleExistingImagesReorder}
                       onImageRemove={removeExistingImage}
                       title="Fotos Atuais da Propriedade"
                     />
                   )}
                   
                   <div>
                     <Label htmlFor="images">
                       {editingProperty ? 'Adicionar Novas Fotos' : 'Fotos da Propriedade'} (máx. 10 total)
                     </Label>
                     <div className="space-y-4">
                       <Input
                         id="images"
                         type="file"
                         accept="image/*"
                         multiple
                         onChange={handleImageChange}
                         disabled={(existingImages.length + selectedImages.length) >= 10}
                       />
                       
                       {selectedImages.length > 0 && (
                         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                           {selectedImages.map((image, index) => (
                             <div key={index} className="relative group">
                               <img
                                 src={URL.createObjectURL(image)}
                                 alt={`Preview ${index + 1}`}
                                 className="w-full h-20 sm:h-24 object-cover rounded-lg border"
                               />
                               <button
                                 type="button"
                                 onClick={() => removeImage(index)}
                                 className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                             </div>
                           ))}
                         </div>
                       )}
                       
                       <p className="text-sm text-muted-foreground">
                         {existingImages.length + selectedImages.length}/10 imagens total. 
                         {editingProperty ? ` ${selectedImages.length} novas imagens selecionadas.` : ` ${selectedImages.length} imagens selecionadas.`}
                         <br />Formatos aceitos: JPG, PNG, WebP
                       </p>
                     </div>
                   </div>
                  
                  <Button type="submit" disabled={loading || imageUploadLoading}>
                    {imageUploadLoading ? 'Fazendo upload das imagens...' : loading ? (editingProperty ? 'Atualizando...' : 'Cadastrando...') : (editingProperty ? 'Atualizar Propriedade' : 'Cadastrar Propriedade')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Properties List */}
            <Card>
              <CardHeader>
                <CardTitle>Quartos Cadastrados ({properties.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma propriedade cadastrada.</p>
                ) : (
                  <div className="space-y-4">
                     {properties.map((property) => (
                       <div key={property.id} className="border rounded-lg p-3 sm:p-4">
                         <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                           <div className="flex-1 min-w-0">
                             <h3 className="font-semibold text-base sm:text-lg break-words">{property.title}</h3>
                             <p className="text-muted-foreground text-sm">{property.city}, {property.country}</p>
                             <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{property.description}</p>
                             <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                               <span>{property.bedrooms} quartos</span>
                               <span>{property.bathrooms} banheiros</span>
                               <span>{property.max_guests} hóspedes</span>
                               <span className="font-semibold">R$ {property.price_per_night.toFixed(2)}/noite</span>
                             </div>
                             {property.amenities && property.amenities.length > 0 && (
                               <div className="flex flex-wrap gap-1 mt-2">
                                 {property.amenities.slice(0, 3).map((amenity, index) => (
                                   <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                                     {amenity}
                                   </Badge>
                                 ))}
                                 {property.amenities.length > 3 && (
                                   <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                     +{property.amenities.length - 3}
                                   </Badge>
                                 )}
                               </div>
                             )}
                             
                             {property.images && property.images.length > 0 && (
                               <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                                 {property.images.slice(0, 2).map((imageUrl, index) => (
                                   <img
                                     key={index}
                                     src={imageUrl}
                                     alt={`${property.title} - Foto ${index + 1}`}
                                     className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border"
                                   />
                                 ))}
                                 {property.images.length > 2 && (
                                   <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                                     +{property.images.length - 2}
                                   </div>
                                 )}
                               </div>
                             )}
                           </div>
                           <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-end gap-3">
                             <Badge className={getStatusColor(property.status || 'pending')}>
                               {getStatusText(property.status || 'pending')}
                             </Badge>
                              
                              <div className="flex items-center gap-2">
                                <Link to={`/property/${property.id}`}>
                                  <Button size="sm" variant="outline" className="text-xs px-2 py-1">Ver</Button>
                                </Link>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs px-2 py-1" 
                                  onClick={() => handleEditProperty(property)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs px-2 py-1 text-red-600 hover:text-red-700" 
                                  onClick={() => handleDeleteProperty(property.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                             
                             {/* Switch ON/OFF para disponibilidade */}
                             <div className="flex items-center gap-2 text-xs sm:text-sm">
                               <span className={`${property.status === 'approved' ? 'text-green-600' : 'text-yellow-600'} hidden sm:inline`}>
                                 {property.status === 'approved' ? 'Disponível' : 'Indisponível'}
                               </span>
                               <Switch
                                 checked={property.status === 'approved'}
                                 onCheckedChange={() => 
                                   handlePropertyAvailabilityToggle(
                                     property.id, 
                                     property.status === 'approved' ? 'approved' : 'pending'
                                   )
                                 }
                                 disabled={loading}
                               />
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="third-party-properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quartos de Terceiros ({thirdPartyProperties.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {thirdPartyProperties.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma propriedade de terceiros pendente.</p>
                ) : (
                  <div className="space-y-4">
                     {thirdPartyProperties.map((property) => (
                       <div key={property.id} className="border rounded-lg p-3 sm:p-4">
                         <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                           <div className="flex-1 min-w-0">
                             <h3 className="font-semibold text-base sm:text-lg break-words">{property.title}</h3>
                             <p className="text-muted-foreground text-sm">{property.city}, {property.country}</p>
                             <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{property.description}</p>
                             <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                               <span>{property.bedrooms} quartos</span>
                               <span>{property.bathrooms} banheiros</span>
                               <span>{property.max_guests} hóspedes</span>
                               <span className="font-semibold">R$ {property.price_per_night.toFixed(2)}/noite</span>
                             </div>
                             {property.amenities && property.amenities.length > 0 && (
                               <div className="flex flex-wrap gap-1 mt-2">
                                 {property.amenities.slice(0, 3).map((amenity, index) => (
                                   <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                                     {amenity}
                                   </Badge>
                                 ))}
                                 {property.amenities.length > 3 && (
                                   <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                     +{property.amenities.length - 3}
                                   </Badge>
                                 )}
                               </div>
                             )}
                             
                             {property.images && property.images.length > 0 && (
                               <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                                 {property.images.slice(0, 2).map((imageUrl, index) => (
                                   <img
                                     key={index}
                                     src={imageUrl}
                                     alt={`${property.title} - Foto ${index + 1}`}
                                     className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border"
                                   />
                                 ))}
                                 {property.images.length > 2 && (
                                   <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                                     +{property.images.length - 2}
                                   </div>
                                 )}
                               </div>
                             )}
                           </div>
                           <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-end gap-2">
                             <Badge className={getStatusColor(property.status || 'pending')}>
                               {getStatusText(property.status || 'pending')}
                             </Badge>
                             {property.status === 'pending' && (
                               <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                                 <Button
                                   size="sm"
                                   onClick={() => handlePropertyStatusUpdate(property.id, 'approved')}
                                   className="text-xs px-2 py-1"
                                 >
                                   <CheckCircle className="w-3 h-3 mr-1" />
                                   <span className="hidden sm:inline">Aprovar</span>
                                   <span className="sm:hidden">✓</span>
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="destructive"
                                   onClick={() => handlePropertyStatusUpdate(property.id, 'denied')}
                                   className="text-xs px-2 py-1"
                                 >
                                   <XCircle className="w-3 h-3 mr-1" />
                                   <span className="hidden sm:inline">Negar</span>
                                   <span className="sm:hidden">✗</span>
                                 </Button>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Reservas ({bookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma reserva encontrada.</p>
                ) : (
                  <div className="space-y-4">
                     {bookings.map((booking) => (
                       <div key={booking.id} className="border rounded-lg p-3 sm:p-4">
                         <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                           <div className="flex-1 min-w-0">
                             <h3 className="font-semibold text-base sm:text-lg break-words">{booking.properties.title}</h3>
                             <p className="text-muted-foreground text-sm">
                               {booking.properties.city}, {booking.properties.country}
                             </p>
                             
                             {/* Guest Information with Avatar */}
                             <div className="flex items-center gap-2 sm:gap-3 mt-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                               <Avatar className="w-8 h-8 sm:w-12 sm:h-12">
                                 <AvatarImage src={booking.profiles.avatar_url || ''} />
                                 <AvatarFallback className="text-xs sm:text-sm">
                                   {booking.profiles.full_name
                                     .split(' ')
                                     .map(n => n[0])
                                     .join('')
                                     .toUpperCase()
                                     .slice(0, 2) || 'H'}
                                 </AvatarFallback>
                               </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm sm:text-base truncate">{booking.profiles.full_name}</p>
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{booking.profiles.email}</p>
                                  {booking.status === 'confirmed' && booking.profiles.whatsapp_number && (
                                    <p className="text-xs sm:text-sm text-green-600 font-medium truncate">
                                      WhatsApp: {booking.profiles.whatsapp_number}
                                    </p>
                                  )}
                                </div>
                             </div>
                             
                             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm">
                               <span className="break-words">
                                 {new Date(booking.check_in_date).toLocaleDateString('pt-BR')} - {' '}
                                 {new Date(booking.check_out_date).toLocaleDateString('pt-BR')}
                               </span>
                               <div className="flex gap-3 sm:gap-4">
                                 <span>{booking.total_nights} noites</span>
                                 <span>{booking.guest_count} hóspedes</span>
                                 <span className="font-semibold">R$ {booking.total_price.toFixed(2)}</span>
                               </div>
                             </div>
                           </div>
                           <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-end gap-2">
                             <Badge className={getStatusColor(booking.status)}>
                               {getStatusText(booking.status)}
                             </Badge>
                             <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                               {booking.status === 'pending' && (
                                 <>
                                   <Button
                                     size="sm"
                                     onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                                     className="text-xs px-2 py-1"
                                   >
                                     <CheckCircle className="w-3 h-3 mr-1" />
                                     <span className="hidden sm:inline">Confirmar</span>
                                     <span className="sm:hidden">✓</span>
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant="destructive"
                                     onClick={() => handleBookingStatusUpdate(booking.id, 'cancelled')}
                                     className="text-xs px-2 py-1"
                                   >
                                     <XCircle className="w-3 h-3 mr-1" />
                                     <span className="hidden sm:inline">Cancelar</span>
                                     <span className="sm:hidden">✗</span>
                                   </Button>
                                 </>
                               )}
                               {(booking.status === 'confirmed' || booking.status === 'approved') && (
                                 <Button
                                   size="sm"
                                   variant="destructive"
                                   onClick={() => handleBookingStatusUpdate(booking.id, 'cancelled')}
                                   className="text-xs px-2 py-1"
                                 >
                                   <XCircle className="w-3 h-3 mr-1" />
                                   <span className="hidden sm:inline">Cancelar</span>
                                   <span className="sm:hidden">✗</span>
                                 </Button>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;