import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, MessageCircle, Users, Heart } from "lucide-react";
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `addressee_id=eq.${user.id}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `requester_id=eq.${user.id}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
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
              },
            },
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, currentChatId, navigate]);

  const badgeCount = pendingCount + unreadCount;

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (user) document.body.classList.add("has-tabbar");
    else document.body.classList.remove("has-tabbar");
    return () => document.body.classList.remove("has-tabbar");
  }, [user]);

  const navLinks = [
    { to: "/chats", label: "Friends", icon: MessageCircle, badge: true },
    { to: "/meet", label: "Meet", icon: Heart, badge: false },
    { to: "/groups", label: "Groups", icon: Users, badge: false },
    { to: "/profile", label: "Profile", icon: UserIcon, badge: false },
  ] as const;

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-blue-500/10 bg-background/60 shadow-[0_1px_0_0_rgba(59,130,246,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <div className="hidden items-center gap-1 md:flex md:gap-2">
                  {navLinks.map(({ to, label, icon: Icon, badge }) => (
                    <Button
                      key={to}
                      asChild
                      variant="ghost"
                      size="sm"
                      className={`relative text-sm font-medium transition-all duration-200 ease-out hover:text-[var(--brand)] ${
                        isActive(to) ? "nav-active-underline text-[var(--brand)]" : ""
                      }`}
                    >
                      <Link to={to}>
                        <Icon className="h-4 w-4" width={16} height={16} />
                        <span>{label}</span>
                        {badge && badgeCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white ring-2 ring-background">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    </Button>
                  ))}
                </div>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  className="transition-all duration-200 ease-out hover:text-[var(--brand)]"
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" width={16} height={16} />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button asChild size="sm" className="bg-[var(--brand)] transition-all duration-200 ease-out hover:bg-[var(--brand)]/90">
                  <Link to="/auth">Sign in</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {user && (
        <nav className="tabbar fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/80 backdrop-blur-xl md:hidden">
          <ul className="mx-auto grid max-w-md grid-cols-4">
            {navLinks.map(({ to, label, icon: Icon, badge }) => {
              const active = isActive(to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`relative flex flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-medium transition-all duration-200 ease-out ${
                      active ? "text-[var(--brand)]" : "text-muted-foreground"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute top-1 h-1 w-1 rounded-full bg-[var(--brand)] shadow-[0_0_8px_var(--brand)]"
                      />
                    )}
                    <span className="relative mt-1.5">
                      <Icon className="h-5 w-5" width={20} height={20} />
                      {badge && badgeCount > 0 && (
                        <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[9px] font-bold text-white ring-2 ring-background">
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
                      )}
                    </span>
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}

