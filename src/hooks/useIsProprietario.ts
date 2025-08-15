
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsProprietario(userId?: string) {
  const [isProprietario, setIsProprietario] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setIsProprietario(false);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", userId)
        .limit(1);
      if (error) {
        console.error("useIsProprietario error", error);
      }
      setIsProprietario(!!data && data.length > 0);
      setLoading(false);
    };
    load();
  }, [userId]);

  return { isProprietario, loading };
}
