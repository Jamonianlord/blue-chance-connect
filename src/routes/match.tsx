import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { FirstTimeTour } from "@/components/FirstTimeTour";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, X, Bell, BellRing } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePushSubscription } from "@/lib/usePushSubscription";

export const Route = createFileRoute("/match")({
  component: MatchPage,
  head: () => ({
    meta: [
      { title: "Finding your match \u2014 1Chance" },
      { name: "description", content: "Looking for someone new to chat with on 1Chance." },
      { property: "og:title", content: "Finding your match \u2014 1Chance" },
      { property: "og:description", content: "Matching you with someone online right now." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type LookingFor = "male" | "female" | "other";

function MatchPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { subscribe, subscribing, subscribed } = usePushSubscription(user?.id);
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [lookingFor, setLookingFor] = useState<LookingFor>("female");
  const [searchingCount, setSearchingCount] = useState(0);
  const [slowLoad, setSlowLoad] = useState(false);
  const cancelledRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
    if (presenceRef.current) {
      presenceRef.current?.untrack();
      supabase.removeChannel(presenceRef.current);
      presenceRef.current = null;
      setSearchingCount(0);
    }
  };

  const startSearch = async () => {
    if (!user || !profile) return;
    setSearching(true);
    cancelledRef.current = false;

    const navigateToChat = (chatId: string) => {
      if (cancelledRef.current) return;
      cancelledRef.current = true;
      if (pollRef.current) clearInterval(pollRef.current);
      navigate({ to: "/chat/$chatId", params: { chatId } });
    };

    const tryMatch = async () => {
      if (cancelledRef.current) return;

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
    pollRef.current = setInterval(tryMatch, 800);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        supabase.from("waiting_pool").delete().eq("user_id", user.id);
      }
      if (presenceRef.current) {
        presenceRef.current?.untrack();
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };

    const handlePageHide = () => {
      if (user) {
        supabase.from("waiting_pool").delete().eq("user_id", user.id);
      }
      if (presenceRef.current) {
        presenceRef.current?.untrack();
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };

    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && searching && user) {
        console.log("[match] tab visible, re-checking match state...");
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

    if (searching && user) {
      const presenceChannel = supabase.channel("presence:online-users", {
        config: {
          broadcast: { self: false },
          presence: {},
        },
      });

      presenceChannel
        .on("presence", { event: "join" }, () => {
          const state = presenceChannel?.presenceState();
          const count = state ? Object.keys(state).length : 0;
          setSearchingCount(count);
        })
        .on("presence", { event: "leave" }, () => {
          const state = presenceChannel?.presenceState();
          const count = state ? Object.keys(state).length : 0;
          setSearchingCount(count);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            presenceChannel?.track({
              searching: true,
              lookingFor: lookingFor,
            });
          }
        });

      presenceRef.current = presenceChannel;
    } else if (!searching && presenceRef.current) {
      presenceRef.current?.untrack();
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
      setSearchingCount(0);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelledRef.current = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (user) supabase.from("waiting_pool").delete().eq("user_id", user.id);
      if (presenceRef.current) {
        presenceRef.current?.untrack();
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [searching, user, lookingFor]);

  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="mx-auto h-40 w-40 rounded-full" />
          <Skeleton className="mx-auto h-5 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
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
      <FirstTimeTour />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col items-center justify-center px-4 py-12">
        {!searching ? (
          <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-xl">
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
              id="btn-find-match"
              onClick={startSearch}
              className="brand-gradient brand-glow btn-pop mt-6 h-12 w-full rounded-full text-base font-semibold text-white hover:opacity-95"
            >
              Find my match
            </Button>
            {!subscribed && (
              <Button
                onClick={subscribe}
                disabled={subscribing}
                variant="ghost"
                className="mt-3 h-10 w-full rounded-full text-sm text-muted-foreground"
              >
                {subscribing ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="mr-1.5 h-4 w-4" />
                )}
                Notify me when someone's online
              </Button>
            )}
            {subscribed && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <BellRing className="h-3.5 w-3.5" /> Notifications enabled
              </div>
            )}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center text-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <div className="animate-ring-out absolute inset-0 rounded-full border border-[var(--brand)]/30" />
              <div className="animate-ring-out absolute inset-0 rounded-full border border-[var(--brand)]/30" style={{ animationDelay: "-0.95s" }} />
              <div className="animate-ring-out absolute inset-0 rounded-full border border-[var(--brand)]/30" style={{ animationDelay: "-1.9s" }} />
              <div className="animate-breathe absolute inset-8 rounded-full bg-[var(--brand)]/15 blur-xl" />
              <div className="animate-breathe relative flex h-24 w-24 items-center justify-center rounded-full brand-gradient brand-glow">
                <div className="flex items-end gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="animate-dot block h-2 w-2 rounded-full bg-card"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <h2 className="mt-8 text-2xl font-bold">Finding your match...</h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {searchingCount > 0 ? (
                <>
                  <span className="font-medium">{searchingCount}</span> {searchingCount === 1 ? "person" : "people"} online now
                </>
              ) : (
                "Hang tight \u2014 we're looking for someone online right now who wants to chat."
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

