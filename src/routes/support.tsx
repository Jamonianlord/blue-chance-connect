import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support & FAQ — 1Chance" },
      { name: "description", content: "Reach out for help or find answers to common questions about 1Chance." },
      { property: "og:title", content: "Need a hand? — 1Chance Support" },
      { property: "og:description", content: "Contact us about matching, safety, account deletion, and more." },
    ],
  }),
});

const FAQS = [
  {
    q: "What is 1Chance?",
    a: "A place to get matched instantly with someone new and start a real conversation — no profiles to scroll, no swiping.",
  },
  {
    q: "Is my identity shared with my match?",
    a: "No. You stay anonymous unless you choose to share more.",
  },
  {
    q: "How do I report or block someone?",
    a: "Inside any chat, tap the menu icon and choose Report or Block — it's instant and no explanation is needed.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes — email us at cheapbrosgang@gmail.com and we'll take care of it.",
  },
  {
    q: "I found a bug — where do I report it?",
    a: "Same email — cheapbrosgang@gmail.com — tell us what happened and we'll look into it.",
  },
];

function SupportPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <section className="text-center">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Need a hand?</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Reach out and we'll get back to you as soon as we can.
          </p>
        </section>

        <section className="mt-12">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Email us at</h2>
            <a
              href="mailto:cheapbrosgang@gmail.com"
              className="brand-gradient mt-4 inline-flex h-11 items-center justify-center rounded-full text-base font-semibold text-white hover:opacity-95"
            >
              cheapbrosgang@gmail.com
            </a>
            <p className="mt-3 text-sm text-muted-foreground">
              We typically respond within 24-48 hours.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">FAQs</h2>
          <Accordion type="single" collapsible className="mt-6 w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-border px-3">
                <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            Need more help? Read our{" "}
            <Link to="/safety" className="text-[var(--brand)] hover:underline">Safety</Link>,{" "}
            <Link to="/terms" className="text-[var(--brand)] hover:underline">Terms</Link>,{" "}
            and <Link to="/privacy" className="text-[var(--brand)] hover:underline">Privacy</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
