import { useRef, useEffect, useState } from "react";
import ChatBubble from "./ChatBubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMessaging } from "@/hooks/useMessaging";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  conversationId: string;
};

type Conversation = {
  id: string;
  guest_id: string;
  owner_id: string;
};

type Profile = { 
  user_id: string; 
  full_name: string | null; 
  avatar_url: string | null 
};

export default function ChatThread({ conversationId }: Props) {
  const { messages, loading, sendMessage } = useMessaging(conversationId);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const [participants, setParticipants] = useState<Record<string, Profile>>({});

  // Load conversation participants and their profiles
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const { data: conv, error } = await supabase
          .from("conversations")
          .select("id,guest_id,owner_id")
          .eq("id", conversationId)
          .single();
        
        if (error || !conv) {
          console.error("Error loading conversation:", error);
          return;
        }

        const ids = [conv.guest_id, conv.owner_id];
        const { data: profs, error: err2 } = await supabase
          .from("profiles")
          .select("user_id,full_name,avatar_url")
          .in("user_id", ids);
        
        if (err2) {
          console.error("Error loading profiles:", err2);
          return;
        }
        
        const map: Record<string, Profile> = {};
        (profs ?? []).forEach((p) => (map[p.user_id] = p as Profile));
        setParticipants(map);
      } catch (error) {
        console.error("Error in loadParticipants:", error);
      }
    };
    loadParticipants();
  }, [conversationId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      await sendMessage(text);
      setBody("");
    } catch (err) {
      console.error("send message", err);
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div 
        ref={listRef} 
        className="flex-1 overflow-y-auto space-y-3 p-4 bg-muted/20"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Carregando mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Sem mensagens ainda. Comece a conversa!
          </div>
        ) : (
          messages.map((m) => {
            const profile = participants[m.sender_id];
            return (
              <ChatBubble
                key={m.id}
                body={m.body}
                created_at={m.created_at}
                sender_id={m.sender_id}
                avatarUrl={profile?.avatar_url}
                name={profile?.full_name}
              />
            );
          })
        )}
      </div>
      
      {/* Input área com design mobile-friendly */}
      <div className="border-t bg-background">
        <form className="p-4 flex gap-2" onSubmit={onSubmit}>
          <Input 
            placeholder="Escreva sua mensagem..." 
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
            disabled={sending}
            className="flex-1 min-h-[44px] touch-manipulation"
            autoComplete="off"
          />
          <Button 
            type="submit" 
            disabled={sending || !body.trim()}
            className="min-h-[44px] px-6 touch-manipulation"
            size="default"
          >
            {sending ? "..." : "Enviar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
