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
};

const PICK_CONFIG = [
  { key: "football_pick", emoji: "⚽", labels: { messi: "Messi", ronaldo: "Ronaldo" } },
  { key: "pet_pick", emoji: "🐕", labels: { dog: "Dog", cat: "Cat" } },
  { key: "schedule_pick", emoji: "🌅", labels: { early_bird: "Early", night_owl: "Night" } },
  { key: "vibe_pick", emoji: "🌍", labels: { adventurous: "Adventurous", chill: "Chill" } },
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
  const allComplete = PICK_CONFIG.every(
    (pick) => (picks as Record<string, string | null>)[pick.key] !== null
  );

  const getPickValue = (key: keyof PersonalityPicks): string | null => {
    const v = (picks as Record<string, string | null>)[key];
    return v || null;
  };

  return (
    <div className="flex-1 bg-background px-4 py-8">
      <Header />
      <main className="mx-auto max-w-lg pt-4">
        <h1 className="text-2xl font-bold">Quick picks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us your vibe</p>

        <div className="mt-6 space-y-4">
          {PICK_CONFIG.map(({ key, emoji, labels }) => {
            const categoryKey = key as keyof PersonalityPicks;
            return (
              <div key={key} className="space-y-2">
                <h3 className="text-sm font-medium capitalize">
                  {key.replace("_pick", "").replace("_", " ")}
                </h3>
                <div className="flex gap-2">
                  {(["messi", "ronaldo"] as const).map((opt: "messi" | "ronaldo") => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onSelect(categoryKey, opt)}
                      className={
                        "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                        "flex-1 " +
                        (getPickValue(categoryKey) === opt
                          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "border-border bg-card text-foreground hover:bg-muted")
                      }
                    >
                      ⚽ {labels[opt]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="space-y-2">
            <h3 className="text-sm font-medium capitalize">pets</h3>
            <div className="flex gap-2">
              {(["dog", "cat"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onSelect("pet_pick", opt)}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                    "flex-1 " +
                    (getPickValue("pet_pick") === opt
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-border bg-card text-foreground hover:bg-muted")
                  }
                >
                  {opt === "dog" ? "🐕 Dog" : "🐱 Cat"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium capitalize">schedule</h3>
            <div className="flex gap-2">
              {(["early_bird", "night_owl"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onSelect("schedule_pick", opt)}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                    "flex-1 " +
                    (getPickValue("schedule_pick") === opt
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-border bg-card text-foreground hover:bg-muted")
                  }
                >
                  {opt === "early_bird" ? "🌅 Early" : "🌙 Night"}
                </button>
              ))}
            </div>
          </div>
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
  const [strictness, setStrictness] = useState(() => {
    const saved = localStorage.getItem("meet_strictness");
    return saved ? parseInt(saved) : 0;
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

      const totalMeetProfiles = meetProfiles?.filter((m) => m.completed_at && m.user_id !== user.id).length ?? 0;
      const hasOtherProfiles = totalMeetProfiles > 0;

      const myInterests = myProfile.interests || [];
      const myMeetProfile = await supabase
        .from("meet_profiles")
        .select("football_pick, pet_pick, schedule_pick, vibe_pick")
        .eq("user_id", user.id)
        .maybeSingle();
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
          .map((user) => ({
            ...user,
            _score: (user.interest_overlap * 2) + (user.personality_overlap * 2) + Math.random() * 0.1,
          }))
          .sort((a, b) => b._score! - a._score!)
          .map(({ _score: _, ...user }) => user);
      }

      if (!hasOtherProfiles && discoverData.length === 0) {
        setDiscoveredUsers([]);
      } else {
        const filteredUsers =
          strictness === 0
            ? discoverData
            : discoverData.filter((u) => {
                const score = (u.interest_overlap * 2) + (u.personality_overlap * 2);
                const minScore = (strictness / 100) * 10;
                return score >= minScore;
              });
        setDiscoveredUsers(filteredUsers);
      }
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

  const handleStrictnessSubmit = () => {
    const filtered = discoveredUsers.filter((u) => {
      const score = (u.interest_overlap * 2) + (u.personality_overlap * 2);
      const minScore = (strictness / 100) * 10;
      return score >= minScore;
    });
    setDiscoveredUsers(filtered);
  };

  const visibleUsers = discoveredUsers.filter((u) => !swipedIds.has(u.user_id)).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-8">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                  </div>
                </div>
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
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-2">You've seen everyone for now!</h2>
            <p className="text-muted-foreground mb-4">
              Check back later to discover more people who share your vibe.
            </p>
            <Button
              className="brand-gradient rounded-full"
              onClick={() => loadFeed()}
            >
              Refresh
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Meet</h1>
        <p className="text-muted-foreground mb-6">People who match your vibe</p>

        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Show me:</span>
            <span className="text-xs font-medium text-muted-foreground">
              {strictness === 0 ? "Everyone" :
               strictness === 25 ? "Some overlap" :
               strictness === 50 ? "Closer matches" :
               strictness === 75 ? "Strong matches" : "Best matches"}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={strictness}
            onChange={handleStrictnessChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Everyone</span>
            <span>Best matches only</span>
          </div>
        </div>

        <div className="space-y-4">
          {visibleUsers.map((userCard) => {
            const overlapCount = userCard.interest_overlap;

            return (
              <div
                key={userCard.user_id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar path={userCard.avatar_url} name={userCard.name} size={80} />

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-lg">
                        {userCard.name}, {userCard.age}
                      </h2>
                    </div>

                    {userCard.bio && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {userCard.bio}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1">
                      {userCard.interests.slice(0, 3).map((interest) => {
                        const isOverlap = overlapCount > 0 && userCard.interests.includes(interest);
                        return (
                          <span
                            key={interest}
                            className={`text-xs px-2 py-1 rounded-full ${
                              isOverlap
                                ? "bg-[var(--brand)] text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {interest}
                          </span>
                        );
                      })}
                      {userCard.interests.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{userCard.interests.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {PICK_CONFIG.filter((p) => (userCard as any)[p.key]).map((pick) => {
                        const key = pick.key as keyof DiscoveredUser;
                        const value = userCard[key] as string | null;
                        const matchValue = userCard[key];
                        return (
                          <span
                            key={pick.key}
                            className={`text-xs px-2 py-1 rounded-full ${
                              matchValue 
                                ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {value === "messi" ? "⚽ M" :
                             value === "ronaldo" ? "⚽ R" :
                             value === "dog" ? "🐕 D" :
                             value === "cat" ? "🐱 C" :
                             value === "early_bird" ? "🌅 E" :
                             value === "night_owl" ? "🌙 N" :
                             value === "adventurous" ? "🌍 A" :
                             value === "chill" ? "🏖️ C" : ""}
                          </span>
                        );
                      })}
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
                      <><UserPlus className="mr-1 h-4 w-4" /> Add</>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {visibleUsers.length === 0 && discoveredUsers.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">
              No matches at this level — try loosening the filter.
            </p>
          </div>
        )}
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