import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatThread from "@/components/ChatThread";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";

type Conversation = {
  id: string;
  guest_id: string;
  owner_id: string;
  property_id: string | null;
  booking_id: string | null;
  last_message_at: string;
};

type PropertyLite = { id: string; title: string };
type ProfileLite = { user_id: string; full_name: string };

export default function Messages() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [propertiesMap, setPropertiesMap] = useState<Record<string, PropertyLite>>({});
  const [ownersMap, setOwnersMap] = useState<Record<string, ProfileLite>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  const loadMeta = async (convs: Conversation[]) => {
    const propIds = Array.from(new Set(convs.map(c => c.property_id).filter((x): x is string => !!x)));
    const ownerIds = Array.from(new Set(convs.map(c => c.owner_id)));
    try {
      if (propIds.length) {
        const { data: props, error } = await supabase
          .from("properties")
          .select("id,title")
          .in("id", propIds);
        if (error) throw error;
        const map: Record<string, PropertyLite> = {};
        (props ?? []).forEach(p => { map[p.id] = p as PropertyLite; });
        setPropertiesMap(map);
      } else {
        setPropertiesMap({});
      }

      if (ownerIds.length) {
        const { data: profs, error: err2 } = await supabase
          .from("profiles")
          .select("user_id,full_name")
          .in("user_id", ownerIds);
        if (err2) throw err2;
        const map2: Record<string, ProfileLite> = {};
        (profs ?? []).forEach(p => { map2[p.user_id] = p as ProfileLite; });
        setOwnersMap(map2);
      } else {
        setOwnersMap({});
      }
    } catch (e) {
      console.error("load meta", e);
      toast({ title: "Erro ao carregar dados da conversa", variant: "destructive" });
    }
  };

  const refresh = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`guest_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      
      if (error) {
        console.error("load convs", error);
        toast({ title: "Erro ao carregar conversas", variant: "destructive" });
        setConversations([]);
        setActiveId(null);
        setLoading(false);
        return;
      }
      
      const conversations = data as Conversation[] ?? [];
      setConversations(conversations);
      setActiveId((conversations && conversations[0]?.id) || null);
      await loadMeta(conversations);
      setLoading(false);
    } catch (error) {
      console.error("Error in refresh:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const renderLabel = (c: Conversation) => {
    const prop = c.property_id ? propertiesMap[c.property_id] : null;
    const owner = ownersMap[c.owner_id];
    const propTitle = prop?.title ?? "Imóvel";
    const ownerName = owner?.full_name ?? "Proprietário";
    return `Propriedade: ${propTitle} - Proprietário: ${ownerName}`;
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveId(conversationId);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowChat(false);
      setActiveId(null);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {!showChat ? (
            // Lista de conversas em mobile
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <h1 className="text-xl font-semibold">Mensagens</h1>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando conversas...</div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhuma conversa encontrada.</div>
                  ) : (
                    conversations.map((c) => (
                      <Button
                        key={c.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-4 text-left"
                        onClick={() => handleSelectConversation(c.id)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-sm">{renderLabel(c)}</span>
                          <span className="text-xs opacity-70 mt-1">
                            {format(new Date(c.last_message_at), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            // Chat thread em mobile
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="p-1 h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-medium truncate">
                  {activeId && conversations.find(c => c.id === activeId) 
                    ? renderLabel(conversations.find(c => c.id === activeId)!) 
                    : "Conversa"}
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                {activeId && <ChatThread conversationId={activeId} />}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Layout desktop
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Mensagens</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
            <div className="md:col-span-1 space-y-2 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando conversas...</div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhuma conversa encontrada.</div>
                  ) : (
                    conversations.map((c) => (
                      <Button
                        key={c.id}
                        variant={c.id === activeId ? "default" : "outline"}
                        className="w-full justify-start h-auto p-4"
                        onClick={() => setActiveId(c.id)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-left text-sm">{renderLabel(c)}</span>
                          <span className="text-xs opacity-70 mt-1">
                            {format(new Date(c.last_message_at), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="md:col-span-2 overflow-hidden">
              <div className="h-full">
                {activeId ? (
                  <ChatThread conversationId={activeId} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Selecione uma conversa para visualizar.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
