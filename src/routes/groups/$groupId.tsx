import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/SignedImage";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Send, Users } from "lucide-react";

export const Route = createFileRoute("/groups/$groupId")({
  component: GroupChatPage,
  head: () => ({
    meta: [
      { title: "Group chat — 1Chance" },
      { name: "description", content: "Chat live with everyone in this 1Chance group." },
      { property: "og:title", content: "Group chat — 1Chance" },
      { property: "og:description", content: "Chat live with everyone in this 1Chance group." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const PAGE_SIZE = 50;

type GroupRow = { id: string; name: string; description: string | null; icon: string | null };
type GroupMessage = { id: string; group_id: string; user_id: string; content: string; created_at: string };
type Sender = { name: string | null; avatar_url: string | null };

function GroupChatPage() {
  const { groupId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupRow | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [senders, setSenders] = useState<Record<string, Sender>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSenders = useCallback(async (ids: string[]) => {
    const unique = Array.from(new Set(ids));
    if (unique.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, name, avatar_url").in("id", unique);
    if (!data) return;
    setSenders((prev) => {
      const next = { ...prev };
      for (const p of data as any[]) next[p.id] = { name: p.name, avatar_url: p.avatar_url };
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: g } = await (supabase as any)
      .from("groups")
      .select("id, name, description, icon")
      .eq("id", groupId)
      .maybeSingle();
    setGroup((g as GroupRow) ?? null);

    const { data: members } = await (supabase as any)
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);
    const memberRows = (members ?? []) as { user_id: string }[];
    setMemberCount(memberRows.length);
    const mine = memberRows.some((m) => m.user_id === user.id);
    setIsMember(mine);

    if (mine) {
      const { data: msgs } = await (supabase as any)
        .from("group_messages")
        .select("id, group_id, user_id, content, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      const ordered = ((msgs ?? []) as GroupMessage[]).slice().reverse();
      setMessages(ordered);
      await loadSenders(ordered.map((m) => m.user_id));
    } else {
      setMessages([]);
    }

    setLoading(false);
  }, [groupId, user, loadSenders]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    load();
  }, [authLoading, user, load, navigate]);

  useEffect(() => {
    if (!isMember || !user) return;
    const channel = (supabase as any)
      .channel(`group:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload: any) => {
          const msg = payload.new as GroupMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          loadSenders([msg.user_id]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isMember, user, loadSenders]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const join = async () => {
    if (!user) return;
    setJoining(true);
    const { error } = await (supabase as any)
      .from("group_members")
      .insert({ group_id: groupId, user_id: user.id });
    setJoining(false);
    if (error) {
      console.error("[group] join error", error);
      toast.error("Could not join this group");
      return;
    }
    toast.success("Joined!");
    await load();
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !user || sending) return;
    setSending(true);
    const { error } = await (supabase as any)
      .from("group_messages")
      .insert({ group_id: groupId, user_id: user.id, content: text });
    setSending(false);
    if (error) {
      console.error("[group] send error", error);
      toast.error("Message failed to send");
      return;
    }
    setInput("");
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[100dvh] flex-col bg-[var(--brand-soft)]/30">
        <header className="flex items-center gap-3 border-b border-border bg-card px-3 py-3 sm:px-6">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </header>
        <div className="flex-1 space-y-4 px-4 py-6 sm:px-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={"flex " + (i % 2 ? "justify-end" : "justify-start")}>
              <Skeleton className="h-12 w-52 rounded-3xl" />
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-card/85 px-3 py-3">
          <Skeleton className="mx-auto h-12 max-w-2xl rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--brand-soft)]/30">
      <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 sm:px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/groups" })} aria-label="Back to groups">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-xl">
          {group?.icon ?? "💬"}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight">{group?.name ?? "Group"}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {!isMember ? (
            <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-border bg-card p-8 text-center animate-fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-2xl">
                {group?.icon ?? "💬"}
              </div>
              <h2 className="mt-4 font-semibold">Join to participate</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {group?.description ?? "Join this group to read and send messages."}
              </p>
              <Button
                className="btn-pop mt-5 w-full rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
                disabled={joining}
                onClick={join}
              >
                {joining ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Join group
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto mt-16 max-w-xs text-center text-sm text-muted-foreground">
              No messages yet — say hi 👋
            </div>
          ) : (
            messages.map((m, i) => {
              const mine = m.user_id === user!.id;
              const prev = messages[i - 1];
              const grouped = prev && prev.user_id === m.user_id;
              const sender = senders[m.user_id];
              return (
                <div
                  key={m.id}
                  className={"flex animate-fade-in items-end gap-2 " + (mine ? "justify-end" : "justify-start") + (grouped ? " -mt-1.5" : "")}
                >
                  {!mine && (
                    <div className={grouped ? "w-7 shrink-0" : "shrink-0"}>
                      {!grouped && <Avatar path={sender?.avatar_url} name={sender?.name ?? "?"} size={28} />}
                    </div>
                  )}
                  <div
                    className={
                      "max-w-[78%] overflow-hidden px-4 py-2.5 text-[15px] leading-relaxed shadow-sm transition-colors " +
                      (mine
                        ? "rounded-3xl rounded-br-md bg-[var(--brand)] text-white"
                        : "rounded-3xl rounded-bl-md border border-border bg-card text-card-foreground")
                    }
                  >
                    {!mine && !grouped && (
                      <div className="mb-0.5 text-xs font-semibold text-[var(--brand)]">
                        {sender?.name ?? "Someone"}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    <div
                      className={
                        "mt-0.5 text-right text-[10px] font-normal tabular-nums " +
                        (mine ? "text-white/60" : "text-muted-foreground/70")
                      }
                    >
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isMember && (
        <div className="border-t border-border bg-card/85 px-3 py-3 backdrop-blur sm:px-4">
          <div className="mx-auto flex max-w-2xl items-center gap-1.5 rounded-full border border-border bg-muted/40 px-1.5 py-1.5 transition-colors focus-within:border-[var(--brand)]/50 focus-within:bg-muted/60">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message the group…"
              className="h-10 flex-1 rounded-full border-0 bg-transparent px-3 text-[15px] shadow-none focus-visible:ring-0"
              maxLength={2000}
            />
            <Button
              onClick={send}
              disabled={sending || !input.trim()}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-[var(--brand)] transition-all hover:scale-105 hover:bg-[var(--brand)]/90 active:scale-95 disabled:opacity-40"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
