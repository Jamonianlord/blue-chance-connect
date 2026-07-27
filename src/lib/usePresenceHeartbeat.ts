import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function usePresenceHeartbeat(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const ping = async () => {
      if (document.visibilityState !== "visible") return;
      await supabase.from("profiles" as any).update({ last_seen: new Date().toISOString() }).eq("id", userId);
    };

    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId]);
}