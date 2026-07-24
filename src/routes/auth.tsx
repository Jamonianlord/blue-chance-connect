import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — 1Chance" },
      { name: "description", content: "Create your 1Chance account and start meeting new people." },
      { property: "og:title", content: "Sign in — 1Chance" },
      { property: "og:description", content: "Join 1Chance to start random 1-on-1 chats." },
    ],
  }),
});

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(40),
  age: z.number().int().min(18, "You must be 18+").max(120),
  gender: z.enum(["male", "female"]),
  email: z.string().trim().email().max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({
          name, age: Number(age), gender, email, password,
        });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) { toast.error(error.message); return; }
        const uid = data.user?.id;
        if (!uid) { toast.error("Sign up failed"); return; }
        const { error: pErr } = await supabase.from("profiles").upsert({
          id: uid, name: parsed.data.name, age: parsed.data.age, gender: parsed.data.gender,
        });
        if (pErr) { toast.error(pErr.message); return; }
        await refreshProfile();
        toast.success("Welcome to 1Chance!");
        navigate({ to: "/match" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        await refreshProfile();
        navigate({ to: "/match" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--brand-soft)]/40 px-3 py-6 sm:px-4 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center sm:mb-6"><Link to="/"><Logo /></Link></div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xl sm:rounded-3xl sm:p-8">
          <div className="mb-5 flex rounded-full bg-muted p-1 text-sm font-medium sm:mb-6">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={"flex-1 rounded-full px-4 py-2 transition " + (mode === "signup" ? "bg-white text-foreground shadow" : "text-muted-foreground")}
            >Sign up</button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={"flex-1 rounded-full px-4 py-2 transition " + (mode === "signin" ? "bg-white text-foreground shadow" : "text-muted-foreground")}
            >Sign in</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">Your name (Nickname can be used)</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Alex" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" min={18} value={age} onChange={e => setAge(e.target.value)} placeholder="18+" required />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <RadioGroup value={gender} onValueChange={(v) => setGender(v as typeof gender)} className="mt-2 flex gap-2">
                      {(["male", "female"] as const).map(g => (
                        <label
                          key={g}
                          className={"flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-center text-xs capitalize transition " +
                            (gender === g ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-border")}
                        >
                          <RadioGroupItem value={g} className="sr-only" />
                          {g}
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="brand-gradient h-11 w-full rounded-full text-base font-semibold text-white hover:opacity-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Create account & start chatting" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
