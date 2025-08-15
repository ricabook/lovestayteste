import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export function useMessaging(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("load messages error:", error);
        setMessages([]);
      } else {
        setMessages(data ?? []);
      }
      setLoading(false);
    };

    load();

    if (!conversationId) return;

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
      active = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (body: string) => {
    if (!conversationId || !body.trim()) return;
    const { data: userResp } = await supabase.auth.getUser();
    const senderId = userResp?.user?.id;
    if (!senderId) return;
    const { error } = await supabase.from("messages").insert({ 
      conversation_id: conversationId, 
      body, 
      sender_id: senderId 
    });
    if (error) console.error("sendMessage error:", error);
  };

  return { messages, loading, sendMessage };
}

export async function getOrCreateConversationForProperty(
  propertyId: string,
  ownerId?: string
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("get_or_create_conversation_for_property", { prop_id: propertyId });
  if (!error && data) {
    return { id: data as unknown as string, error: null };
  }

  if (!ownerId) {
    return { id: null, error: error?.message || "ownerId ausente no fallback" };
  }

  const { data: userResp } = await supabase.auth.getUser();
  const guestId = userResp?.user?.id;
  if (!guestId) return { id: null, error: "Usuário não autenticado" };

  const { data: existing, error: selErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("property_id", propertyId)
    .eq("owner_id", ownerId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (selErr) return { id: null, error: selErr.message };
  if (existing?.id) return { id: existing.id, error: null };

  const { data: inserted, error: insErr } = await supabase
    .from("conversations")
    .insert({ guest_id: guestId, owner_id: ownerId, property_id: propertyId })
    .select("id")
    .maybeSingle();

  if (insErr) return { id: null, error: insErr.message };
  return { id: inserted?.id ?? null, error: inserted ? null : "Falha desconhecida ao criar conversa" };
}
