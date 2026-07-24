import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="shrink-0"><Logo /></Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile"><UserIcon className="h-4 w-4" /> Profile</Link>
              </Button>
              <Button
                variant="ghost" size="sm"
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              >
                <LogOut className="h-4 w-4" /> Sign out
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
