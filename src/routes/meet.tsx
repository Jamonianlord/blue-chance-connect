import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/SignedImage";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Heart, X, UserPlus } from "lucide-react";

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

type PersonalityPicks = {
  football_pick: "messi" | "ronaldo";
  pet_pick: "dog" | "cat";
  schedule_pick: "early_bird" | "night_owl";
  vibe_pick: "adventurous" | "chill";
};

type MeetProfile = {
  user_id: string;
  interests: string[];
  football_pick: "messi" | "ronaldo" | null;
  pet_pick: "dog" | "cat" | null;
  schedule_pick: "early_bird" | "night_owl" | null;
  vibe_pick: "adventurous" | "chill" | null;
  completed_at: string;
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
  friendship_id: string | null;
};

const PICK_LABELS: Record<string, { emoji: string; label: string }> = {
  football_pick: { emoji: "⚽", label: "Football" },
  pet_pick: { emoji: "🐕🐱", label: "Pet" },
  schedule_pick: { emoji: "🌅🌙", label: "Schedule" },
  vibe_pick: { emoji: "🌍🏖️", label: "Vibe" },
};

const PICKS_CONFIG = [
  { key: "football_pick" as const, title: "Football", options: ["messi", "ronaldo"] as const },
  { key: "pet_pick" as const, title: "Pet", options: ["dog", "cat"] as const },
  { key: "schedule_pick" as const, title: "Schedule", options: ["early_bird", "night_owl"] as const },
  { key: "vibe_pick" as const, title: "Vibe", options: ["adventurous", "chill"] as const },
];

