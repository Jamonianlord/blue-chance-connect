import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Ban,
  Flag,
  Send,
  SkipForward,
  Loader2,
  Paperclip,
  X,
  UserPlus,
  Clock,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { SignedImage, Avatar } from "@/components/SignedImage";

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

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

type ChatRow = {
  id: string;
  user1_id: string;
  user2_id: string;
  ended_at: string | null;
  ended_by: string | null;
  chat_type: "random" | "friend";
  created_at: string;
};

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

function formatDuration(startIso: string, endIso: string) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function ChatPage() {
  const { chatId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState<ChatRow | null>(null);
  const [partnerName, setPartnerName] = useState<string>("Stranger");
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendBusy, setFriendBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchFriendship = async (pId: string) => {
      const { data: f } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${pId}),and(requester_id.eq.${pId},addressee_id.eq.${user.id})`
        )
        .maybeSingle();
      if (cancelled) return;
      if (!f) {
        setFriendshipStatus("none");
        setFriendshipId(null);
        return;
      }
      setFriendshipId(f.id);
      if (f.status === "accepted") setFriendshipStatus("accepted");
      else if (f.status === "pending" && f.requester_id === user.id) setFriendshipStatus("pending_sent");
      else if (f.status === "pending" && f.addressee_id === user.id) setFriendshipStatus("pending_received");
      else setFriendshipStatus("none");
    };

    const fetchChatAndMessages = async () => {
      const { data: c } = await supabase.from("chats").select("*").eq("id", chatId).maybeSingle();
      if (cancelled) return;
      if (!c) {
        toast.error("Chat not found");
        navigate({ to: "/match" });
        return;
      }
      setChat(c as ChatRow);

      const { data: p } = await supabase.rpc("get_chat_partner", { _chat_id: chatId });
      const partner = Array.isArray(p) ? p[0] : p;
      if (!cancelled && partner) {
        if (partner.name) setPartnerName(partner.name);
        setPartnerAvatar(partner.avatar_url ?? null);
      }

      const cRow = c as ChatRow;
      const pId = cRow.user1_id === user.id ? cRow.user2_id : cRow.user1_id;
      setPartnerId(pId);
      if (cRow.chat_type === "random") await fetchFriendship(pId);

      const { data: msgs } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at");
      if (!cancelled) setMessages((msgs ?? []) as Message[]);
    };

    fetchChatAndMessages();

    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const subscribeChatChannel = () => {
      if (cancelled || !user) return;
      const newChannel = supabase
        .channel(`chat:${chatId}`, { config: { broadcast: { self: false } } })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
          (payload) => {
            const msg = payload.new as Message;
            setMessages((cur) => {
              if (cur.some((m) => m.id === msg.id)) return cur;
              return [...cur, msg];
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "chats", filter: `id=eq.${chatId}` },
          (payload) => {
            const updated = payload.new as ChatRow;
            setChat(updated);
            if (updated.ended_at && updated.ended_by !== user.id) {
              toast.info(
                updated.chat_type === "friend" ? "This friendship has ended." : "Your partner ended the chat."
              );
            }
          }
        )
        .on("broadcast", { event: "typing" }, (payload) => {
          if (payload.payload?.from !== user.id) {
            setPartnerTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 2000);
          }
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "CLOSED") {
            console.warn("[chat] channel closed/error, attempting reconnection...", status);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !cancelled) {
              reconnectAttempts++;
              const delay = Math.min(200 * Math.pow(2, reconnectAttempts - 1), 8000);
              reconnectTimer = setTimeout(() => {
                if (channelRef.current) supabase.removeChannel(channelRef.current);
                subscribeChatChannel();
              }, delay);
            }
          } else if (status === "SUBSCRIBED") {
            reconnectAttempts = 0;
          }
        });
      channelRef.current = newChannel;
    };

    subscribeChatChannel();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        fetchChatAndMessages();
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [chatId, user, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, partnerTyping]);

  const ended = !!chat?.ended_at;
  const isFriendChat = chat?.chat_type === "friend";

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
      image_url: null,
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
      supabase.from("analytics_events").insert({ user_id: user.id, event_type: "message_sent" });
    }
    setSending(false);
  };

  const sendImage = async (file: File) => {
    if (!user || uploading || ended) return;
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
      toast.error("Only JPG, PNG, GIF, or WEBP images.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setUploading(true);
    const tempId = crypto.randomUUID();
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${chatId}/${user.id}-${Date.now()}.${ext}`;
      setMessages((cur) => [
        ...cur,
        { id: tempId, chat_id: chatId, sender_id: user.id, content: null, image_url: null, created_at: new Date().toISOString() },
      ]);
      const { error: upErr } = await supabase.storage.from("chat-images").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("messages").insert({ chat_id: chatId, sender_id: user.id, image_url: path }).select().single();
      if (error) throw error;
      setMessages((cur) => cur.map((m) => (m.id === tempId ? (data as Message) : m)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      console.error("[chat] image upload", e);
      toast.error(msg);
      setMessages((cur) => cur.filter((m) => m.id !== tempId));
    } finally {
      setUploading(false);
    }
  };

  const onType = (v: string) => {
    setInput(v);
    if (channelRef.current && user) {
      channelRef.current.send({ type: "broadcast", event: "typing", payload: { from: user.id } });
    }
  };

  const endAndNext = async () => {
    await supabase.rpc("end_chat", { _chat_id: chatId });
  };

  const goBack = async () => {
    if (isFriendChat) {
      navigate({ to: "/chats" });
      return;
    }
    if (!ended) await supabase.rpc("end_chat", { _chat_id: chatId });
    navigate({ to: "/" });
  };

  const addFriend = async () => {
    if (!user || !partnerId || friendBusy) return;
    setFriendBusy(true);
    const { data, error } = await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: partnerId })
      .select()
      .single();
    setFriendBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setFriendshipId(data.id);
    setFriendshipStatus("pending_sent");
    toast.success("Friend request sent.");
  };

  const acceptFriendFromChat = async () => {
    if (!friendshipId || friendBusy) return;
    setFriendBusy(true);
    const { error } = await supabase.rpc("accept_friend_request", { p_request_id: friendshipId });
    setFriendBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setFriendshipStatus("accepted");
    toast.success("You're now friends!");
  };

  const blockPartner = async () => {
    if (!partnerId || !user) return;
    if (isFriendChat && friendshipId) {
      const { error: unfriendErr } = await supabase.rpc("unfriend", { p_friendship_id: friendshipId });
      if (unfriendErr) {
        toast.error(unfriendErr.message);
        return;
      }
    }
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: partnerId });
    if (!isFriendChat) await supabase.rpc("end_chat", { _chat_id: chatId });
    toast.success("User blocked.");
    navigate({ to: isFriendChat ? "/chats" : "/match" });
  };

  const reportPartner = async () => {
    if (!partnerId || !user) return;
    await supabase.from("reports").insert({ reporter_id: user.id, reported_id: partnerId, reason: reportReason || null });
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
      <header className="flex items-center justify-between border-b border-border bg-white px-3 py-2 sm:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar path={partnerAvatar} name={partnerName} size={36} />
          <div>
            <div className="text-sm font-semibold leading-tight">{partnerName}</div>
            <div className="text-xs text-muted-foreground">
              {ended ? (isFriendChat ? "Friendship ended" : "Chat ended") : partnerTyping ? "Typing…" : "Online"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Logo className="hidden sm:inline-flex" />

          {!isFriendChat && !ended && (
            <>
              {friendshipStatus === "none" && (
                <Button variant="ghost" size="sm" className="text-[var(--brand)]" disabled={friendBusy} onClick={addFriend}>
                  <UserPlus className="mr-1 h-4 w-4" /> Add friend
                </Button>
              )}
              {friendshipStatus === "pending_sent" && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
                  <Clock className="mr-1 h-4 w-4" /> Request sent
                </Button>
              )}
              {friendshipStatus === "pending_received" && (
                <Button size="sm" className="bg-[var(--brand)] text-white" disabled={friendBusy} onClick={acceptFriendFromChat}>
                  Accept request
                </Button>
              )}
              {friendshipStatus === "accepted" && (
                <span className="text-xs font-medium text-[var(--brand)]">Friends</span>
              )}
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Flag className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Report this user</AlertDialogTitle>
                <AlertDialogDescription>Tell us what happened. We review every report.</AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea placeholder="Reason (optional)" value={reportReason} onChange={(e) => setReportReason(e.target.value)} maxLength={500} />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={reportPartner} className="bg-destructive text-destructive-foreground">
                  Submit report
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Ban className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Block this user?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isFriendChat ? "They'll be removed as a friend and won't be matched with you again." : "You won't be matched with them again."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={blockPartner} className="bg-destructive text-destructive-foreground">
                  Block
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {!isFriendChat && (
            <Button size="sm" onClick={endAndNext} className="ml-1 rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
              <SkipForward className="mr-1 h-4 w-4" /> Next
            </Button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-2">
          {messages.length === 0 && (
            <div className="mx-auto mt-16 max-w-xs text-center text-sm text-muted-foreground">
              Say hi 👋 — you have one chance to make it a great chat.
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user!.id;
            const isImage = !!m.image_url;
            return (
              <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                <div
                  className={
                    "max-w-[75%] overflow-hidden rounded-2xl text-sm shadow-sm " +
                    (isImage ? "p-1 " : "px-4 py-2 ") +
                    (mine ? "bg-[var(--brand)] text-white rounded-br-sm" : "bg-white text-foreground border border-border rounded-bl-sm")
                  }
                >
                  {isImage ? (
                    m.image_url ? (
                      <SignedImage
                        bucket="chat-images"
                        path={m.image_url}
                        alt="Shared image"
                        className="block max-h-72 max-w-full cursor-pointer rounded-xl"
                        onClick={async () => {
                          const { data } = await supabase.storage.from("chat-images").createSignedUrl(m.image_url!, 3600);
                          if (data?.signedUrl) setLightbox(data.signedUrl);
                        }}
                      />
                    ) : (
                      <div className="flex h-40 w-40 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-white/80" />
                      </div>
                    )
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  )}
                  <div className={"px-2 pb-1 text-[10px] " + (isImage ? "pt-1 " : "mt-1 ") + (mine ? "text-white/70" : "text-muted-foreground")}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          {partnerTyping && !ended && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-border bg-white px-4 py-2">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.1s" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-white/90 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {ended ? (
            <div className="flex w-full flex-col items-center gap-2 py-2">
              {chat.created_at && chat.ended_at && (
                <div className="text-xs text-muted-foreground">
                  {isFriendChat ? "You chatted for " : "This chat lasted "}
                  {formatDuration(chat.created_at, chat.ended_at)}
                </div>
              )}
              <Button
                onClick={() => navigate({ to: isFriendChat ? "/chats" : "/match" })}
                className="brand-gradient rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
              >
                {isFriendChat ? "Back to Chats" : "Find a new match"}
              </Button>
            </div>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) sendImage(f);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                size="icon"
                variant="ghost"
                className="h-11 w-11 shrink-0 rounded-full text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                aria-label="Attach image"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
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

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
