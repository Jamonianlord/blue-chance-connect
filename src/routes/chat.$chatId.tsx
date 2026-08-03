import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  Mic,
  MicOff,
  Play,
  Pause,
  Gamepad2,
} from "lucide-react";
import { GamePicker } from "@/components/chat-games/GamePicker";
import { GameCard } from "@/components/chat-games/GameCard";
import type { GameType } from "@/components/chat-games/types";
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
  audio_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  message_type: "text" | "game";
  game_id: string | null;
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

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function msgIsFromMe(msg: Message, userId: string | null): boolean {
  return msg.sender_id === userId;
}

function encodeToWav(chunks: Float32Array[], sampleRate: number): Blob {
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const buffer = new ArrayBuffer(44 + totalLength * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalLength * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalLength * 2, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]!));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function AudioPlayer({ audioUrl, durationSeconds, mine }: { audioUrl: string; durationSeconds: number; mine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchSignedUrl = async () => {
      try {
        const { data } = await supabase.storage.from("chat-audio").createSignedUrl(audioUrl, 3600);
        if (!cancelled && data?.signedUrl) {
          setAudioSrc(data.signedUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSignedUrl();
    return () => { cancelled = true; };
  }, [audioUrl]);

  useEffect(() => {
    if (playing && audioRef.current) {
      audioRef.current.play().catch(() => setPlaying(false));
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [playing]);

  const togglePlay = () => {
    if (loading || !audioSrc) return;
    setPlaying((p) => !p);
  };

  const handleEnded = () => setPlaying(false);

   return (
    <div className="flex items-center gap-2 px-1">
      <audio ref={audioRef} onEnded={handleEnded}>
        <source src={audioSrc} type="audio/wav" />
      </audio>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white/90"
        onClick={togglePlay}
        disabled={loading}
        aria-label={playing ? "Pause" : "Play"}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <span className="text-xs text-white/70 min-w-[50px]">{formatTime(durationSeconds)}</span>
    </div>
  );
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
  const [ending, setEnding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sharedInterests, setSharedInterests] = useState<string[]>([]);
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(null);
  const [gameStates, setGameStates] = useState<Record<string, Record<string, unknown>>>({});
  const [showGamePicker, setShowGamePicker] = useState(false);
  const gamePickerRef = useRef<HTMLDivElement>(null);
  const partnerOnline = partnerLastSeen ? new Date(partnerLastSeen).getTime() >= Date.now() - 90_000 : false;
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isRecordingRef = useRef(false);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartRef = useRef<number>(0);
  const presenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setChat(c as any);
      supabase.rpc("mark_chat_read", { _chat_id: chatId });

      const { data: p } = await supabase.rpc("get_chat_partner", { _chat_id: chatId });
      const partner: any = Array.isArray(p) ? p[0] : p;
      if (!cancelled && partner) {
        if (partner.name) setPartnerName(partner.name);
        setPartnerAvatar(partner.avatar_url ?? null);
        setPartnerLastSeen(partner.last_seen ?? null);
      }

      const cRow = c as ChatRow;
      const pId = cRow.user1_id === user.id ? cRow.user2_id : cRow.user1_id;
      setPartnerId(pId);
      if (cRow.chat_type === "random") await fetchFriendship(pId);

      const { data: msgs } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at");
      if (!cancelled) setMessages((msgs ?? []) as any[] as Message[]);

      const { data: games } = await supabase.from("chat_games").select("*").eq("chat_id", chatId);
      if (!cancelled && games) {
        const map: Record<string, Record<string, unknown>> = {};
        for (const g of games as any[]) {
          map[g.id] = { ...g.state, game_type: g.game_type };
        }
        setGameStates(map);
      }
      
      // Mark chat as read when it loads
      if (!cancelled) await supabase.rpc("mark_chat_read", { _chat_id: chatId });
      
      // Fetch shared interests
      if (!cancelled && user && pId && partner) {
        const { data: userProfile } = await supabase.from("profiles").select("interests").eq("id", user.id).single();
        if (userProfile && !cancelled) {
          const userInterests = (userProfile as any).interests || [];
          const partnerInterests = partner.interests || [];
          const shared = userInterests.filter((interest: string) => partnerInterests.includes(interest));
          setSharedInterests(shared);
        }
      }
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
              
              if (!cancelled && !msgIsFromMe(msg, user?.id)) {
                supabase.rpc("mark_chat_read", { _chat_id: chatId }).then(() => {}, console.error);
              }
            }
          )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_games", filter: `chat_id=eq.${chatId}` },
          (payload) => {
            const game = payload.new as { id: string; state: Record<string, unknown> };
            if (!cancelled) {
              setGameStates((cur) => ({ ...cur, [game.id]: game.state }));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "chat_games", filter: `chat_id=eq.${chatId}` },
          (payload) => {
            const game = payload.new as { id: string; state: Record<string, unknown> };
            if (!cancelled) {
              setGameStates((cur) => ({ ...cur, [game.id]: game.state }));
            }
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
      if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [chatId, user, navigate]);

  useEffect(() => {
    if (!partnerId) return;
    const id = setInterval(async () => {
      const { data } = await supabase.from("profiles").select("last_seen").eq("id", partnerId).single();
      if (data) setPartnerLastSeen((data as any).last_seen ?? null);
    }, 15_000);
    return () => clearInterval(id);
  }, [partnerId]);

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
      audio_url: null,
      duration_seconds: null,
      created_at: new Date().toISOString(),
      message_type: "text",
      game_id: null,
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
      (supabase as any).from("analytics_events").insert({ user_id: user.id, event_type: "message_sent" });
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
        { id: tempId, chat_id: chatId, sender_id: user.id, content: null, image_url: null, audio_url: null, duration_seconds: null, created_at: new Date().toISOString(), message_type: "text", game_id: null },
      ]);
      const { error: upErr } = await supabase.storage.from("chat-images").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("messages").insert({ chat_id: chatId, sender_id: user.id, image_url: path }).select().single();
      if (error) throw error;
      setMessages((cur) => cur.map((m) => (m.id === tempId ? (data as Message) : m)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
      setMessages((cur) => cur.filter((m) => m.id !== tempId));
} finally {
      setUploading(false);
    }
  };

  const stopRecordingAndUpload = async () => {
    if (!user || !streamRef.current || !audioContextRef.current) return;

    const stream = streamRef.current;
    const audioContext = audioContextRef.current;
    const source = sourceNodeRef.current;
    const sampleRate = audioContext.sampleRate;

    setRecording(false);
    isRecordingRef.current = false;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    source?.disconnect();
    sourceNodeRef.current = null;

    audioContext.close().catch(() => {});
    audioContextRef.current = null;

    stream.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const durationMs = Date.now() - recordingStartRef.current;
    const durationSeconds = Math.round(durationMs / 1000);

    if (pcmChunksRef.current.length === 0) {
      setRecordingTime(0);
      return;
    }

    const chunks = pcmChunksRef.current;
    pcmChunksRef.current = [];
    const tempId = crypto.randomUUID();

    try {
      const wavBlob = encodeToWav(chunks, sampleRate);

      if (wavBlob.size === 0) {
        toast.error("Recording failed — try again");
        setRecordingTime(0);
        return;
      }

      setUploading(true);
      setMessages((cur) => [
        ...cur,
        { id: tempId, chat_id: chatId, sender_id: user.id, content: null, image_url: null, audio_url: null, duration_seconds: null, created_at: new Date().toISOString(), message_type: "text", game_id: null },
      ]);

      const path = `${chatId}/${user.id}-${Date.now()}.wav`;
      const { error: upErr } = await supabase.storage.from("chat-audio").upload(path, wavBlob, { contentType: "audio/wav" });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from("messages")
        .insert({ chat_id: chatId, sender_id: user.id, audio_url: path, duration_seconds: durationSeconds })
        .select()
        .single();
      if (error) throw error;

      setMessages((cur) => cur.map((m) => (m.id === tempId ? (data as Message) : m)));
    } catch (e) {
      console.error("[chat] audio record/encode/upload error", e);
      const msg = e instanceof Error ? e.message : "Failed to send voice note";
      toast.error(msg);
      setMessages((cur) => cur.filter((m) => m.id !== tempId));
    } finally {
      setUploading(false);
      setRecording(false);
      setRecordingTime(0);
    }
  };

  const toggleRecording = async () => {
    if (!user || ended) return;

    if (recording) {
      await stopRecordingAndUpload();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 44100 });
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      pcmChunksRef.current = [];
      recordingStartRef.current = Date.now();

      const bufferSize = 4096;
      const channelCount = source.channelCount || 1;
      const recorder = audioContext.createScriptProcessor(bufferSize, channelCount, channelCount);

      isRecordingRef.current = true;

      recorder.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        for (let ch = 0; ch < channelCount; ch++) {
          const input = e.inputBuffer.getChannelData(ch);
          pcmChunksRef.current.push(new Float32Array(input));
        }
      };

      source.connect(recorder);
      recorder.connect(audioContext.destination);

      setRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (e) {
      toast.error("Could not access microphone");
      console.error(e);
      setRecording(false);
    }
  };

  const onType = (v: string) => {
    setInput(v);
    if (channelRef.current && user) {
      channelRef.current.send({ type: "broadcast", event: "typing", payload: { from: user.id } });
    }
  };

  const endAndNext = async () => {
    if (ended || ending) return;
    setEnding(true);
    try {
      const { error } = await supabase.rpc("end_chat", { _chat_id: chatId });
      if (error) {
        console.error("[chat] end_chat error", error);
        toast.error("Could not end chat. Please try again.");
      } else {
        setChat((cur) =>
          cur ? { ...cur, ended_at: new Date().toISOString(), ended_by: user!.id } : cur,
        );
      }
    } catch (err) {
      console.error("[chat] end_chat unexpected", err);
      toast.error("Something went wrong.");
    } finally {
      setEnding(false);
    }
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
    const { data, error } = await (supabase as any).rpc("send_friend_request", { p_addressee_id: partnerId });
    setFriendBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data && data[0]) {
      setFriendshipId(data[0].id);
      setFriendshipStatus("pending_sent");
      toast.success("Friend request sent.");
    }
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

  const createGame = async (gameType: GameType) => {
    if (!user || ended) return;
    setShowGamePicker(false);
    const initialState: Record<string, unknown> = { game_type: gameType };
    if (gameType === "tic_tac_toe") {
      initialState.board = Array(9).fill(null);
      initialState.turn = user.id;
      initialState.created_by = user.id;
      initialState.opponent_id = partnerId!;
      initialState.status = "active";
      initialState.winner = null;
    }
    const { data: game, error: gameErr } = await supabase
      .from("chat_games")
      .insert({ chat_id: chatId, game_type: gameType, created_by: user.id, status: "active", state: initialState as Json })
      .select()
      .single();
    if (gameErr || !game) {
      toast.error(gameErr?.message || "Failed to start game");
      return;
    }
    const { error: msgErr } = await supabase
      .from("messages")
      .insert({ chat_id: chatId, sender_id: user.id, content: `started a ${gameType.replace("_", " ")} game`, message_type: "game", game_id: game.id });
    if (msgErr) {
      toast.error("Game created but message failed");
    }
    setGameStates((cur) => ({ ...cur, [game.id]: initialState }));
  };

  const updateGameState = async (gameId: string, newState: Record<string, unknown>) => {
    setGameStates((cur) => ({ ...cur, [gameId]: newState }));
    await supabase.from("chat_games").update({ state: newState as Json, updated_at: new Date().toISOString() }).eq("id", gameId);
  };

  if (authLoading || !chat) {
    return (
      <div className="flex h-[100dvh] flex-col bg-[var(--brand-soft)]/30">
        <header className="flex items-center gap-3 border-b border-border bg-card px-3 py-2 sm:px-6">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </header>
        <div className="flex-1 space-y-3 overflow-hidden px-3 py-4 sm:px-6">
          {[64, 40, 72, 48, 56].map((w, i) => (
            <div key={i} className={i % 2 === 0 ? "flex justify-start" : "flex justify-end"}>
              <Skeleton className="h-10 rounded-2xl" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-card px-3 py-3 sm:px-6">
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--brand-soft)]/30">
      <header className="flex items-center justify-between border-b border-border bg-card px-3 py-2 sm:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar path={partnerAvatar} name={partnerName} size={36} online={partnerOnline && !ended} />
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
            <Button size="sm" onClick={endAndNext} disabled={ending} className="ml-1 rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
              {ending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <SkipForward className="mr-1 h-4 w-4" />}
              {ending ? "Ending..." : "Next"}
            </Button>
          )}
        </div>
      </header>

      {messages.length === 0 && sharedInterests.length > 0 && (
        <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 mb-4">
          <div className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
            <span className="text-muted-foreground">You're both into </span>
            <span className="font-medium text-foreground">
              {sharedInterests.slice(0, -1).join(', ')}{sharedInterests.length > 1 ? ' and ' : ''}{sharedInterests[sharedInterests.length - 1]}
            </span>
          </div>
        </div>
      )}

      {messages.length === 0 && sharedInterests.length === 0 && (
        <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 mb-4">
          <div className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground text-center">
            Say hi and find out what you have in common!
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.length === 0 && (
            <div className="mx-auto mt-16 max-w-xs text-center text-sm text-muted-foreground">
              Say hi 👋 — you have one chance to make it a great chat.
            </div>
          )}
{messages.map((m, i) => {
            const mine = m.sender_id === user!.id;
            const isImage = !!m.image_url;
            const isAudio = !!m.audio_url;
            const prev = messages[i - 1];
            const grouped = prev && prev.sender_id === m.sender_id;
            return (
              <div
                key={m.id}
                className={"flex animate-fade-in " + (mine ? "justify-end" : "justify-start") + (grouped ? " -mt-1.5" : "")}
              >
                <div
                  className={
                    "max-w-[78%] overflow-hidden text-[15px] leading-relaxed shadow-sm transition-colors " +
                    (isImage ? "p-1 " : "px-4 py-2.5 ") +
                    (mine
                      ? "rounded-3xl rounded-br-md bg-[var(--brand)] text-white"
                      : "rounded-3xl rounded-bl-md border border-border bg-card text-card-foreground")
                  }
                >
                  {isImage ? (
                    m.image_url ? (
                      <SignedImage
                        bucket="chat-images"
                        path={m.image_url}
                        alt="Shared image"
                        className="block max-h-72 max-w-full cursor-pointer rounded-2xl"
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
                  ) : isAudio ? (
                    <AudioPlayer
                      audioUrl={m.audio_url!}
                      durationSeconds={m.duration_seconds ?? 0}
                      mine={mine}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  )}
                  {m.message_type === "game" && m.game_id && gameStates[m.game_id] && (
                    <div className="mt-2">
                      <GameCard
                        gameType={(gameStates[m.game_id]?.game_type as GameType) || "dice"}
                        state={gameStates[m.game_id]}
                        currentUserId={user!.id}
                        onMove={(newState) => updateGameState(m.game_id!, newState)}
                      />
                    </div>
                  )}
                  <div
                    className={
                      "text-[10px] font-normal tabular-nums " +
                      (isImage || isAudio ? "px-2 pb-1 pt-1 " : "mt-0.5 ") +
                      (mine ? "text-right text-white/60" : "text-right text-muted-foreground/70")
                    }
                  >
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          {partnerTyping && !ended && (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-bl-md border border-border bg-card px-4 py-3">
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

      <div className="border-t border-border bg-card/85 px-3 py-3 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-2xl items-center gap-1.5 rounded-full border border-border bg-muted/40 px-1.5 py-1.5 transition-colors focus-within:border-[var(--brand)]/50 focus-within:bg-muted/60">

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
                className="h-10 w-10 shrink-0 rounded-full text-[var(--brand)] transition-transform hover:bg-[var(--brand-soft)] active:scale-95"
                aria-label="Attach image"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  onClick={() => setShowGamePicker((o) => !o)}
                  disabled={uploading || ended}
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 shrink-0 rounded-full text-[var(--brand)] transition-transform hover:bg-[var(--brand-soft)] active:scale-95"
                  aria-label="Open games"
                >
                  <Gamepad2 className="h-4 w-4" />
                </Button>
                <GamePicker open={showGamePicker} onOpenChange={setShowGamePicker} onSelect={createGame} />
              </div>
              <Button
                type="button"
                onClick={toggleRecording}
                disabled={uploading || ended}
                size="icon"
                variant={recording ? "default" : "ghost"}
                className={`h-10 w-10 shrink-0 rounded-full transition-transform active:scale-95 ${recording ? "animate-pulse bg-[var(--brand)] text-white" : "text-[var(--brand)] hover:bg-[var(--brand-soft)]"}`}
                aria-label={recording ? "Stop recording" : "Record voice message"}
              >
                {recording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              {recording && (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2 py-1 text-xs font-medium text-[var(--brand)]">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" />
                  {recordingTime}s
                </div>
              )}
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
                className="h-10 flex-1 rounded-full border-0 bg-transparent px-3 text-[15px] shadow-none focus-visible:ring-0"
                maxLength={2000}
              />
              <Button
                onClick={send}
                disabled={sending || !input.trim()}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full bg-[var(--brand)] transition-all hover:bg-[var(--brand)]/90 hover:scale-105 active:scale-95 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-card/10 p-2 text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
