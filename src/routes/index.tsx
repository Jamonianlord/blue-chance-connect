import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ArrowRight, MessageCircle, Shuffle, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "1Chance — Meet someone new, right now" },
      { name: "description", content: "Random 1-on-1 chat with people online right now. Sign up in seconds and get matched with a stranger." },
      { property: "og:title", content: "1Chance — Meet someone new, right now" },
      { property: "og:description", content: "Random 1-on-1 chat with people online right now." },
    ],
  }),
});

function Landing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const start = () => {
    if (user && profile) navigate({ to: "/match" });
    else navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--brand) 22%, transparent) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:pt-28">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
              Meet a stranger in seconds
            </div>
            <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              One click.<br />
              One match.<br />
              <span className="bg-clip-text text-transparent brand-gradient">One chance.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              1Chance connects you at random with someone new for a 1-on-1 chat.
              No feeds, no profiles to swipe — just a real conversation, right now.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={start}
                className="brand-gradient brand-glow h-12 rounded-full px-8 text-base font-semibold text-white hover:opacity-95"
              >
                Start chatting <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              {!user && (
                <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-6 text-base">
                  <Link to="/auth">I already have an account</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Shuffle, title: "Truly random", body: "Every match is a fresh face from users online right now." },
              { icon: MessageCircle, title: "Real-time chat", body: "Text with typing indicators — feels like talking in person." },
              { icon: ShieldCheck, title: "Safe by design", body: "Report or block anyone, anytime, in one tap." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} 1Chance. Be kind.
        </footer>
      </main>
    </div>
  );
}
