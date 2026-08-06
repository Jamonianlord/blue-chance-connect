import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/components/SignedImage";
import { toast } from "sonner";
import { Loader2, X, UserPlus, Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/meet")({
  component: MeetPage,
  head: () => ({
    meta: [
      { title: "Meet — 1Chance" },
      {
        name: "description",
        content: "Discover people who share your interests and personality. Find your vibe.",
      },
      { property: "og:title", content: "Meet — 1Chance" },
      {
        property: "og:description",
        content: "Discover people who share your interests and personality.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const INTEREST_OPTIONS = [
  "Music", "Movies", "Gaming", "Sports", "Travel", "Food", "Fitness",
  "Books", "Art", "Tech", "Fashion", "Photography", "Anime", "Comedy",
  "Dancing", "Cooking", "Nature", "Pets", "Cars", "Business",
];

const INTEREST_EMOJI: Record<string, string> = {
  Music: "🎵", Movies: "🎬", Gaming: "🎮", Sports: "⚽", Travel: "✈️",
  Food: "🍕", Fitness: "💪", Books: "📚", Art: "🎨", Tech: "💻",
  Fashion: "👗", Photography: "📸", Anime: "🌸", Comedy: "😂",
  Dancing: "💃", Cooking: "🍳", Nature: "🌿", Pets: "🐾", Cars: "🏎️",
  Business: "📈",
};

/** Glow colour per interest (hex, used for chip borders/shadows on the dark scene). */
const INTEREST_GLOW: Record<string, string> = {
  Gaming: "#60a5fa", Tech: "#60a5fa", Business: "#60a5fa",
  Music: "#fb923c", Dancing: "#fb923c", Comedy: "#fb923c",
  Sports: "#4ade80", Fitness: "#4ade80", Nature: "#4ade80",
  Movies: "#c084fc", Anime: "#c084fc", Art: "#c084fc", Photography: "#c084fc",
  Food: "#facc15", Cooking: "#facc15", Travel: "#facc15",
  Books: "#38bdf8", Fashion: "#f472b6", Pets: "#f472b6", Cars: "#f87171",
};
const glowFor = (tag: string) => INTEREST_GLOW[tag] ?? "#3b82f6";

const CARD_GRADIENTS = [
  "linear-gradient(160deg,#1e3a8a 0%,#4c1d95 100%)",
  "linear-gradient(160deg,#0f3d3e 0%,#312e81 100%)",
  "linear-gradient(160deg,#0f172a 0%,#831843 100%)",
];

type PersonalityPicks = {
  football_pick: "messi" | "ronaldo";
  pet_pick: "dog" | "cat";
  schedule_pick: "early_bird" | "night_owl";
  vibe_pick: "adventurous" | "chill";
};

type DiscoveredUser = {
  user_id: string;
  name: string;
  age: number;
  bio: string | null;
  avatar_url: string | null;
  interests: string[];
  football_pick: "messi" | "ronaldo" | null;
  pet_pick: "dog" | "cat" | null;
  schedule_pick: "early_bird" | "night_owl" | null;
  vibe_pick: "adventurous" | "chill" | null;
  interest_overlap: number;
  personality_overlap: number;
  friendship_status: "none" | "pending_sent" | "pending_received" | "accepted";
};

const PICK_BADGES: Record<string, { emoji: string; label: string }> = {
  messi: { emoji: "⚽", label: "Messi" },
  ronaldo: { emoji: "⚽", label: "Ronaldo" },
  dog: { emoji: "🐕", label: "Dog" },
  cat: { emoji: "🐱", label: "Cat" },
  early_bird: { emoji: "🌅", label: "Early" },
  night_owl: { emoji: "🌙", label: "Night" },
  adventurous: { emoji: "🌍", label: "Adventurous" },
  chill: { emoji: "😌", label: "Chill" },
};

const PICK_KEYS = ["football_pick", "pet_pick", "schedule_pick", "vibe_pick"] as const;

/**
 * `meet_profiles` lives outside the generated Supabase types, so it is reached
 * through a loosely-typed handle. Queries and runtime behaviour are unchanged.
 */
type MeetRow = {
  user_id: string;
  interests: string[] | null;
  football_pick: "messi" | "ronaldo" | null;
  pet_pick: "dog" | "cat" | null;
  schedule_pick: "early_bird" | "night_owl" | null;
  vibe_pick: "adventurous" | "chill" | null;
  completed_at: string | null;
};

interface LooseBuilder extends PromiseLike<{ data: unknown; error: { message: string } | null }> {
  select(cols: string): LooseBuilder;
  eq(col: string, val: string): LooseBuilder;
  not(col: string, op: string, val: string): LooseBuilder;
  maybeSingle(): LooseBuilder;
  upsert(values: Record<string, unknown>): LooseBuilder;
}

const meetDb = supabase as unknown as { from(table: string): LooseBuilder };


const STRICTNESS_LABELS = ["Interests only", "Interests + Vibe", "All picks must match"];

/* ------------------------------------------------------------------ */
/* Shared UI atoms                                                     */
/* ------------------------------------------------------------------ */

function GlowChip({ tag }: { tag: string }) {
  const c = glowFor(tag);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md"
      style={{
        border: `1px solid ${c}`,
        background: `${c}1f`,
        boxShadow: `0 0 12px -2px ${c}`,
      }}
    >
      <span>{INTEREST_EMOJI[tag] ?? "✨"}</span>
      {tag}
    </span>
  );
}

function PickBadge({ value }: { value: string }) {
  const b = PICK_BADGES[value];
  if (!b) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-md">
      <span className="text-sm leading-none">{b.emoji}</span>
      {b.label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${Math.round(value * 100)}%`,
          background: "linear-gradient(90deg,#3b82f6,#a855f7)",
          boxShadow: "0 0 14px rgb(59 130 246 / 0.9)",
        }}
      />
    </div>
  );
}

function QuizShell({
  progress,
  title,
  subtitle,
  stepKey,
  children,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
}: {
  progress: number;
  title: string;
  subtitle?: string;
  stepKey: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="meet-scene min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pb-8 pt-6">
        <ProgressBar value={progress} />
        <div key={stepKey} className="meet-step-in mt-8 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-white/55">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>

        <div className="mt-8 flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="meet-glass h-12 rounded-full px-6 text-sm font-semibold text-white/80 transition duration-200 ease-out hover:text-white"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="h-12 flex-1 rounded-full text-sm font-bold transition-all duration-300 ease-out disabled:cursor-not-allowed"
            style={
              nextDisabled
                ? { background: "rgb(255 255 255 / 0.07)", color: "rgb(255 255 255 / 0.35)" }
                : {
                    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                    color: "#fff",
                    boxShadow: "0 12px 40px -12px rgb(59 130 246 / 0.95)",
                  }
            }
          >
            {nextLabel}
          </button>
        </div>
      </main>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  emoji,
  label,
  hint,
  gold,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: React.ReactNode;
  label: string;
  hint?: string;
  gold?: boolean;
}) {
  const accent = gold ? "#facc15" : "#3b82f6";
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl px-4 py-8 transition-all duration-300 ease-out hover:-translate-y-0.5"
      style={{
        background: selected ? `${accent}1a` : "rgb(255 255 255 / 0.05)",
        border: `1px solid ${selected ? accent : "rgb(255 255 255 / 0.10)"}`,
        boxShadow: selected ? `0 0 28px -6px ${accent}` : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      {selected && (
        <span
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: accent, color: "#0a0a0f" }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
      <span className="text-4xl leading-none">{emoji}</span>
      <span className="text-base font-bold text-white">{label}</span>
      {hint && <span className="text-[11px] text-white/50">{hint}</span>}
    </button>
  );
}

function JerseyCard({
  selected,
  onClick,
  number,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  number: string;
  label: string;
}) {
  const accent = "#facc15";
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center gap-3 rounded-3xl px-4 py-8 transition-all duration-300 ease-out hover:-translate-y-0.5"
      style={{
        background: selected ? `${accent}14` : "rgb(255 255 255 / 0.05)",
        border: `1px solid ${selected ? accent : "rgb(255 255 255 / 0.10)"}`,
        boxShadow: selected ? `0 0 34px -6px ${accent}` : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      {selected && (
        <span
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: accent, color: "#0a0a0f" }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
      <span
        className="flex h-20 w-16 items-center justify-center rounded-xl text-3xl font-black tracking-tighter"
        style={{
          background: "rgb(255 255 255 / 0.08)",
          color: selected ? accent : "rgb(255 255 255 / 0.75)",
          border: "1px solid rgb(255 255 255 / 0.12)",
        }}
      >
        {number}
      </span>
      <span className="text-base font-bold text-white">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Onboarding quiz                                                     */
/* ------------------------------------------------------------------ */

function HeroScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="meet-scene flex min-h-screen items-center justify-center px-4">
      <div className="meet-card-in w-full max-w-md space-y-7 text-center">
        <div className="relative mx-auto h-40 w-40">
          <div className="meet-pulse-glow absolute inset-0 rounded-full border border-[#3b82f6]/40" />
          <div className="absolute inset-0 flex items-center justify-center text-6xl">💬</div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">Find your vibe</h1>
        <p className="text-white/55">
          A few quick picks and we'll show you people who actually match you.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="h-12 w-full rounded-full text-base font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg,#3b82f6,#6366f1)",
            boxShadow: "0 14px 44px -12px rgb(59 130 246 / 0.95)",
          }}
        >
          Let's go
        </button>
      </div>
    </div>
  );
}

function InterestsStep({
  interests,
  onSelect,
  onNext,
  onBack,
}: {
  interests: string[];
  onSelect: (interest: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const atLimit = interests.length >= 5;
  const [shaking, setShaking] = useState<string | null>(null);

  const handle = (tag: string) => {
    if (atLimit && !interests.includes(tag)) {
      setShaking(tag);
      window.setTimeout(() => setShaking(null), 320);
    }
    onSelect(tag);
  };

  return (
    <QuizShell
      progress={1}
      stepKey="interests"
      title="What are you into?"
      subtitle={`Pick up to 5 · ${interests.length}/5 selected`}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={interests.length === 0}
      nextLabel="Finish"
    >
      <div className="flex flex-wrap gap-2.5">
        {INTEREST_OPTIONS.map((tag) => {
          const active = interests.includes(tag);
          const dim = atLimit && !active;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handle(tag)}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 ease-out " +
                (active ? "meet-chip-pop text-white" : "text-white/70 hover:text-white") +
                (shaking === tag ? " meet-shake" : "")
              }
              style={
                active
                  ? {
                      background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                      border: "1px solid rgb(255 255 255 / 0.18)",
                      boxShadow: "0 0 22px -6px rgb(59 130 246 / 0.95)",
                    }
                  : {
                      background: "rgb(255 255 255 / 0.05)",
                      border: "1px solid rgb(255 255 255 / 0.10)",
                      opacity: dim ? 0.4 : 1,
                    }
              }
            >
              <span>{INTEREST_EMOJI[tag] ?? "✨"}</span>
              {tag}
            </button>
          );
        })}
      </div>
    </QuizShell>
  );
}

type QuizStep = "football" | "pet" | "schedule" | "vibe";

function PersonalityStep({
  step,
  picks,
  onSelect,
  onNext,
  onBack,
}: {
  step: QuizStep;
  picks: Partial<PersonalityPicks>;
  onSelect: (key: keyof PersonalityPicks, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const config = {
    football: { progress: 0.2, title: "Messi or Ronaldo?", subtitle: "The eternal debate." },
    pet: { progress: 0.4, title: "Dogs or cats?", subtitle: "No wrong answers. Mostly." },
    schedule: { progress: 0.6, title: "Early bird or night owl?", subtitle: "When do you come alive?" },
    vibe: { progress: 0.8, title: "What's your vibe?", subtitle: "How you like to spend a free day." },
  }[step];

  const key = (step + "_pick") as keyof PersonalityPicks;
  const value = picks[key] as string | undefined;

  return (
    <QuizShell
      progress={config.progress}
      stepKey={step}
      title={config.title}
      subtitle={config.subtitle}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!value}
    >
      {step === "football" ? (
        <div className="flex gap-3">
          <JerseyCard selected={value === "messi"} onClick={() => onSelect(key, "messi")} number="10" label="Messi" />
          <JerseyCard selected={value === "ronaldo"} onClick={() => onSelect(key, "ronaldo")} number="7" label="Ronaldo" />
        </div>
      ) : (
        <div className="space-y-3">
          {(step === "pet"
            ? [
                { v: "dog", e: "🐕", l: "Dog person", h: "Loyal, loud, always down" },
                { v: "cat", e: "🐱", l: "Cat person", h: "Independent and unbothered" },
              ]
            : step === "schedule"
              ? [
                  { v: "early_bird", e: "🌅", l: "Early bird", h: "Sunrise runs and quiet mornings" },
                  { v: "night_owl", e: "🌙", l: "Night owl", h: "The best ideas come after midnight" },
                ]
              : [
                  { v: "adventurous", e: "🌍", l: "Adventurous", h: "New places, new people" },
                  { v: "chill", e: "😌", l: "Chill", h: "Slow days and good company" },
                ]
          ).map((o) => (
            <div key={o.v} className="flex">
              <OptionCard
                selected={value === o.v}
                onClick={() => onSelect(key, o.v)}
                emoji={o.e}
                label={o.l}
                hint={o.h}
              />
            </div>
          ))}
        </div>
      )}
    </QuizShell>
  );
}

/* ------------------------------------------------------------------ */
/* Discovery feed                                                      */
/* ------------------------------------------------------------------ */

function SwipeCard({
  person,
  index,
  onSkip,
  onAdd,
  busy,
}: {
  person: DiscoveredUser;
  index: number;
  onSkip: () => void;
  onAdd: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const picks = PICK_KEYS.map((k) => person[k]).filter(Boolean) as string[];

  const finish = (dir: 1 | -1) => {
    setLeaving(true);
    setDx(dir * 700);
    window.setTimeout(() => (dir > 0 ? onAdd() : onSkip()), 220);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (leaving) return;
    startX.current = e.clientX;
    ref.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    const d = dx;
    startX.current = null;
    if (d > 110) finish(1);
    else if (d < -110) finish(-1);
    else setDx(0);
  };

  const rot = Math.max(-14, Math.min(14, dx / 12));
  const addOpacity = Math.max(0, Math.min(1, dx / 140));
  const skipOpacity = Math.max(0, Math.min(1, -dx / 140));

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="meet-card-in relative touch-pan-y select-none overflow-hidden rounded-[28px]"
      style={{
        background: gradient,
        border: "1px solid rgb(255 255 255 / 0.12)",
        boxShadow: "0 32px 80px -24px rgb(0 0 0 / 0.85)",
        transform: `translateX(${dx}px) rotate(${rot}deg)`,
        transition: startX.current === null ? "transform 0.3s cubic-bezier(0.16,1,0.3,1)" : "none",
        cursor: "grab",
      }}
    >
      {/* photo area — top 55% */}
      <div className="relative h-[330px] w-full overflow-hidden">
        {person.avatar_url ? (
          <SignedImage
            bucket="profile-photos"
            path={person.avatar_url}
            alt={person.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl font-black text-white/25">
            {person.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ background: "linear-gradient(to top, rgb(10 10 15 / 0.95), transparent)" }}
        />
      </div>

      {/* swipe overlays */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{ background: "rgb(239 68 68 / 0.28)", opacity: skipOpacity, transition: "opacity 0.15s ease-out" }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{ background: "rgb(59 130 246 / 0.28)", opacity: addOpacity, transition: "opacity 0.15s ease-out" }}
      />

      <div className="relative -mt-10 space-y-3 px-5 pb-5">
        <div>
          <h2 className="text-2xl font-bold leading-tight text-white">
            {person.name}, {person.age}
          </h2>
          {person.bio && <p className="mt-1 line-clamp-2 text-sm text-white/60">{person.bio}</p>}
        </div>

        {person.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {person.interests.slice(0, 5).map((i) => (
              <GlowChip key={i} tag={i} />
            ))}
          </div>
        )}

        {picks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {picks.map((p) => (
              <PickBadge key={p} value={p} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-5 pt-2">
          <button
            type="button"
            onClick={() => finish(-1)}
            disabled={busy}
            aria-label="Skip"
            className="group flex h-14 w-14 items-center justify-center rounded-full text-white/80 backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-white"
            style={{ background: "rgb(0 0 0 / 0.45)", border: "1px solid rgb(255 255 255 / 0.14)" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 26px -4px #ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => finish(1)}
            disabled={busy || person.friendship_status !== "none"}
            aria-label="Add friend"
            className="flex h-16 w-16 items-center justify-center rounded-full text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#3b82f6,#6366f1)",
              boxShadow: "0 0 30px -6px rgb(59 130 246 / 0.95)",
            }}
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <UserPlus className="h-6 w-6" strokeWidth={2.4} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscoveryFeed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [discoveredUsers, setDiscoveredUsers] = useState<DiscoveredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [strictness, setStrictness] = useState(() => {
    if (typeof localStorage === "undefined") return 0;
    const saved = localStorage.getItem("meet_strictness");
    const n = saved ? parseInt(saved) : 0;
    return Number.isFinite(n) && n >= 0 && n <= 2 ? n : 0;
  });

  const loadFeed = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("interests")
        .eq("id", user.id)
        .single();

      const { data: friendships } = await supabase
        .from("friendships")
        .select("addressee_id, requester_id, status")
        .in("status", ["pending", "accepted"]);

      const { data: blocks } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id);

      const myFriends = new Set<string>();
      const myBlocks = new Set<string>();
      const pendingReceived = new Set<string>();
      const myRequestsSent = new Set<string>();

      (friendships ?? []).forEach((f) => {
        if (f.status === "accepted") {
          if (f.addressee_id === user.id) myFriends.add(f.requester_id);
          else myFriends.add(f.addressee_id);
        } else if (f.addressee_id === user.id) {
          pendingReceived.add(f.requester_id);
        } else if (f.requester_id === user.id) {
          myRequestsSent.add(f.addressee_id);
        }
      });

      (blocks ?? []).forEach((b) => myBlocks.add(b.blocked_id));

      if (!myProfile) {
        setLoading(false);
        return;
      }

      const { data: candidates } = await supabase
        .from("profiles")
        .select("id, name, age, bio, avatar_url, interests, last_seen")
        .neq("id", user.id)
        .not(
          "id",
          "in",
          `(${[...myFriends, ...myBlocks, ...pendingReceived, ...myRequestsSent, user.id].join(",")})`,
        );

      const { data: meetProfiles } = (await meetDb
        .from("meet_profiles")
        .select("user_id, interests, football_pick, pet_pick, schedule_pick, vibe_pick, completed_at")
        .not("user_id", "in", `(${[...myFriends, ...myBlocks, user.id].join(",")})`)) as {
        data: MeetRow[] | null;
      };

      const validCandidateIds = new Set<string>();
      (meetProfiles ?? []).forEach((mp) => {
        if (mp.completed_at && mp.user_id !== user.id) {
          validCandidateIds.add(mp.user_id);
        }
      });

      const totalMeetProfiles = meetProfiles?.filter((m) => m.completed_at && m.user_id !== user.id).length ?? 0;
      const hasOtherProfiles = totalMeetProfiles > 0;

      const myInterests = myProfile.interests || [];
      const myMeetProfile = (await meetDb
        .from("meet_profiles")
        .select("football_pick, pet_pick, schedule_pick, vibe_pick")
        .eq("user_id", user.id)
        .maybeSingle()) as { data: MeetRow | null };
      const myPicks = myMeetProfile.data;


      let discoverData: DiscoveredUser[] = [];

      if (hasOtherProfiles) {
        discoverData = (candidates ?? [])
          .filter((c) => validCandidateIds.has(c.id))
          .map((c) => {
            const candidateMeetProfile = (meetProfiles ?? []).find((mp) => mp.user_id === c.id);
            if (!candidateMeetProfile?.completed_at) return null;

            const candidateInterests = candidateMeetProfile.interests || [];
            const interestOverlap = myInterests.filter((i) => candidateInterests.includes(i)).length;

            let personalityOverlap = 0;
            if (myPicks && candidateMeetProfile) {
              if (myPicks.football_pick === candidateMeetProfile.football_pick && myPicks.football_pick) personalityOverlap++;
              if (myPicks.pet_pick === candidateMeetProfile.pet_pick && myPicks.pet_pick) personalityOverlap++;
              if (myPicks.schedule_pick === candidateMeetProfile.schedule_pick && myPicks.schedule_pick) personalityOverlap++;
              if (myPicks.vibe_pick === candidateMeetProfile.vibe_pick && myPicks.vibe_pick) personalityOverlap++;
            }

            let status: DiscoveredUser["friendship_status"] = "none";

            if (myFriends.has(c.id)) {
              status = "accepted";
            } else if (pendingReceived.has(c.id)) {
              status = "pending_received";
            } else if (myRequestsSent.has(c.id)) {
              status = "pending_sent";
            }

            return {
              user_id: c.id,
              name: c.name,
              age: c.age,
              bio: c.bio,
              avatar_url: c.avatar_url,
              interests: c.interests ?? [],
              football_pick: candidateMeetProfile.football_pick ?? null,
              pet_pick: candidateMeetProfile.pet_pick ?? null,
              schedule_pick: candidateMeetProfile.schedule_pick ?? null,
              vibe_pick: candidateMeetProfile.vibe_pick ?? null,
              interest_overlap: interestOverlap,
              personality_overlap: personalityOverlap,
              friendship_status: status,
            };
          })
          .filter((u): u is DiscoveredUser => u !== null);

        discoverData = discoverData
          .map((u) => ({
            ...u,
            _score: (u.interest_overlap * 2) + (u.personality_overlap * 2) + Math.random() * 0.1,
          }))
          .sort((a, b) => b._score! - a._score!)
          .map(({ _score: _, ...u }) => u);
      }

      setDiscoveredUsers(discoverData);
    } catch (error) {
      console.error("[meet] load error", error);
      toast.error("Could not load discover feed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) {
      if (!user) navigate({ to: "/auth" });
      return;
    }
    loadFeed();
  }, [user, authLoading, navigate, loadFeed]);

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user || !targetUserId) return;
    setBusyId(targetUserId);

    const { error } = await supabase
      .from("friendships")
      .insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: "pending",
      });

    setBusyId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Friend request sent!");
    setSwipedIds((prev) => new Set([...prev, targetUserId]));
    setDiscoveredUsers((prev) => prev.filter((u) => u.user_id !== targetUserId));
  };

  const skipUser = (userId: string) => {
    setSwipedIds((prev) => new Set([...prev, userId]));
    setDiscoveredUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  const handleStrictnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    localStorage.setItem("meet_strictness", value.toString());
    setStrictness(value);
  };

  // Derived — the slider now filters the live feed instead of destroying it.
  const matching = useMemo(
    () =>
      discoveredUsers.filter((u) => {
        if (swipedIds.has(u.user_id)) return false;
        if (strictness === 1) return u.interest_overlap >= 1;
        if (strictness === 2) return u.interest_overlap >= 1 && u.personality_overlap >= 4;
        return true;
      }),
    [discoveredUsers, swipedIds, strictness],
  );

  const stack = matching.slice(0, 3);

  const slider = (
    <div className="meet-glass mx-auto mb-7 w-full rounded-full px-5 py-3.5">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/45">
        <span>Casual</span>
        <span className="text-[12px] normal-case tracking-normal text-[#93c5fd]">
          {STRICTNESS_LABELS[strictness]}
        </span>
        <span>Strict</span>
      </div>
      <input
        type="range"
        min="0"
        max="2"
        step="1"
        value={strictness}
        onChange={handleStrictnessChange}
        aria-label="Match strictness"
        className="meet-range mt-3 w-full"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="meet-scene min-h-screen">
        <Header />
        <main className="mx-auto max-w-md px-4 py-8">
          <div className="meet-glass mb-7 h-[74px] animate-pulse rounded-full" />
          <div className="meet-glass h-[540px] animate-pulse rounded-[28px]" />
        </main>
      </div>
    );
  }

  return (
    <div className="meet-scene min-h-screen">
      <Header />
      <main className="mx-auto max-w-md px-4 pb-16 pt-6">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#60a5fa]" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Meet</h1>
        </div>

        {slider}

        {stack.length === 0 ? (
          <div className="meet-glass rounded-3xl p-10 text-center">
            <div className="mb-4 text-4xl">💫</div>
            <h2 className="text-xl font-bold text-white">
              {discoveredUsers.length > 0 ? "Nobody at this level" : "You've seen everyone for now"}
            </h2>
            <p className="mt-2 text-sm text-white/55">
              {discoveredUsers.length > 0
                ? "Try loosening the strictness slider."
                : "Check back later to discover more people who share your vibe."}
            </p>
            <button
              type="button"
              onClick={() => loadFeed()}
              className="mt-6 h-11 rounded-full px-7 text-sm font-bold text-white transition-all duration-200 ease-out hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                boxShadow: "0 12px 40px -12px rgb(59 130 246 / 0.9)",
              }}
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* peeking cards behind */}
              {stack.slice(1).map((p, i) => (
                <div
                  key={p.user_id}
                  className="absolute inset-x-0 top-0 h-full rounded-[28px]"
                  style={{
                    background: CARD_GRADIENTS[(stack.indexOf(p)) % CARD_GRADIENTS.length],
                    border: "1px solid rgb(255 255 255 / 0.08)",
                    transform: `translateY(${(i + 1) * 14}px) scale(${1 - (i + 1) * 0.045})`,
                    filter: `blur(${(i + 1) * 2}px)`,
                    opacity: 0.6 - i * 0.2,
                    zIndex: 0,
                  }}
                />
              ))}
              <div className="relative z-10">
                <SwipeCard
                  key={stack[0].user_id}
                  person={stack[0]}
                  index={0}
                  busy={busyId === stack[0].user_id}
                  onSkip={() => skipUser(stack[0].user_id)}
                  onAdd={() => sendFriendRequest(stack[0].user_id)}
                />
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-white/40">
              {matching.length} {matching.length === 1 ? "person shares" : "people share"} your vibe
            </p>
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type OnboardingState = "hero" | "football" | "pet" | "schedule" | "vibe" | "interests" | "complete";

function MeetPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [onboardingStep, setOnboardingStep] = useState<OnboardingState>("hero");
  const [interests, setInterests] = useState<string[]>([]);
  const [picks, setPicks] = useState<Partial<PersonalityPicks>>({});
  const [loadingMeetProfile, setLoadingMeetProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
      return;
    }

    if (!authLoading && user && profile) {
      const checkMeetProfile = async () => {
        setLoadingMeetProfile(true);
        const { data } = (await meetDb
          .from("meet_profiles")
          .select("completed_at")
          .eq("user_id", user.id)
          .maybeSingle()) as { data: MeetRow | null };


        if (!data?.completed_at) {
          setOnboardingStep("hero");
        } else {
          setOnboardingStep("complete");
        }
        setLoadingMeetProfile(false);
      };
      checkMeetProfile();
    }
  }, [authLoading, user, profile, navigate]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length >= 5) {
        toast.error(`Pick up to 5 interests`);
        return prev;
      }
      return [...prev, interest];
    });
  };

  const selectPersonalityPick = (key: keyof PersonalityPicks, value: string) => {
    setPicks((prev) => ({ ...prev, [key]: value as never }));
  };

  const completeOnboarding = async () => {
    if (!user) return;

    const { error } = await meetDb.from("meet_profiles").upsert({
      user_id: user.id,
      interests,
      football_pick: (picks.football_pick as "messi" | "ronaldo") || null,
      pet_pick: (picks.pet_pick as "dog" | "cat") || null,
      schedule_pick: (picks.schedule_pick as "early_bird" | "night_owl") || null,
      vibe_pick: (picks.vibe_pick as "adventurous" | "chill") || null,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[meet] onboarding error", error);
      toast.error(error.message);
      return;
    }

    setOnboardingStep("complete");
  };

  if (authLoading || loadingMeetProfile || !profile) {
    return (
      <div className="meet-scene flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  if (onboardingStep === "hero") {
    return <HeroScreen onNext={() => setOnboardingStep("football")} />;
  }

  if (onboardingStep === "football" || onboardingStep === "pet" || onboardingStep === "schedule" || onboardingStep === "vibe") {
    const order: OnboardingState[] = ["hero", "football", "pet", "schedule", "vibe", "interests"];
    const idx = order.indexOf(onboardingStep);
    return (
      <PersonalityStep
        step={onboardingStep}
        picks={picks}
        onSelect={selectPersonalityPick}
        onNext={() => setOnboardingStep(order[idx + 1])}
        onBack={() => setOnboardingStep(order[idx - 1])}
      />
    );
  }

  if (onboardingStep === "interests") {
    return (
      <InterestsStep
        interests={interests}
        onSelect={toggleInterest}
        onNext={completeOnboarding}
        onBack={() => setOnboardingStep("vibe")}
      />
    );
  }

  return <DiscoveryFeed />;
}
