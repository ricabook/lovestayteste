
import { useRef, useEffect, useState } from "react";
import ChatBubble from "./ChatBubble";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMessaging } from "@/hooks/useMessaging";

type Props = {
  conversationId: string;
};

export default function ChatThread({ conversationId }: Props) {
  const { messages, loading, sendMessage } = useMessaging(conversationId);
  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

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
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (body.trim()) { sendMessage(body.trim()); setBody(""); } }}>
        <Input placeholder="Escreva sua mensagem..." value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="submit">Enviar</Button>
      </form>
    </div>
  );
}
