import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, LifeBuoy, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support & FAQ — 1Chance" },
      { name: "description", content: "Answers about matching, reporting and blocking, deleting your account, and staying safe while chatting on 1Chance." },
      { property: "og:title", content: "Support & FAQ — 1Chance" },
      { property: "og:description", content: "Help with matching, safety, reporting and account deletion on 1Chance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FAQS = [
  {
    q: "How does matching work?",
    a: "Tap “Find my match” and we add you to a live waiting pool. As soon as someone online is looking for a match that fits — and neither of you has blocked the other — we pair you up in a private 1-on-1 chat. Matching is random: you can't search for a specific person.",
  },
  {
    q: "What happens when I tap “Next”?",
    a: "The current chat ends for both people and you go straight back into the waiting pool for a fresh match. Ended chats can't be reopened, so swap contact details first if you want to stay in touch.",
  },
  {
    q: "How do I report or block someone?",
    a: "Open the menu in the chat header and choose Report or Block. Reporting sends the details to us for review; blocking ends the chat immediately and makes sure you're never matched with that person again.",
  },
  {
    q: "How do I delete my account?",
    a: "Email us from the address on your account using the button below with the subject “Delete my account”. We remove your profile, photo, chats and messages within 30 days. You can also clear your name, age and photo yourself at any time from the Profile page.",
  },
  {
    q: "Safety tips for chatting with strangers",
    a: "Never share your full name, address, workplace, school or financial details. Be cautious with photos. Nobody legitimate will ask you for money, gift cards or crypto. If a conversation feels off, end it — you're never obliged to keep chatting. Report anything that breaks the rules.",
  },
  {
    q: "Who can use 1Chance?",
    a: "You must be 18 or older. Accounts found to belong to minors are removed.",
  },
  {
    q: "Are my photos private?",
    a: "Photos you upload are stored privately and are only shown to you and the person you're currently chatting with, through short-lived secure links.",
  },
];

function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-12">
        <div className="text-center">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Support &amp; FAQ</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Everything about matching, safety and your account — and how to reach a human if you still need help.
          </p>
        </div>

        <section className="mt-10 rounded-3xl border border-border bg-card p-2 shadow-sm sm:p-4">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="px-3">
                <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Still need help?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Email us and we'll get back to you, usually within a couple of days.
            </p>
            <Button
              asChild
              className="brand-gradient mt-5 h-11 w-full rounded-full text-sm font-semibold text-white hover:opacity-95"
            >
              <a href="mailto:support@1chance.app?subject=1Chance%20support">support@1chance.app</a>
            </Button>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Urgent safety concern?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Block the person in chat first, then email us with the subject “Safety” so we can prioritise it.
            </p>
            <Button asChild variant="outline" className="mt-5 h-11 w-full rounded-full text-sm font-semibold">
              <a href="mailto:support@1chance.app?subject=Safety">Report a safety issue</a>
            </Button>
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          <Link to="/" className="story-link hover:text-foreground">Back to home</Link>
        </p>
      </main>
    </div>
  );
}
