import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password \u2014 1Chance" },
      { name: "description", content: "Request a password reset link for your 1Chance account." },
      { property: "og:title", content: "Reset password \u2014 1Chance" },
      { property: "og:description", content: "Get a password reset link for your 1Chance account." },
    ],
  }),
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error: rErr } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (rErr) {
        console.error("[forgot-password] error", rErr);
        setError(rErr.message);
        return;
      }
      setSent(true);
      toast.success("Reset link sent — check your email.");
    } catch (err) {
      console.error("[forgot-password] unexpected", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--brand-soft)]/40 px-3 py-6 sm:px-4 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center sm:mb-6"><Link to="/"><Logo /></Link></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xl sm:rounded-3xl sm:p-8">
          <h1 className="mb-2 text-xl font-semibold">Forgot your password?</h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Enter the email you signed up with and we'll send you a reset link.
          </p>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-[var(--brand-soft)]/40 p-4 text-sm">
                If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way. It can take a minute or two — check spam too.
              </div>
              <Link to="/auth" className="block">
                <Button variant="outline" className="h-11 w-full rounded-full">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (error) setError(null); }}
                  required
                  aria-invalid={!!error}
                />
                {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="brand-gradient h-11 w-full rounded-full text-base font-semibold text-white hover:opacity-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
              <div className="text-center text-sm">
                <Link to="/auth" className="text-[var(--brand)] hover:underline">Back to sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
