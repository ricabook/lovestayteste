
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatThread from "@/components/ChatThread";
import { format } from "date-fns";

type Conversation = {
  id: string;
  guest_id: string;
  owner_id: string;
  property_id: string | null;
  booking_id: string | null;
  last_message_at: string;
};

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`guest_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      if (error) console.error("load convs", error);
      setConversations(data ?? []);
      setActiveId((data && data[0]?.id) || null);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (_payload) => {
          // Reload list on new conversation
          if (user?.id) {
            supabase.from("conversations")
              .select("*")
              .or(`guest_id.eq.${user.id},owner_id.eq.${user.id}`)
              .order("last_message_at", { ascending: false })
              .then(({ data }) => setConversations(data ?? []));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (_payload) => {
          // Reload list when last_message_at updates
          if (user?.id) {
            supabase.from("conversations")
              .select("*")
              .or(`guest_id.eq.${user.id},owner_id.eq.${user.id}`)
              .order("last_message_at", { ascending: false })
              .then(({ data }) => setConversations(data ?? []));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="container mx-auto py-6">
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
                      <span className="font-medium">Conversa</span>
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
    </div>
  );
}
