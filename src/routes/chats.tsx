import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Avatar } from "@/components/SignedImage";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, MessageCircle, MoreVertical, UserMinus, Ban, Check, X, Users } from "lucide-react";

export const Route = createFileRoute("/chats")({
  component: ChatsPage,
  head: () => ({
    meta: [
      { title: "Your chats — 1Chance" },
      { name: "description", content: "Your friends and pending friend requests on 1Chance." },
      { property: "og:title", content: "Your chats — 1Chance" },
      { property: "og:description", content: "Your friends and pending friend requests on 1Chance." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Profile = { id: string; name: string; avatar_url: string | null };
type FriendRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  chat_id: string | null;
  created_at: string;
  other: Profile | null;
};

function ChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<FriendRow[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });
    if (error) { console.error(error); toast.error(error.message); setLoading(false); return; }
    const rows = (data ?? []) as FriendRow[];
    const otherIds = Array.from(new Set(rows.map(r => r.requester_id === user.id ? r.addressee_id : r.requester_id)));
    let profiles: Record<string, Profile> = {};
    if (otherIds.length) {
      const results = await Promise.all(otherIds.map(async (id) => {
        // profiles are self-only; use partner-through-chat, else fall back to name-less
        const row = rows.find(r => (r.requester_id === id || r.addressee_id === id) && r.chat_id);
        if (row?.chat_id) {
          const { data: p } = await supabase.rpc("get_chat_partner", { _chat_id: row.chat_id });
          const partner = Array.isArray(p) ? p[0] : p;
          if (partner) return { id, name: partner.name, avatar_url: partner.avatar_url } as Profile;
        }
        return { id, name: "1Chance user", avatar_url: null } as Profile;
      }));
      profiles = Object.fromEntries(results.map(p => [p.id, p]));
    }
    const withOther = rows.map(r => ({
      ...r,
      other: profiles[r.requester_id === user.id ? r.addressee_id : r.requester_id] ?? null,
    }));
    setPending(withOther.filter(r => r.status === "pending" && r.addressee_id === user.id));
    setFriends(withOther.filter(r => r.status === "accepted"));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const accept = async (id: string) => {
    const { data, error } = await (supabase as any).rpc("accept_friend_request", { p_request_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("You're now friends!");
    await load();
    if (data) navigate({ to: "/chat/$chatId", params: { chatId: data as string } });
  };

  const decline = async (id: string) => {
    const { error } = await (supabase as any).from("friendships").update({ status: "declined" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Request declined");
    load();
  };

  const unfriend = async (f: FriendRow) => {
    const { error } = await (supabase as any).rpc("unfriend", { p_friendship_id: f.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Removed from friends");
    load();
  };

  const blockFriend = async (f: FriendRow) => {
    if (!user || !f.other) return;
    const otherId = f.other.id;
    const { error: uErr } = await (supabase as any).rpc("unfriend", { p_friendship_id: f.id });
    if (uErr) { toast.error(uErr.message); return; }
    const { error: bErr } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: otherId });
    if (bErr) { toast.error(bErr.message); return; }
    toast.success("User blocked");
    load();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
            <p className="text-sm text-muted-foreground">Your friends and requests</p>
          </div>
        </div>

        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Friend requests ({pending.length})
            </h2>
            <div className="space-y-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
              {pending.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50">
                  <Avatar path={r.other?.avatar_url ?? null} name={r.other?.name ?? "?"} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.other?.name ?? "1Chance user"}</div>
                    <div className="text-xs text-muted-foreground">Wants to be your friend</div>
                  </div>
                  <Button size="sm" onClick={() => accept(r.id)} className="rounded-full bg-[var(--brand)] hover:bg-[var(--brand)]/90">
                    <Check className="mr-1 h-4 w-4" /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => decline(r.id)} className="rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Friends ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No friends yet. Add someone from a random chat!</p>
              <Button asChild className="mt-4 rounded-full bg-[var(--brand)] hover:bg-[var(--brand)]/90">
                <Link to="/match">Start matching</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                  {f.chat_id ? (
                    <Link
                      to="/chat/$chatId"
                      params={{ chatId: f.chat_id }}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <Avatar path={f.other?.avatar_url ?? null} name={f.other?.name ?? "?"} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{f.other?.name ?? "1Chance user"}</div>
                        <div className="truncate text-xs text-muted-foreground">Tap to open chat</div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar path={f.other?.avatar_url ?? null} name={f.other?.name ?? "?"} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{f.other?.name ?? "1Chance user"}</div>
                        <div className="truncate text-xs text-muted-foreground">Chat unavailable</div>
                      </div>
                    </div>
                  )}
                  <FriendMenu onUnfriend={() => unfriend(f)} onBlock={() => blockFriend(f)} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FriendMenu({ onUnfriend, onBlock }: { onUnfriend: () => void; onBlock: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <UserMinus className="mr-2 h-4 w-4" /> Unfriend
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove friend?</AlertDialogTitle>
              <AlertDialogDescription>Your chat with them will be ended.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onUnfriend} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Unfriend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
              <Ban className="mr-2 h-4 w-4" /> Block
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block this user?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll unfriend them and never be matched again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Block
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
