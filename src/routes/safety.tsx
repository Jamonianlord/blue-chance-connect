import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { ShieldCheck, Lock, Clock, UserCheck, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/safety")({
  component: SafetyPage,
  head: () => ({
    meta: [
      { title: "Safety - 1Chance" },
      { name: "description", content: "Your safety comes first on 1Chance. Learn how we keep you in control." },
      { property: "og:title", content: "Your safety comes first — 1Chance" },
      { property: "og:description", content: "Match with confidence. Block, report, and stay anonymous by default." },
    ],
  }),
});

const safetyFeatures = [
  { icon: ShieldCheck, title: "Report & Block", body: "Anyone can be reported or blocked instantly, from any chat. No explanation needed." },
  { icon: Lock, title: "Anonymous by Default", body: "You're matched without sharing your identity upfront. You choose what to reveal, and when." },
  { icon: Clock, title: "No Permanent Trace", body: "Conversations aren't searchable or public. What happens in a chat stays there." },
  { icon: UserCheck, title: "You're Always in Control", body: "Leave a chat anytime, no penalty, no notification sent to the other person." },
];

export function SafetyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <section className="text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your safety comes first
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            1Chance is built so you can meet someone new without giving up control.
          </p>
        </section>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {safetyFeatures.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card-hover-glow rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">Tips for staying safe</h2>
          <ul className="mt-4 list-disc space-y-2 text-sm text-muted-foreground pl-5">
            <li>Never share financial information, passwords, or payment details with someone you've just matched with</li>
            <li>If a conversation feels off, trust that instinct — block first, ask questions never</li>
            <li>Avoid moving to other platforms with someone before you're comfortable</li>
            <li>Report immediately if someone pressures you, asks for money, or won't take no for an answer</li>
          </ul>
        </section>

        <section className="mt-16 border-t border-border pt-8 text-center">
          <p className="text-muted-foreground">
            See something that shouldn't be here?
          </p>
          <a
            href="mailto:support@1chance.online"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-base font-semibold text-white hover:opacity-95"
          >
            Report a concern
            <ExternalLink className="h-4 w-4" />
          </a>
        </section>
      </main>
    </div>
  );
}
