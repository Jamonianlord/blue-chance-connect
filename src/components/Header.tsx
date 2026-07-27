import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, MessageCircle } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) { setPendingCount(0); return; }
    let cancelled = false;
    const load = async () => {
      const { count } = await (supabase as any)
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending");
      if (!cancelled) setPendingCount(count ?? 0);
    };
    load();
    const channel = (supabase as any)
      .channel(`friendships:${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `addressee_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

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
                  <span className="hidden sm:inline">Chats</span>
                  {pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white ring-2 ring-background">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/chats"><MessageCircle className="h-4 w-4" /> Chats</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile"><UserIcon className="h-4 w-4" /><span className="hidden sm:inline">Profile</span></Link>
              </Button>
              <Button
                variant="ghost" size="sm"
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              >
                <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="bg-[var(--brand)] hover:bg-[var(--brand)]/90">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

