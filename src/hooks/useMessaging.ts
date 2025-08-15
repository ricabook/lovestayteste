import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { v4 as uuid } from "uuid";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export function useMessaging(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial messages
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

  // Realtime subscription
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
            // de-dup by id (reconcile optimistic temp)
            if (prev.some((m) => m.id === msg.id)) return prev;
            // replace temp (client-only) if matches by created_at & body
            const next = prev.map((m) => (m.id.startsWith("temp-") && m.body === msg.body ? msg : m));
            // If not replaced, append
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

  // Optimistic send
  const sendMessage = async (body: string) => {
    if (!conversationId || !body.trim()) return;
    const tempId = "temp-" + uuid();
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: "me", // placeholder; won't be used after reconciliation
      body: body.trim(),
      created_at: new Date().toISOString(),
    } as Message;

    // Immediate UI feedback
    setMessages((prev) => [...prev, optimistic]);

    // Insert and fetch real row (with ids & timestamps)
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, body: body.trim() })
      .select("*")
      .single();

    if (error) {
      console.error("sendMessage", error);
      // rollback optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw error;
    }

    if (data) {
      // Replace optimistic with real one
      setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as Message) : m)));
    }
  };

  return { messages, loading, sendMessage };
}
