import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, MessageCircle, Users } from "lucide-react";

export const Route = createFileRoute("/groups/")({
  component: GroupsPage,
  head: () => ({
    meta: [
      { title: "Groups — 1Chance" },
      { name: "description", content: "Join topic groups on 1Chance and chat with people who share your interests." },
      { property: "og:title", content: "Groups — 1Chance" },
      { property: "og:description", content: "Join topic groups on 1Chance and chat with people who share your interests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type GroupCard = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  memberCount: number;
  isMember: boolean;
};

function GroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupCard[] | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: groupRows, error } = await (supabase as any)
      .from("groups")
      .select("id, name, description, icon, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[groups] load error", error);
      toast.error("Could not load groups");
      setGroups([]);
      return;
    }

    const { data: memberRows } = await (supabase as any)
      .from("group_members")
      .select("group_id, user_id");

    const counts = new Map<string, number>();
    const mine = new Set<string>();
    for (const m of (memberRows ?? []) as { group_id: string; user_id: string }[]) {
      counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
      if (user && m.user_id === user.id) mine.add(m.group_id);
    }

    setGroups(
      ((groupRows ?? []) as any[]).map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        icon: g.icon,
        memberCount: counts.get(g.id) ?? 0,
        isMember: mine.has(g.id),
      })),
    );
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const join = async (groupId: string) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setJoining(groupId);
    const { error } = await (supabase as any)
      .from("group_members")
      .insert({ group_id: groupId, user_id: user.id });
    setJoining(null);
    if (error) {
      console.error("[groups] join error", error);
      toast.error("Could not join this group");
      return;
    }
    setGroups((prev) =>
      prev?.map((g) => (g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g)) ?? prev,
    );
    toast.success("Joined!");
    navigate({ to: "/groups/$groupId", params: { groupId } });
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-fade-in-up mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump into a room and chat with people who share your vibe.
          </p>
        </div>

        {groups === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="mt-4 h-5 w-2/3" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-5 h-9 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)]">
              <Users className="h-6 w-6 text-[var(--brand)]" />
            </div>
            <h2 className="mt-4 font-semibold">No groups yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Group rooms will show up here as soon as they're available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => (
              <div
                key={g.id}
                className="card-hover-glow animate-fade-in-up flex flex-col rounded-2xl border border-border bg-card p-5"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, animationFillMode: "both" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-2xl">
                  {g.icon ?? "💬"}
                </div>
                <h2 className="mt-4 text-base font-semibold">{g.name}</h2>
                {g.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
                )}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                </div>
                <div className="mt-5">
                  {g.isMember ? (
                    <Button asChild className="btn-pop w-full rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
                      <Link to="/groups/$groupId" params={{ groupId: g.id }}>
                        <MessageCircle className="mr-1.5 h-4 w-4" /> Open chat
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="btn-pop w-full rounded-full border-[var(--brand)]/40 text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                      disabled={joining === g.id}
                      onClick={() => join(g.id)}
                    >
                      {joining === g.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                      Join
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