function HeroScreen({ onNext }: { onNext: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="flex min-h-screen bg-background items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="relative h-48 w-48 mx-auto">
          <div className="animate-pulse absolute inset-0 rounded-full border-2 border-[var(--brand)]/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">💬</div>
          </div>
        </div>
        <h1 className="text-3xl font-bold">Find your vibe</h1>
        <p className="text-muted-foreground">
          Discover people who share your interests and personality
        </p>
        <Button
          onClick={onNext}
          className="brand-gradient h-12 w-full rounded-full text-base font-semibold text-white"
        >
          Let's go
        </Button>
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
  return (
    <div className="flex-1 bg-background px-4 py-8">
      <Header />
      <main className="mx-auto max-w-lg pt-4">
        <h1 className="text-2xl font-bold">What are you into?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick up to 5 interests</p>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((tag) => {
              const active = interests.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelect(tag)}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                    (active
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-border bg-card text-foreground hover:bg-muted")
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {interests.length}/5 interests selected
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="h-11 rounded-full" onClick={onBack}>
            Back
          </Button>
          <Button
            className="brand-gradient h-11 flex-1 rounded-full text-white"
            onClick={onNext}
            disabled={interests.length === 0}
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}

function PersonalityStep({
  picks,
  onSelect,
  onNext,
  onBack,
}: {
  picks: PersonalityPicks;
  onSelect: (key: keyof PersonalityPicks, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const allComplete = PICKS_CONFIG.every(
    (pick: typeof PICKS_CONFIG[number]) => (picks as Record<string, string | null>)[pick.key] !== undefined
  );

  return (
    <div className="flex-1 bg-background px-4 py-8">
      <Header />
      <main className="mx-auto max-w-lg pt-4">
        <h1 className="text-2xl font-bold">Quick picks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us your vibe</p>

        <div className="mt-6 space-y-4">
          {PICKS_CONFIG.map(({ key, title, options }) => (
            <div key={key} className="space-y-2">
              <h3 className="text-sm font-medium capitalize">{title.toLowerCase()}</h3>
              <div className="flex gap-2">
                {options.map((opt: string) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onSelect(key, opt)}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                      "flex-1 " +
                      ((picks[key as keyof PersonalityPicks] as string) === opt
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-border bg-card text-foreground hover:bg-muted")
                    }
                    >
                      {((picks[key as keyof PersonalityPicks] as string) === "messi" || (picks[key as keyof PersonalityPicks] as string) === "ronaldo")
                        ? opt === "messi"
                          ? "⚽ Messi"
                          : "⚽ Ronaldo"
                        : (picks[key as keyof PersonalityPicks] as string) === "dog" || (picks[key as keyof PersonalityPicks] as string) === "cat"
                        ? opt === "dog"
                          ? "🐕 Dog"
                          : "🐱 Cat"
                        : (picks[key as keyof PersonalityPicks] as string) === "early_bird" || (picks[key as keyof PersonalityPicks] as string) === "night_owl"
                        ? opt === "early_bird"
                          ? "🌅 Early"
                          : "🌙 Night"
                        : opt === "adventurous"
                        ? "🌍 Adventurous"
                        : "🏖️ Chill"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="h-11 rounded-full" onClick={onBack}>
            Back
          </Button>
          <Button
            className="brand-gradient h-11 flex-1 rounded-full text-white"
            onClick={onNext}
            disabled={!allComplete}
          >
            Continue
          </Button>
        </div>
      </main>
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

      const { data: meetProfiles } = await supabase
        .from("meet_profiles")
        .select("user_id, interests, football_pick, pet_pick, schedule_pick, vibe_pick, completed_at")
        .not("user_id", "in", `(${[...myFriends, ...myBlocks, user.id].join(",")})`);

      const validCandidateIds = new Set<string>();
      (meetProfiles ?? []).forEach((mp) => {
        if (mp.completed_at && mp.user_id !== user.id) {
          validCandidateIds.add(mp.user_id);
        }
      });

      const myInterests = myProfile.interests || [];

      const discoverData = (candidates ?? [])
        .filter((c) => validCandidateIds.has(c.id))
        .map((c) => {
          const candidateMeetProfile = (meetProfiles ?? []).find((mp) => mp.user_id === c.id);
          const candidateInterests = candidateMeetProfile?.interests ?? [];
          const interestOverlap = myInterests.filter((i) => candidateInterests.includes(i)).length;

          const myPicks = null; // We don't compare picks for discovery feed
          const candidatePicks = candidateMeetProfile;

          let personalityOverlap = 0;
          if (candidatePicks) {
            if (candidatePicks.football_pick && true) personalityOverlap++;
            if (candidatePicks.pet_pick && true) personalityOverlap++;
            if (candidatePicks.schedule_pick && true) personalityOverlap++;
            if (candidatePicks.vibe_pick && true) personalityOverlap++;
          }

          let status: "none" | "pending_sent" | "pending_received" | "accepted" = "none";
          const friendshipId: string | null = null;

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
            football_pick: candidatePicks?.football_pick as "messi" | "ronaldo" | null ?? null,
            pet_pick: candidatePicks?.pet_pick as "dog" | "cat" | null ?? null,
            schedule_pick: candidatePicks?.schedule_pick as "early_bird" | "night_owl" | null ?? null,
            vibe_pick: candidatePicks?.vibe_pick as "adventurous" | "chill" | null ?? null,
            interest_overlap: interestOverlap,
            personality_overlap: personalityOverlap,
            friendship_status: status,
            friendship_id: friendshipId,
          };
        })
        .sort((a, b) => {
          if (b.interest_overlap !== a.interest_overlap) {
            return b.interest_overlap - a.interest_overlap;
          }
          return b.personality_overlap - a.personality_overlap;
        });

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

    const { data, error } = await supabase
      .from("friendships")
      .insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: "pending",
      })
      .select("id")
      .single();

    setBusyId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Friend request sent!");
    setDiscoveredUsers((prev) => prev.filter((u) => u.user_id !== targetUserId));
  };

  const skipUser = (userId: string) => {
    setSwipedIds((prev) => new Set([...prev, userId]));
    setDiscoveredUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  const getPicksDisplay = (userCard: DiscoveredUser) => {
    const picks: { icon: string; label: string }[] = [];
    if (userCard.football_pick) {
      picks.push({ icon: "⚽", label: userCard.football_pick === "messi" ? "Messi" : "Ronaldo" });
    }
    if (userCard.pet_pick) {
      picks.push({ icon: userCard.pet_pick === "dog" ? "🐕" : "🐱", label: userCard.pet_pick });
    }
    if (userCard.schedule_pick) {
      picks.push({ icon: userCard.schedule_pick === "early_bird" ? "🌅" : "🌙", label: userCard.schedule_pick });
    }
    if (userCard.vibe_pick) {
      picks.push({ icon: userCard.vibe_pick === "adventurous" ? "🌍" : "🏖️", label: userCard.vibe_pick });
    }
    return picks;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-8">
          <Skeleton className="mb-4 h-6 w-28" />
          <Skeleton className="mb-3 h-4 w-20" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <Skeleton className="mb-3 h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="mb-2 h-4 w-24 mx-auto" />
                <Skeleton className="mb-2 h-3 w-16 mx-auto" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (discoveredUsers.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Meet</h1>
          <p className="text-muted-foreground mb-6">
            No users to discover right now. Check back later!
          </p>
          <Button onClick={() => loadFeed()} className="brand-gradient rounded-full">
            Refresh
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Meet</h1>
        <p className="text-muted-foreground mb-4">People who match your vibe</p>

        <div className="space-y-4">
          {discoveredUsers
            .filter((u) => !swipedIds.has(u.user_id))
            .slice(0, 5)
            .map((userCard) => (
              <div
                key={userCard.user_id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar path={userCard.avatar_url} name={userCard.name} size={64} />

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-lg">
                        {userCard.name}, {userCard.age}
                      </h2>
                      <span className="text-xs text-muted-foreground">·</span>
                    </div>

                    {userCard.bio && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {userCard.bio}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1">
                      {userCard.interests.slice(0, 3).map((interest) => (
                        <span
                          key={interest}
                          className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                        >
                          {interest}
                        </span>
                      ))}
                      {userCard.interests.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{userCard.interests.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {getPicksDisplay(userCard).map((pick, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-full bg-[var(--brand-soft)] text-[var(--brand)]"
                        >
                          {pick.icon} {pick.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => skipUser(userCard.user_id)}
                    disabled={busyId === userCard.user_id}
                  >
                    <X className="mr-1 h-4 w-4" /> Skip
                  </Button>
                  <Button
                    className="flex-1 brand-gradient rounded-full text-white"
                    onClick={() => sendFriendRequest(userCard.user_id)}
                    disabled={
                      busyId === userCard.user_id || userCard.friendship_status !== "none"
                    }
                  >
                    {busyId === userCard.user_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : userCard.friendship_status === "accepted" ? (
                      <span>Friends</span>
                    ) : userCard.friendship_status === "pending_sent" ? (
                      <span>Requested</span>
                    ) : (
                      <>
                        <UserPlus className="mr-1 h-4 w-4" /> Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}

type OnboardingState = "hero" | "interests" | "personality" | "complete";

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
        const { data } = await supabase
          .from("meet_profiles")
          .select("completed_at")
          .eq("user_id", user.id)
          .maybeSingle();

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
    setPicks((prev) => ({ ...prev, [key]: value as any }));
  };

  const completeOnboarding = async () => {
    if (!user) return;

    const { error } = await supabase.from("meet_profiles").upsert({
      user_id: user.id,
      interests,
      football_pick: picks.football_pick || null,
      pet_pick: picks.pet_pick || null,
      schedule_pick: picks.schedule_pick || null,
      vibe_pick: picks.vibe_pick || null,
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  if (onboardingStep === "hero") {
    return <HeroScreen onNext={() => setOnboardingStep("interests")} />;
  }

  if (onboardingStep === "interests") {
    return (
      <InterestsStep
        interests={interests}
        onSelect={toggleInterest}
        onNext={() => setOnboardingStep("personality")}
        onBack={() => setOnboardingStep("hero")}
      />
    );
  }

  if (onboardingStep === "personality") {
    return (
      <PersonalityStep
        picks={picks as PersonalityPicks}
        onSelect={selectPersonalityPick}
        onNext={completeOnboarding}
        onBack={() => setOnboardingStep("interests")}
      />
    );
  }

  return <DiscoveryFeed />;
}