import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/SignedImage";
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
import { toast } from "sonner";
import { Loader2, Check, X, Ban, UserMinus, UserPlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/chats")({
  component: ChatsPage,
  head: () => ({
    meta: [
      { title: "Friends — 1Chance" },
      { name: "description", content: "Your friends on 1Chance." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type FriendRow = {
  friendship_id: string;
  chat_id: string | null;
  friend_id: string;
  friend_name: string | null;
  friend_avatar_url: string | null;
  created_at: string;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  last_message_kind: string | null;
  last_message_text: string | null;
  unread_count: number;
};

type RequestRow = {
  friendship_id: string;
  requester_id: string;
  requester_name: string | null;
  requester_avatar_url: string | null;
  created_at: string;
};

function formatStamp(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (now.getTime() - d.getTime() < 7 * 864e5) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function previewText(f: FriendRow, meId: string | undefined) {
  if (!f.last_message_at) return "Say hi 👋";
  const body =
    f.last_message_kind === "image"
      ? "📷 Photo"
      : f.last_message_kind === "audio"
        ? "🎤 Voice message"
        : (f.last_message_text ?? "");
  const mine = meId && f.last_message_sender_id === meId;
  return mine ? `You: ${body}` : body;
}

function ChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: f, error: fErr }, { data: r, error: rErr }] = await Promise.all([
      (supabase as any).rpc("get_my_friends"),
      (supabase as any).rpc("get_pending_friend_requests"),
    ]);
    if (fErr) toast.error(fErr.message);
    if (rErr) toast.error(rErr.message);
    setFriends((f ?? []) as FriendRow[]);
    setRequests((r ?? []) as RequestRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("visibilitychange", handleVisibility);

    const channel = (supabase as any)
      .channel(`chats-page:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const acceptRequest = async (friendshipId: string) => {
    setBusyId(friendshipId);
    const { data: chatId, error } = await (supabase as any).rpc("accept_friend_request", {
      p_request_id: friendshipId,
    });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Friend added!");
    await load();
    if (chatId) navigate({ to: "/chat/$chatId", params: { chatId: chatId as string } });
  };

  const declineRequest = async (friendshipId: string) => {
    setBusyId(friendshipId);
    const { error } = await (supabase as any)
      .from("friendships")
      .update({ status: "declined" })
      .eq("id", friendshipId);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    await load();
  };

  const unfriend = async (friendshipId: string) => {
    setBusyId(friendshipId);
    const { error } = await (supabase as any).rpc("unfriend", { p_friendship_id: friendshipId });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Removed friend.");
    await load();
  };

  const blockFriend = async (friendshipId: string, friendId: string) => {
    setBusyId(friendshipId);
    const { error: unfriendErr } = await (supabase as any).rpc("unfriend", {
      p_friendship_id: friendshipId,
    });
    if (unfriendErr) {
      setBusyId(null);
      toast.error(unfriendErr.message);
      return;
    }
    const { error: blockErr } = await (supabase as any)
      .from("blocks")
      .insert({ blocker_id: user!.id, blocked_id: friendId });
    setBusyId(null);
    if (blockErr) {
      toast.error(blockErr.message);
      return;
    }
    toast.success("Blocked.");
    await load();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-8">
          <Skeleton className="mb-4 h-6 w-28" />
          <Skeleton className="mb-3 h-4 w-20" />
          <div className="-mx-4 divide-y divide-border/50 border-y border-border/50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-8">
         <h1 className="mb-4 text-xl font-bold">Friends</h1>

        {requests.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Friend requests
            </h2>
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r.friendship_id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <Avatar path={r.requester_avatar_url} name={r.requester_name ?? "?"} size={40} />
                  <div className="flex-1 text-sm font-medium">{r.requester_name ?? "Someone"}</div>
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded-full bg-[var(--brand)] hover:bg-[var(--brand)]/90"
                    disabled={busyId === r.friendship_id}
                    onClick={() => acceptRequest(r.friendship_id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-muted-foreground"
                    disabled={busyId === r.friendship_id}
                    onClick={() => declineRequest(r.friendship_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Friends</h2>
        {friends.length === 0 ? (
          <div className="card-hover-glow mt-4 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-soft)]">
              <UserPlus className="h-6 w-6 text-[var(--brand)]" />
            </span>
            <p className="text-sm font-semibold text-foreground">No friends yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Start a chat and add someone you vibe with — they'll show up here.
            </p>
            <Button
              className="brand-gradient btn-pop mt-4 rounded-full px-6 text-white"
              onClick={() => navigate({ to: "/match" })}
            >
              Start chatting
            </Button>
          </div>
        ) : (
          <div className="-mx-4 divide-y divide-border/50 border-y border-border/50">
            {friends.map((f) => {
              const unread = f.unread_count > 0;
              return (
                <div key={f.friendship_id} className="group relative">
                  <Link
                    to="/chat/$chatId"
                    params={{ chatId: f.chat_id ?? "" }}
                    className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--brand-soft)]/40 active:bg-[var(--brand-soft)]/60"
                  >
                    <Avatar path={f.friend_avatar_url} name={f.friend_name ?? "?"} size={48} />
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          "truncate text-[15px] leading-tight " +
                          (unread ? "font-bold text-foreground" : "font-semibold text-foreground")
                        }
                      >
                        {f.friend_name ?? "Friend"}
                      </div>
                      <div
                        className={
                          "mt-0.5 truncate text-sm " +
                          (unread ? "font-semibold text-foreground" : "text-muted-foreground")
                        }
                      >
                        {previewText(f, user?.id)}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 pl-2">
                      <span
                        className={
                          "text-[11px] " + (unread ? "font-semibold text-[var(--brand)]" : "text-muted-foreground")
                        }
                      >
                        {formatStamp(f.last_message_at ?? f.created_at)}
                      </span>
                      {unread ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-[11px] font-semibold leading-none text-white">
                          {f.unread_count > 99 ? "99+" : f.unread_count}
                        </span>
                      ) : (
                        <span className="h-5" />
                      )}
                    </div>
                  </Link>

                  <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-card/95 px-1 opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove friend?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You'll no longer be able to chat with {f.friend_name ?? "this person"} here.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => unfriend(f.friendship_id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent side="top">Unfriend</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Block {f.friend_name ?? "this person"}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They'll be removed as a friend and won't be matched with you again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => blockFriend(f.friendship_id, f.friend_id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Block
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent side="top">Block</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>

        )}
      </main>
    </div>
  );
}