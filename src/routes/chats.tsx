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
import { Loader2, Check, X, Ban, UserMinus, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/chats")({
  component: ChatsPage,
  head: () => ({
    meta: [
      { title: "Chats — 1Chance" },
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
};

type RequestRow = {
  friendship_id: string;
  requester_id: string;
  requester_name: string | null;
  requester_avatar_url: string | null;
  created_at: string;
};

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
    return () => window.removeEventListener("visibilitychange", handleVisibility);
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-4 text-xl font-bold">Chats</h1>

        {requests.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Friend requests
            </h2>
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r.friendship_id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3"
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
          <div className="mt-10 text-center text-sm text-muted-foreground">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            No friends yet. Add someone from an active chat to see them here.
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div
                key={f.friendship_id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3"
              >
                <Link
                  to="/chat/$chatId"
                  params={{ chatId: f.chat_id ?? "" }}
                  className="flex flex-1 items-center gap-3"
                >
                  <Avatar path={f.friend_avatar_url} name={f.friend_name ?? "?"} size={44} />
                  <div className="text-sm font-semibold">{f.friend_name ?? "Friend"}</div>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground">
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

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground">
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
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}