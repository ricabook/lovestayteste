import { useRef, useEffect, useState } from "react";
import ChatBubble from "./ChatBubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMessaging } from "@/hooks/useMessaging";
import { toast } from "@/components/ui/use-toast";

type Props = {
  conversationId: string;
};

export default function ChatThread({ conversationId }: Props) {
  const { messages, loading, sendMessage } = useMessaging(conversationId);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 p-4 border rounded-md">
        {loading ? <div>Carregando mensagens...</div> : (
          messages.length === 0 ? <div className="text-sm text-muted-foreground">Sem mensagens ainda.</div> :
          messages.map((m) => (
            <ChatBubble key={m.id} body={m.body} created_at={m.created_at} sender_id={m.sender_id} />
          ))
        )}
      </div>
      <form className="mt-2 flex gap-2" onSubmit={onSubmit}>
        <Input placeholder="Escreva sua mensagem..." value={body} onChange={(e) => setBody(e.target.value)} disabled={sending} />
        <Button type="submit" disabled={sending}>{sending ? "Enviando..." : "Enviar"}</Button>
      </form>
    </div>
  );
}
