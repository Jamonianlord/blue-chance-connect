import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Set a new password \u2014 1Chance" },
      { name: "description", content: "Choose a new password for your 1Chance account." },
      { property: "og:title", content: "Set a new password \u2014 1Chance" },
      { property: "og:description", content: "Choose a new password for your 1Chance account." },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash automatically and fires PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessionOk(true);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionOk(true);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const validate = () => {
    let ok = true;
    if (password.length < 6) {
      setPwError("Password must be at least 6 characters");
      ok = false;
    } else {
      setPwError(null);
    }
    if (confirm !== password) {
      setConfirmError("Passwords don't match");
      ok = false;
    } else {
      setConfirmError(null);
    }
    return ok;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error("[reset-password] updateUser error", error);
        setFormError(error.message);
        return;
      }
      await supabase.auth.signOut();
      toast.success("Password updated — sign in with your new password.");
      navigate({ to: "/auth" });
    } catch (err) {
      console.error("[reset-password] unexpected", err);
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--brand-soft)]/40 px-3 py-6 sm:px-4 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center sm:mb-6"><Link to="/"><Logo /></Link></div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xl sm:rounded-3xl sm:p-8">
          <h1 className="mb-2 text-xl font-semibold">Set a new password</h1>
          <p className="mb-5 text-sm text-muted-foreground">Choose a new password for your account.</p>

          {!ready ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" /></div>
          ) : !sessionOk ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                This reset link is invalid or has expired. Request a new one to continue.
              </div>
              <Link to="/forgot-password" className="block">
                <Button className="brand-gradient h-11 w-full rounded-full text-base font-semibold text-white hover:opacity-95">
                  Request a new link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (pwError) setPwError(null); }}
                  required
                  aria-invalid={!!pwError}
                />
                {pwError && <p className="mt-1 text-sm text-destructive">{pwError}</p>}
              </div>
              <div>
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); if (confirmError) setConfirmError(null); }}
                  required
                  aria-invalid={!!confirmError}
                />
                {confirmError && <p className="mt-1 text-sm text-destructive">{confirmError}</p>}
              </div>
              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="brand-gradient h-11 w-full rounded-full text-base font-semibold text-white hover:opacity-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
