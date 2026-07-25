import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Ban, Flag, Send, SkipForward, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/chat/$chatId")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "Chat — 1Chance" },
      { name: "description", content: "Your live 1Chance conversation." },
      { property: "og:title", content: "Chat — 1Chance" },
      { property: "og:description", content: "Live 1-on-1 chat on 1Chance." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Message = { id: string; chat_id: string; sender_id: string; content: string; created_at: string };
type ChatRow = { id: string; user1_id: string; user2_id: string; ended_at: string | null; ended_by: string | null };

function ChatPage() {
  const { chatId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState<ChatRow | null>(null);
  const [partnerName, setPartnerName] = useState<string>("Stranger");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data: c } = await supabase.from("chats").select("*").eq("id", chatId).maybeSingle();
      if (cancelled) return;
      if (!c) { toast.error("Chat not found"); navigate({ to: "/match" }); return; }
      setChat(c as ChatRow);
      const { data: p } = await supabase.rpc("get_chat_partner", { _chat_id: chatId });
      const partner = Array.isArray(p) ? p[0] : p;
      if (!cancelled && partner?.name) setPartnerName(partner.name);
      const { data: msgs } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
      if (!cancelled) setMessages((msgs ?? []) as Message[]);
    })();

    const channel = supabase
      .channel(`chat:${chatId}`, { config: { broadcast: { self: false } } })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((cur) => {
            if (cur.some((m) => m.id === msg.id)) return cur;
            return [...cur, msg];
          });
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats", filter: `id=eq.${chatId}` },
        (payload) => {
          const updated = payload.new as ChatRow;
          setChat(updated);
          if (updated.ended_at && updated.ended_by !== user.id) {
            toast.info("Your partner ended the chat.");
          }
        })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.from !== user.id) {
          setPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 2000);
        }
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [chatId, user, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, partnerTyping]);

  const partnerId = chat && user ? (chat.user1_id === user.id ? chat.user2_id : chat.user1_id) : null;
  const ended = !!chat?.ended_at;

  const send = async () => {
    const text = input.trim();
    if (!text || !user || sending || ended) return;
    setSending(true);
    setInput("");

    const tempId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((cur) => [...cur, optimisticMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert({ chat_id: chatId, sender_id: user.id, content: text })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setInput(text);
      setMessages((cur) => cur.filter((m) => m.id !== tempId));
    } else if (data) {
      setMessages((cur) => cur.map((m) => (m.id === tempId ? (data as Message) : m)));
    }

    setSending(false);
  };

  const onType = (v: string) => {
    setInput(v);
    if (channelRef.current && user) {
      channelRef.current.send({ type: "broadcast", event: "typing", payload: { from: user.id } });
    }
  };

  const endAndNext = async () => {
    await supabase.rpc("end_chat", { _chat_id: chatId });
    navigate({ to: "/match" });
  };

  const goBack = async () => {
    if (!ended) await supabase.rpc("end_chat", { _chat_id: chatId });
    navigate({ to: "/" });
  };

  const blockPartner = async () => {
    if (!partnerId) return;
    await supabase.from("blocks").insert({ blocker_id: user!.id, blocked_id: partnerId });
    await supabase.rpc("end_chat", { _chat_id: chatId });
    toast.success("User blocked.");
    navigate({ to: "/match" });
  };

  const reportPartner = async () => {
    if (!partnerId) return;
    await supabase.from("reports").insert({ reporter_id: user!.id, reported_id: partnerId, chat_id: chatId, reason: reportReason || null });
    toast.success("Report submitted. Thank you.");
    setReportReason("");
  };

  if (authLoading || !chat) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--brand-soft)]/30">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-white/90 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="text-sm font-semibold leading-tight">{partnerName}</div>
            <div className="text-xs text-muted-foreground">{ended ? "Chat ended" : "Chatting now"}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Logo className="hidden sm:inline-flex" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground"><Flag className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Report this user</AlertDialogTitle>
                <AlertDialogDescription>Tell us what happened. We review every report.</AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Reason (optional)"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                maxLength={500}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={reportPartner} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Submit report
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground"><Ban className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Block this user?</AlertDialogTitle>
                <AlertDialogDescription>You won't be matched with them again.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={blockPartner} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Block
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button size="sm" onClick={endAndNext} className="ml-1 rounded-full bg-[var(--brand)] hover:bg-[var(--brand)]/90">
            <SkipForward className="mr-1 h-4 w-4" /> Next
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-2">
          {messages.length === 0 && (
            <div className="mx-auto mt-16 max-w-xs text-center text-sm text-muted-foreground">
              Say hi 👋 — you have one chance to make it a great chat.
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user!.id;
            return (
              <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                <div className={"max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm " +
                  (mine
                    ? "bg-[var(--brand)] text-white rounded-br-sm"
                    : "bg-white text-foreground border border-border rounded-bl-sm"
                  )}>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div className={"mt-1 text-[10px] " + (mine ? "text-white/70" : "text-muted-foreground")}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          {partnerTyping && !ended && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-border bg-white px-4 py-2 shadow-sm">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-white/90 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {ended ? (
            <Button onClick={() => navigate({ to: "/match" })} className="brand-gradient h-11 w-full rounded-full text-white">
              Find a new match
            </Button>
          ) : (
            <>
              <Input
                value={input}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a message…"
                className="h-11 flex-1 rounded-full border-border bg-muted/50"
                maxLength={2000}
              />
              <Button
                onClick={send}
                disabled={sending || !input.trim()}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full bg-[var(--brand)] hover:bg-[var(--brand)]/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
