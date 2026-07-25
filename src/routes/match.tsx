import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";

export const Route = createFileRoute("/match")({
  component: MatchPage,
  head: () => ({
    meta: [
      { title: "Finding your match — 1Chance" },
      { name: "description", content: "Looking for someone new to chat with on 1Chance." },
      { property: "og:title", content: "Finding your match — 1Chance" },
      { property: "og:description", content: "Matching you with someone online right now." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type LookingFor = "male" | "female" | "other";

function MatchPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [lookingFor, setLookingFor] = useState<LookingFor>("female");
  const [searchingCount, setSearchingCount] = useState(0);
  const [slowLoad, setSlowLoad] = useState(false);
  const cancelledRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user && !profile) {
      const t = setTimeout(() => setSlowLoad(true), 4000);
      return () => clearTimeout(t);
    }
  }, [authLoading, user, profile]);

  useEffect(() => {
    if (profile?.gender === "male") setLookingFor("female");
    else if (profile?.gender === "female") setLookingFor("male");
  }, [profile]);

const stopSearch = async () => {
    cancelledRef.current = true;
    setSearching(false);
    if (pollRef.current) clearInterval(pollRef.current);
    if (user) await supabase.from("waiting_pool").delete().eq("user_id", user.id);
    // Clean up match channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    // Clean up presence
    if (presenceRef.current) {
      presenceRef.current?.untrack(); // Remove our presence tracking
      supabase.removeChannel(presenceRef.current);
      presenceRef.current = null;
      setSearchingCount(0); // Reset count when we stop searching
    }
  };

  const startSearch = async () => {
    if (!user || !profile) return;
    setSearching(true);
    cancelledRef.current = false;

    
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollingActive = false;

    const navigateToChat = (chatId: string) => {
      if (cancelledRef.current) return;
      cancelledRef.current = true;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      navigate({ to: "/chat/$chatId", params: { chatId } });
    };

    const subscribeMatchChannel = () => {
      if (cancelledRef.current || !user) return;
      channelRef.current = supabase
        .channel(`match:${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chats", filter: `user2_id=eq.${user.id}` },
          (payload) => {
            const chat = payload.new as { id: string };
            navigateToChat(chat.id);
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chats", filter: `user1_id=eq.${user.id}` },
          (payload) => {
            const chat = payload.new as { id: string };
            navigateToChat(chat.id);
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "CLOSED") {
            console.warn("[match] channel closed/error, attempting reconnection...", status);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !cancelledRef.current) {
              reconnectAttempts++;
              const delay = Math.min(1000 * reconnectAttempts, 10000);
              reconnectTimer = setTimeout(() => {
if (channelRef.current) supabase.removeChannel(channelRef.current);
                subscribeMatchChannel();
              }, delay);
            }
          } else if (status === "SUBSCRIBED") {
            reconnectAttempts = 0;
          }
        });
    };

    subscribeMatchChannel();

    const tryMatch = async () => {
      if (cancelledRef.current) return;

      // Fallback: if we already have an active chat, redirect there
      try {
        const { data: existingChats, error: qErr } = await supabase
          .from("chats")
          .select("id")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .is("ended_at", null)
          .limit(1);

        if (qErr) {
          console.error("[match] fallback query error", qErr);
          return;
        }

        if (existingChats && existingChats.length > 0) {
          navigateToChat(existingChats[0].id);
          return;
        }
      } catch (err) {
        console.error("[match] fallback query unexpected error", err);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("find_or_wait_match", { _looking_for: lookingFor });
        if (error) {
          toast.error(error.message);
          await stopSearch();
          return;
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.chat_id) {
          navigateToChat(row.chat_id);
        }
      } catch (err) {
        console.error("[match] RPC find_or_wait_match failed", err);
        toast.error("Failed to find match. Please try again.");
        await stopSearch();
        return;
      }
    };

    await tryMatch();
    pollRef.current = setInterval(tryMatch, 4000);

    // Cleanup on unmount via effect below
return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  };

useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        supabase.from("waiting_pool").delete().eq("user_id", user.id);
      }
      // Clean up presence on unload
      if (presenceRef.current) {
        presenceRef.current?.untrack(); // Remove our presence tracking
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };
    
    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && searching && user) {
        console.log("[match] tab visible, re-checking match state...");
        // Force an immediate poll check when returning to the tab
        const { data: existingChats } = await supabase
          .from("chats")
          .select("id")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .is("ended_at", null)
          .limit(1);
        if (existingChats && existingChats.length > 0) {
          if (pollRef.current) clearInterval(pollRef.current);
          navigate({ to: "/chat/$chatId", params: { chatId: existingChats[0].id } });
        }
      }
    };
    
    // Set up presence tracking when searching starts
    if (searching && user) {
      // Presence channel for tracking who's currently searching
      const presenceChannel = supabase.channel('presence:online-users', {
        config: {
          broadcast: { self: false },
          presence: { 
            // Will store { searching: boolean, lookingFor: string }
          }
        }
      });
      
      // Track presence state changes
      presenceChannel
        .on('presence', { event: 'join' }, () => {
          // Update count when someone joins
          const state = presenceChannel?.presenceState();
            const count = state ? Object.keys(state).length : 0;
            setSearchingCount(count);
        })
        .on('presence', { event: 'leave' }, () => {
          // Update count when someone leaves
          const state = presenceChannel?.presenceState();
            const count = state ? Object.keys(state).length : 0;
            setSearchingCount(count);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Set our initial presence state when subscribed
            presenceChannel?.track({
              searching: true,
              lookingFor: lookingFor
            });
          }
        });
      
      // Store reference to cleanup later
      presenceRef.current = presenceChannel;
    } else if (!searching && presenceRef.current) {
      // Clean up presence when searching stops
      presenceRef.current?.untrack(); // Remove our presence tracking
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
      setSearchingCount(0); // Reset count when we stop searching
    }
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
      cancelledRef.current = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (user) supabase.from("waiting_pool").delete().eq("user_id", user.id);
      // Clean up match channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // Clean up presence
      if (presenceRef.current) {
        presenceRef.current?.untrack(); // Remove our presence tracking
        if (presenceRef.current) {
          supabase.removeChannel(presenceRef.current);
          presenceRef.current = null;
        }
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [searching, user, lookingFor]);

  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
        {slowLoad && (
          <div className="max-w-sm space-y-3">
            <p className="text-sm text-muted-foreground">
              This is taking longer than expected. Your profile may not be set up yet.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => navigate({ to: "/profile" })}>
                Complete profile
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col items-center justify-center px-4 py-12">
        {!searching ? (
          <div className="w-full rounded-3xl border border-border bg-white p-8 shadow-xl">
            <h1 className="text-2xl font-bold">Ready when you are, {profile.name}.</h1>
            <p className="mt-1 text-sm text-muted-foreground">Who would you like to meet?</p>
            <RadioGroup value={lookingFor} onValueChange={(v) => setLookingFor(v as LookingFor)} className="mt-5 grid grid-cols-3 gap-2">
              {(["male", "female", "other"] as const).map(g => (
                <Label
                  key={g}
                  className={"cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-medium capitalize transition " +
                    (lookingFor === g ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-border hover:bg-muted")}
                >
                  <RadioGroupItem value={g} className="sr-only" />
                  {g}
                </Label>
              ))}
            </RadioGroup>
            <Button
              onClick={startSearch}
              className="brand-gradient brand-glow mt-6 h-12 w-full rounded-full text-base font-semibold text-white hover:opacity-95"
            >
              Find my match
            </Button>
          </div>
        ) : (
<div className="flex w-full flex-col items-center text-center">
             <div className="relative flex h-40 w-40 items-center justify-center">
               <div className="absolute inset-0 animate-ping rounded-full bg-[var(--brand)]/20" />
               <div className="absolute inset-4 animate-pulse rounded-full bg-[var(--brand)]/30" />
               <div className="relative flex h-24 w-24 items-center justify-center rounded-full brand-gradient brand-glow">
                 <Loader2 className="h-10 w-10 animate-spin text-white" />
               </div>
             </div>
             <h2 className="mt-8 text-2xl font-bold">Finding your match…</h2>
             <p className="mt-2 max-w-xs text-sm text-muted-foreground">
               {searchingCount > 0 ? (
            <>
              <span className="font-medium">{searchingCount}</span> {searchingCount === 1 ? "person" : "people"} online now
            </>
          ) : (
            "Hang tight — we're looking for someone online right now who wants to chat."
          )}
             </p>
             <Button
               onClick={stopSearch}
               variant="outline"
               className="mt-8 rounded-full"
             >
               <X className="mr-1 h-4 w-4" /> Cancel
             </Button>
           </div>
        )}
      </main>
    </div>
  );
}
