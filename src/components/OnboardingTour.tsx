import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Users, MessageCircle, ShieldCheck, X } from "lucide-react";

const ONBOARDING_KEY = "1chance_onboarding_seen";

type Slide = {
  icon: typeof User;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    icon: User,
    title: "Set up your profile",
    description:
      "Add your name, age, gender, and a few interests. This is what helps break the ice once you're matched.",
  },
  {
    icon: Users,
    title: "Get matched instantly",
    description:
      "Hit \"Find a match\" and we'll pair you with someone of the opposite gender who's online right now.",
  },
  {
    icon: MessageCircle,
    title: "Chat in real time",
    description:
      "Talk freely, share photos, and see when your match is online. Conversations are private between you two.",
  },
  {
    icon: ShieldCheck,
    title: "Stay safe",
    description:
      "If a chat feels off, you can report or block anyone in one tap. We take safety seriously — never share personal details you're not comfortable with.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) setOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const next = () => {
    if (step < SLIDES.length - 1) {
      setStep((s) => s + 1);
    } else {
      close();
    }
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!open) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)]">
            <Icon className="h-7 w-7 text-[var(--brand)]" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">{slide.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{slide.description}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === step ? "w-6 bg-[var(--brand)]" : "w-1.5 bg-border")
              }
            />
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <Button variant="outline" className="h-11 flex-1 rounded-full" onClick={back}>
              Back
            </Button>
          )}
          <Button className="brand-gradient h-11 flex-1 rounded-full text-white" onClick={next}>
            {isLast ? "Get started" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}