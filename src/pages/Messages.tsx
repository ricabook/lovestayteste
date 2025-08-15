import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatThread from "@/components/ChatThread";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [propertiesMap, setPropertiesMap] = useState<Record<string, PropertyLite>>({});
  const [ownersMap, setOwnersMap] = useState<Record<string, ProfileLite>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to load metadata (properties + owners) in batch
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
    setConversations(data ?? []);
    setActiveId((data && data[0]?.id) || null);
    await loadMeta(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // Realtime watcher to refresh list on INSERT/UPDATE
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const renderLabel = (c: Conversation) => {
    const prop = c.property_id ? propertiesMap[c.property_id] : null;
    const owner = ownersMap[c.owner_id];
    const propTitle = prop?.title ?? "Imóvel";
    const ownerName = owner?.full_name ?? "Proprietário";
    return `Propriedade: ${propTitle} - Proprietário: ${ownerName}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Mensagens</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-2">
              {loading ? <div>Carregando conversas...</div> :
                (conversations.length === 0 ? <div className="text-sm text-muted-foreground">Nenhuma conversa encontrada.</div> :
                  conversations.map((c) => (
                    <Button key={c.id} variant={c.id === activeId ? "default" : "outline"} className="w-full justify-start"
                      onClick={() => setActiveId(c.id)}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-left w-full">{renderLabel(c)}</span>
                        <span className="text-xs opacity-70">Atualizada em {format(new Date(c.last_message_at), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    </Button>
                  ))
                )
              }
            </div>
            <div className="md:col-span-2 min-h-[60vh]">
              {activeId ? <ChatThread conversationId={activeId} /> : <div className="text-sm text-muted-foreground">Selecione uma conversa para visualizar.</div>}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
