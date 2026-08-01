import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Heart, MessageCircle, ShieldCheck, Shuffle, Sparkles, Star, UserPlus, Zap } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "1Chance — Meet someone new, right now" },
      { name: "description", content: "Random 1-on-1 chat with people online right now. Sign up in seconds and get matched with a stranger." },
      { property: "og:title", content: "1Chance — Meet someone new, right now" },
      { property: "og:description", content: "Random 1-on-1 chat with people online right now." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function useReveal<T extends HTMLElement = HTMLDivElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-revealed");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Landing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const start = () => {
    if (user && profile) navigate({ to: "/match" });
    else navigate({ to: "/auth" });
  };

  const heroRef = useReveal<HTMLDivElement>();
  const stepsRef = useReveal<HTMLDivElement>();
  const featuresRef = useReveal<HTMLDivElement>();
  const safetyRef = useReveal<HTMLDivElement>();
  const ctaRef = useReveal<HTMLDivElement>();

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
          {/* soft floating blobs */}
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
          {/* tiny drifting dots */}
          <div
            aria-hidden
            className="animate-float-slow pointer-events-none absolute left-[15%] top-[20%] -z-10 h-3 w-3 rounded-full bg-[var(--brand)] opacity-40"
            style={{ animationDelay: "0s" }}
          />
          <div
            aria-hidden
            className="animate-float-slow pointer-events-none absolute right-[18%] top-[34%] -z-10 h-2 w-2 rounded-full bg-[var(--brand)] opacity-30"
            style={{ animationDelay: "-3s" }}
          />
          <div
            aria-hidden
            className="animate-float-slow pointer-events-none absolute left-[22%] bottom-[22%] -z-10 h-2.5 w-2.5 rounded-full bg-[var(--brand-soft)] opacity-60"
            style={{ animationDelay: "-6s" }}
          />
          <div
            aria-hidden
            className="animate-pulse-soft pointer-events-none absolute right-[24%] bottom-[30%] -z-10 h-2 w-2 rounded-full bg-[var(--brand)] opacity-30"
            style={{ animationDelay: "-2s" }}
          />

          <div
            className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-16 sm:pt-24 lg:grid-cols-2 lg:gap-8"
            ref={heroRef}
          >
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
                Meet a stranger in seconds
              </div>

              <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                <span className="animate-line-reveal inline-block" style={{ animationDelay: "0.05s" }}>
                  One click.
                </span>
                <br />
                <span className="animate-line-reveal inline-block" style={{ animationDelay: "0.2s" }}>
                  One match.
                </span>
                <br />
                <span
                  className="animate-line-reveal inline-block bg-clip-text text-transparent brand-gradient"
                  style={{ animationDelay: "0.35s" }}
                >
                  One chance.
                </span>
              </h1>
              <p
                className="mx-auto mt-6 max-w-xl animate-fade-in-up text-base text-muted-foreground sm:text-lg lg:mx-0"
                style={{ animationDelay: "0.5s" }}
              >
                1Chance connects you at random with someone new for a 1-on-1 chat.
                No feeds, no profiles to swipe — just a real conversation, right now.
              </p>

              {/* Live-feeling stat */}
              <div
                className="mt-6 flex animate-fade-in-up items-center justify-center gap-2 text-sm text-muted-foreground lg:justify-start"
                style={{ animationDelay: "0.58s" }}
              >
                <span className="relative flex h-2.5 w-2.5" aria-hidden>
                  <span className="animate-pulse-soft absolute inline-flex h-full w-full rounded-full bg-green-500" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                </span>
                <span>
                  <span className="font-semibold text-foreground">{ONLINE_COUNT.toLocaleString()}</span> people online right now
                </span>
              </div>

              <div
                className="mt-8 flex flex-col items-center justify-center gap-3 animate-fade-in-up sm:flex-row lg:justify-start"
                style={{ animationDelay: "0.65s" }}
              >
                <Button
                  size="lg"
                  onClick={start}
                  className="brand-gradient brand-glow btn-pop h-12 w-full rounded-full px-8 text-base font-semibold text-white hover:opacity-95 sm:w-auto"
                >
                  Start chatting <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                {!user && (
                  <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-full px-6 text-base sm:w-auto">
                    <Link to="/auth">Sign up — it's free</Link>
                  </Button>
                )}
              </div>
            </div>

            <ChatMockup />
          </div>
        </section>


        {/* How it works */}
        <section className="mx-auto max-w-5xl px-4 pb-4 reveal" ref={stepsRef}>
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
                className="card-hover-glow relative rounded-2xl border border-border bg-card p-6 shadow-sm"
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
        <section className="mx-auto max-w-5xl px-4 py-16 reveal" ref={featuresRef}>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Shuffle, title: "Truly random", body: "Every match is a fresh face from users online right now." },
              { icon: MessageCircle, title: "Real-time chat", body: "Text and images with typing indicators — like talking in person." },
              { icon: ShieldCheck, title: "Safe by design", body: "Report or block anyone, anytime, in one tap." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="card-hover-glow rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety first */}
        <section className="mx-auto max-w-5xl px-4 pt-4 pb-16 reveal" ref={safetyRef}>
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Safety first</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">We built 1Chance to feel like a real conversation — not a social media profile.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Report & Block anytime", body: "See something you don't like? Block or report in one tap." },
              { icon: MessageCircle, title: "Anonymous by default", body: "No public profile, no feed, no history. Just this chat." },
              { icon: Zap, title: "You're in control", body: "End the chat whenever you want. No questions asked." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="card-hover-glow rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
                <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="mx-auto max-w-5xl px-4 pb-20 reveal" ref={ctaRef}>
          <div className="brand-gradient brand-glow relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white">
            <div
              aria-hidden
              className="animate-pulse-soft pointer-events-none absolute -left-10 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden
              className="animate-pulse-soft pointer-events-none absolute -right-8 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-2xl"
              style={{ animationDelay: "-2s" }}
            />
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
      </main>
    </div>
  );
}
