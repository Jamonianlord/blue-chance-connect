import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BFokQLea_WLO4wDQD34SOmXaGVVXe8G8EaDz_85MasXxgo3ySnjYY8hgC2i4bgKk3nLwCMtChigV6D_Mm1PqYVU";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription(userId: string | undefined) {
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = useCallback(async () => {
    if (!userId) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications aren't supported on this browser.");
      return;
    }
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was denied.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions" as any).upsert({
        user_id: userId,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      }, { onConflict: "endpoint" });
      if (error) throw error;
      setSubscribed(true);
      toast.success("You'll be notified when someone's online.");
    } catch (e) {
      console.error("[push] subscribe error", e);
      toast.error("Couldn't enable notifications.");
    } finally {
      setSubscribing(false);
    }
  }, [userId]);

  return { subscribe, subscribing, subscribed };
}