import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ArrowRight, MessageCircle, Shuffle, ShieldCheck, Sparkles, UserPlus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "1Chance — Meet someone new, right now" },
      { name: "description", content: "Random 1-on-1 chat with people online right now. Sign up in seconds and get matched with a stranger." },
      { property: "og:title", content: "1Chance — Meet someone new, right now" },
      { property: "og:description", content: "Random 1-on-1 chat with people online right now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
          {/* soft floating blobs — same blue family, GPU-cheap */}
          <div
            aria-hidden
            className="animate-drift pointer-events-none absolute -left-20 top-24 -z-10 h-64 w-64 rounded-full blur-3xl"
            style={{ background: "color-mix(in oklab, var(--brand) 18%, transparent)" }}
          />
          <div
            aria-hidden
            className="animate-drift pointer-events-none absolute -right-16 top-4 -z-10 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "color-mix(in oklab, var(--brand) 12%, transparent)", animationDelay: "-6s" }}
          />
          <div className="mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:pt-28">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
              Meet a stranger in seconds
            </div>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              One click.<br />
              One match.<br />
              <span className="bg-clip-text text-transparent brand-gradient">One chance.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              1Chance connects you at random with someone new for a 1-on-1 chat.
              No feeds, no profiles to swipe — just a real conversation, right now.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={start}
                className="brand-gradient brand-glow h-12 w-full rounded-full px-8 text-base font-semibold text-white hover:opacity-95 sm:w-auto"
              >
                Start chatting <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              {!user && (
                <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-full px-6 text-base sm:w-auto">
                  <Link to="/auth">Sign up — it's free</Link>
                </Button>
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">18+ only · No downloads · Free forever</p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-4 pb-4">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Three steps, about thirty seconds.</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: UserPlus, step: "1", title: "Sign up", body: "Name, age and gender. That's the whole form." },
              { icon: Shuffle, step: "2", title: "Get matched", body: "We pair you with someone online right now." },
              { icon: MessageCircle, step: "3", title: "Start chatting", body: "Say hi. Not clicking? Tap Next for a new match." },
            ].map(({ icon: Icon, step, title, body }) => (
              <li
                key={step}
                className="relative rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="absolute right-5 top-4 text-4xl font-extrabold text-[var(--brand-soft)]">{step}</span>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Shuffle, title: "Truly random", body: "Every match is a fresh face from users online right now." },
              { icon: MessageCircle, title: "Real-time chat", body: "Text and images with typing indicators — like talking in person." },
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

        {/* CTA band */}
        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="brand-gradient brand-glow rounded-3xl px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Someone's waiting to talk.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/80">One click is all it takes to meet them.</p>
            <Button
              size="lg"
              onClick={start}
              className="mt-6 h-12 rounded-full bg-white px-8 text-base font-semibold text-[var(--brand)] hover:bg-white/90"
            >
              Start chatting <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          <div className="mb-3 flex justify-center gap-5">
            <Link to="/support" className="story-link hover:text-foreground">Support &amp; FAQ</Link>
            <Link to="/auth" className="story-link hover:text-foreground">Sign in</Link>
          </div>
          © {new Date().getFullYear()} 1Chance. Be kind.
        </footer>
      </main>
    </div>
  );
}
