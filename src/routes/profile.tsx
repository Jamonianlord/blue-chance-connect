import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Save, LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your profile — 1Chance" },
      { name: "description", content: "Manage your 1Chance profile: name, age, and gender." },
      { property: "og:title", content: "Your profile — 1Chance" },
      { property: "og:description", content: "Manage your 1Chance profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ProfilePage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(String(profile.age));
      setGender(profile.gender === "other" ? "male" : profile.gender);
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    if (!name.trim() || !age || Number(age) < 18) {
      toast.error("Enter a name and a valid age (18+).");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, name: name.trim(), age: Number(age), gender,
    });
    setSaving(false);
    if (error) {
      console.error("[profile] save error", error);
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
    if (!profile) navigate({ to: "/match" });
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">This is how others may see you.</p>

        <div className="mt-6 space-y-4 rounded-3xl border border-border bg-white p-6 shadow-sm">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" min={18} value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <Label>Gender</Label>
            <RadioGroup value={gender} onValueChange={(v) => setGender(v as typeof gender)} className="mt-2 grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map(g => (
                <Label
                  key={g}
                  className={"cursor-pointer rounded-xl border px-3 py-2 text-center text-sm capitalize " +
                    (gender === g ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-border")}
                >
                  <RadioGroupItem value={g} className="sr-only" />
                  {g}
                </Label>
              ))}
            </RadioGroup>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="brand-gradient h-11 flex-1 rounded-full text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1 h-4 w-4" /> Save changes</>}
            </Button>
            <Button variant="outline" className="h-11 rounded-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
