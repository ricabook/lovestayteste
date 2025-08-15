import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PropertyOwnerCardProps {
  ownerId: string;
}

interface OwnerInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

const PropertyOwnerCard = ({ ownerId }: PropertyOwnerCardProps) => {
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwnerInfo();
  }, [ownerId]);

  const fetchOwnerInfo = async () => {
    try {
      // Buscar informações do perfil e role do proprietário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('user_id', ownerId)
        .single();

      if (profileError) {
        console.error('Error fetching owner profile:', profileError);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', ownerId)
        .single();

      if (roleError) {
        console.error('Error fetching owner role:', roleError);
        return;
      }

      setOwnerInfo({
        id: profileData.id,
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        role: roleData.role
      });
    } catch (error) {
      console.error('Error fetching owner info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerClick = () => {
    if (ownerInfo?.role === 'proprietario') {
      navigate(`/profile/${ownerId}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAdmin = ownerInfo?.role === 'admin';
  const isProprietario = ownerInfo?.role === 'proprietario';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={ownerInfo?.avatar_url || undefined} />
            <AvatarFallback>
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {isAdmin ? (
                'Propriedade LoveStay'
              ) : (
                <>
                  Propriedade de{' '}
                  {isProprietario ? (
                    <button
                      onClick={handleOwnerClick}
                      className="text-primary hover:text-primary/80 underline cursor-pointer transition-colors"
                    >
                      {ownerInfo?.full_name || 'Proprietário'}
                    </button>
                  ) : (
                    <span>{ownerInfo?.full_name || 'Proprietário'}</span>
                  )}
                </>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isAdmin 
                ? 'Propriedade gerenciada pela equipe LoveStay'
                : 'Anfitrião particular'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyOwnerCard;