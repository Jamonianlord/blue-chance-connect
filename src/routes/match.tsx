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
  const [slowLoad, setSlowLoad] = useState(false);
  const cancelledRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  };

  const startSearch = async () => {
    if (!user || !profile) return;
    setSearching(true);
    cancelledRef.current = false;

    // Subscribe to chats where I'm added as user2 (someone matched with me)
    const channel = supabase
      .channel(`match:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats", filter: `user2_id=eq.${user.id}` },
        (payload) => {
          const chat = payload.new as { id: string };
          supabase.removeChannel(channel);
          if (pollRef.current) clearInterval(pollRef.current);
          navigate({ to: "/chat/$chatId", params: { chatId: chat.id } });
        },
      )
      .subscribe();

    const tryMatch = async () => {
      if (cancelledRef.current) return;
      const { data, error } = await supabase.rpc("find_or_wait_match", { _looking_for: lookingFor });
      if (error) { toast.error(error.message); await stopSearch(); return; }
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.chat_id) {
        supabase.removeChannel(channel);
        if (pollRef.current) clearInterval(pollRef.current);
        navigate({ to: "/chat/$chatId", params: { chatId: row.chat_id } });
      }
    };

    await tryMatch();
    pollRef.current = setInterval(tryMatch, 4000);

    // Cleanup on unmount via effect below
    return () => { supabase.removeChannel(channel); };
  };

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (user) supabase.from("waiting_pool").delete().eq("user_id", user.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              Hang tight — we're looking for someone online right now who wants to chat.
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
