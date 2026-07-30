import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar } from "@/components/SignedImage";
import { toast } from "sonner";
import { Loader2, Save, LogOut, Camera } from "lucide-react";

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

const INTEREST_OPTIONS = [
  "Music", "Movies", "Gaming", "Sports", "Travel", "Food", "Fitness",
  "Books", "Art", "Tech", "Fashion", "Photography", "Anime", "Comedy",
  "Dancing", "Cooking", "Nature", "Pets", "Cars", "Business",
];
const MAX_INTERESTS = 5;
const MAX_BIO = 200;

function ProfilePage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(String(profile.age));
      setGender(profile.gender === "other" ? "male" : profile.gender);
      setBio(profile.bio ?? "");
      setAvatarPath(profile.avatar_url ?? null);
      setInterests(profile.interests ?? []);
    }
  }, [profile]);

  const toggleInterest = (tag: string) => {
    setInterests((cur) => {
      if (cur.includes(tag)) return cur.filter((t) => t !== tag);
      if (cur.length >= MAX_INTERESTS) {
        toast.error(`Pick up to ${MAX_INTERESTS} interests`);
        return cur;
      }
      return [...cur, tag];
    });
  };

  const onPickAvatar = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB."); return; }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (dbErr) throw dbErr;
      setAvatarPath(path);
      await refreshProfile();
      toast.success("Photo updated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      console.error("[profile] avatar upload", e);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    if (!name.trim() || !age || Number(age) < 18) {
      toast.error("Enter a name and a valid age (18+).");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, name: name.trim(), age: Number(age), gender, bio, interests,
    } as never);
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

        <div className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar path={avatarPath} name={name || profile?.name} size={112} className="ring-4 ring-[var(--brand-soft)]" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-md hover:opacity-90 disabled:opacity-60"
                aria-label="Change photo"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickAvatar(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
           <div>
             <Label htmlFor="age">Age</Label>
             <Input id="age" type="number" min={18} value={age} onChange={(e) => setAge(e.target.value)} />
           </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className="text-xs text-muted-foreground">{bio.length}/{MAX_BIO}</span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              maxLength={MAX_BIO}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Say something about yourself…"
              className="mt-2 min-h-[96px] resize-none rounded-xl border-2 border-border/80 focus-visible:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--brand-soft)]"
            />
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
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Interests</Label>
              <span className="text-xs text-muted-foreground">{interests.length}/{MAX_INTERESTS}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Optional — helps break the ice with your match.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((tag) => {
                const active = interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={"rounded-full border px-3 py-1.5 text-xs font-medium transition " +
                      (active
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-border bg-card text-foreground hover:bg-muted")}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
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