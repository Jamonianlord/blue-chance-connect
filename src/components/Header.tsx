import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentChatId = pathname.startsWith("/chat/") ? pathname.replace("/chat/", "") : null;

  useEffect(() => {
    if (!user) { 
      setPendingCount(0); 
      setUnreadCount(0); 
      document.title = "1Chance — Meet someone new, right now";
      return; 
    }

    const updateTitle = () => {
      if (document.hidden && unreadCount > 0) {
        document.title = `(${unreadCount}) 1Chance`;
      } else {
        document.title = "1Chance — Meet someone new, right now";
      }
    };

    updateTitle();
    document.addEventListener("visibilitychange", updateTitle);
    return () => document.removeEventListener("visibilitychange", updateTitle);
  }, [user, unreadCount]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending");
      if (!cancelled) setPendingCount(count ?? 0);
      
      const { data: friends, error: friendsError } = await supabase.rpc("get_my_friends");
      if (!friendsError && !cancelled && friends) {
        const totalUnread = friends.reduce((sum, f) => sum + (f.unread_count ?? 0), 0);
        setUnreadCount(totalUnread);
      }
    };
    load();
    
    const channel = supabase
      .channel(`header:${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `addressee_id=eq.${user.id}` },
        () => load())
      .on("postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `requester_id=eq.${user.id}` },
        () => load())
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload: any) => {
          const msg = payload.new as any;
          if (msg.sender_id === user.id) return;
          if (currentChatId && msg.chat_id === currentChatId) return;
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", msg.sender_id)
            .maybeSingle();
          const senderName = (profile as any)?.name ?? "Someone";
          const preview = msg.content?.slice(0, 60) ?? "";
          toast.info(`${senderName}: ${preview}`, {
            description: preview ? "" : "New message",
            action: {
              label: "View",
              onClick: (event) => {
                event.stopPropagation();
                navigate({ to: `/chat/$chatId`, params: { chatId: msg.chat_id } });
              }
            }
          });
        })
      .subscribe();
    
    return () => { 
      cancelled = true; 
      supabase.removeChannel(channel); 
    };
  }, [user, currentChatId, navigate]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="shrink-0"><Logo /></Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="relative">
                <Link to="/chats">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Friends</span>
                  {pendingCount + unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white ring-2 ring-background">
                      {pendingCount + unreadCount > 9 ? "9+" : pendingCount + unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/groups"><Users className="h-4 w-4" /><span className="hidden sm:inline">Groups</span></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile"><UserIcon className="h-4 w-4" /><span className="hidden sm:inline">Profile</span></Link>
              </Button>
              <ThemeToggle />
              <Button
                variant="ghost" size="sm"
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              >
                <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild size="sm" className="bg-[var(--brand)] hover:bg-[var(--brand)]/90">
                <Link to="/auth">Sign in</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


