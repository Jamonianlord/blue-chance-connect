const PARTICLES = [
  { left: "8%", top: "18%", size: 6, delay: "0s", dur: "13s", op: 0.35 },
  { left: "16%", top: "72%", size: 10, delay: "1.5s", dur: "16s", op: 0.25 },
  { left: "27%", top: "38%", size: 4, delay: "3s", dur: "11s", op: 0.4 },
  { left: "38%", top: "84%", size: 7, delay: "2s", dur: "15s", op: 0.3 },
  { left: "62%", top: "12%", size: 8, delay: "0.8s", dur: "14s", op: 0.3 },
  { left: "72%", top: "58%", size: 5, delay: "2.6s", dur: "12s", op: 0.4 },
  { left: "84%", top: "28%", size: 9, delay: "1.1s", dur: "17s", op: 0.25 },
  { left: "91%", top: "78%", size: 6, delay: "3.4s", dur: "13s", op: 0.35 },
  { left: "50%", top: "92%", size: 5, delay: "4s", dur: "15s", op: 0.3 },
  { left: "46%", top: "6%", size: 4, delay: "2.2s", dur: "12s", op: 0.35 },
];

/** Purely decorative animated backdrop for the auth screen. */
export function AuthScene() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Shifting gradient wash */}
      <div
        className="auth-gradient-layer absolute -inset-[20%]"
        style={{
          background:
            "radial-gradient(45% 45% at 25% 30%, color-mix(in oklab, var(--brand) 30%, transparent) 0%, transparent 70%), radial-gradient(40% 40% at 78% 68%, color-mix(in oklab, var(--brand) 22%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* Slow parallax blobs */}
      <div
        className="auth-blob absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "color-mix(in oklab, var(--brand) 22%, transparent)" }}
      />
      <div
        className="auth-blob absolute -right-20 bottom-0 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "color-mix(in oklab, var(--brand) 16%, transparent)", animationDelay: "-8s" }}
      />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="auth-particle absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.op,
            animationDelay: p.delay,
            animationDuration: p.dur,
            background: "var(--brand)",
          }}
        />
      ))}

      {/* Chat-bubble illustration (hidden on small screens so it never crowds the form) */}
      <div className="auth-bubble absolute left-[6%] top-[22%] hidden lg:block">
        <div className="h-12 w-32 rounded-2xl rounded-bl-sm border border-border/60 bg-card/70 backdrop-blur-sm" />
      </div>
      <div
        className="auth-bubble absolute left-[11%] top-[34%] hidden lg:block"
        style={{ animationDelay: "-2.5s" }}
      >
        <div
          className="flex h-10 w-24 items-center justify-center gap-1 rounded-2xl rounded-br-sm"
          style={{ background: "var(--brand)" }}
        >
          <span className="animate-dot h-1.5 w-1.5 rounded-full bg-[var(--brand-foreground)]" />
          <span className="animate-dot h-1.5 w-1.5 rounded-full bg-[var(--brand-foreground)]" style={{ animationDelay: "0.15s" }} />
          <span className="animate-dot h-1.5 w-1.5 rounded-full bg-[var(--brand-foreground)]" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>

      <div className="auth-bubble absolute right-[8%] bottom-[24%] hidden lg:block" style={{ animationDelay: "-4s" }}>
        <div
          className="h-11 w-28 rounded-2xl rounded-br-sm"
          style={{ background: "color-mix(in oklab, var(--brand) 70%, transparent)" }}
        />
      </div>
      <div className="auth-bubble absolute right-[14%] bottom-[14%] hidden lg:block" style={{ animationDelay: "-1.2s" }}>
        <div className="h-9 w-20 rounded-2xl rounded-bl-sm border border-border/60 bg-card/70 backdrop-blur-sm" />
      </div>
    </div>
  );
}
