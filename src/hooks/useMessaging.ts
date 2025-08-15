import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export function useMessaging(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Gera ID temporário simples
  const genTempId = () => "temp-" + Math.random().toString(36).substring(2, 9);

  // Carrega mensagens iniciais
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!conversationId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("load messages", error);
      } else if (active) {
        setMessages(data ?? []);
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [conversationId]);

  // Assinatura realtime
  useEffect(() => {
    if (!conversationId) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const next = prev.map((m) => 
              m.id.startsWith("temp-") && m.body === msg.body ? msg : m
            );
            if (!next.some((m) => m.id === msg.id)) next.push(msg);
            return next;
          });
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [conversationId]);

  // Envio otimista
  const sendMessage = async (body: string) => {
    if (!conversationId || !body.trim()) return;
    const tempId = genTempId();
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: "me",
      body: body.trim(),
      created_at: new Date().toISOString(),
    } as Message;

    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, body: body.trim() })
      .select("*")
      .single();

    if (error) {
      console.error("sendMessage", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw error;
    }

    if (data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as Message) : m)));
    }
  };

  return { messages, loading, sendMessage };
}
