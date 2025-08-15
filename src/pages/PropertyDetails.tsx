import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateConversationForProperty } from '@/hooks/useMessaging';

type Property = {
  id: string;
  title: string;
  is_available: boolean;
};

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('properties').select('id,title,is_available').eq('id', id).single();
      if (error) {
        console.error(error);
        toast({ title: 'Erro ao carregar imóvel', variant: 'destructive' });
        return;
      }
      setProperty(data as Property);
    };
    load();
  }, [id]);

  const handleStartChat = async () => {
    if (isStartingChat) return;
    setIsStartingChat(true);
    try {
      if (!property?.id) {
        toast({ title: 'Imóvel não encontrado.', variant: 'destructive' });
        return;
      }
      if (!user?.id) {
        toast({ title: 'Faça login para conversar com o proprietário.', description: 'Redirecionando…' });
        navigate(`/auth?next=${encodeURIComponent(location.pathname)}`);
        return;
      }
      const convId = await getOrCreateConversationForProperty(property.id);
      if (!convId) {
        toast({ title: 'Não foi possível iniciar a conversa.', variant: 'destructive' });
        return;
      }
      try {
        navigate(`/mensagens#${convId}`);
      } catch {
        window.location.assign(`/mensagens#${convId}`);
      }
    } catch (e) {
      console.error('start chat error', e);
      toast({ title: 'Erro ao iniciar conversa.', variant: 'destructive' });
    } finally {
      setTimeout(() => setIsStartingChat(false), 300);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>{property?.title ?? 'Imóvel'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-3">
              <Button 
                type="button"
                variant="outline"
                onClick={handleStartChat}
                onTouchEnd={(e) => { e.preventDefault(); handleStartChat(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStartChat(); } }}
                className="w-full h-12 mt-2 relative z-20"
                aria-label="Iniciar conversa com o proprietário"
                disabled={isStartingChat}
              >
                {isStartingChat ? 'Abrindo…' : 'Iniciar conversa com o proprietário'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PropertyDetails;
