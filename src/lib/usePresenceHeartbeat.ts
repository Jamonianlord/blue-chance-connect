import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL_MS = 20_000;

export function usePresenceHeartbeat(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const ping = async () => {
      try {
        await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId);
      } catch {
        // silent
      }
    };

    const startHeartbeat = () => {
      ping();
      intervalId = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    };

    const stopHeartbeat = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    if (document.visibilityState === "visible") {
      startHeartbeat();
    }

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId]);
}