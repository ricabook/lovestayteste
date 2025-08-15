
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

export function useMessaging(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!conversationId) return;
    let isMounted = true;
    const fetchMsgs = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("load messages", error);
      } else if (isMounted) {
        setMessages(data ?? []);
      }
      setLoading(false);
    };
    fetchMsgs();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (body: string) => {
    if (!conversationId || !body.trim()) return;
    const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, body });
    if (error) console.error("sendMessage", error);
  };

  return { messages, loading, sendMessage };
}

export async function getOrCreateConversationForProperty(propertyId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_or_create_conversation_for_property", { prop_id: propertyId });
  if (error) {
    console.error("getOrCreateConversationForProperty", error);
    return null;
  }
  return data as unknown as string;
}
