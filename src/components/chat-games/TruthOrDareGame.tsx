import { useState, useCallback } from "react";

const TRUTH_PROMPTS = [
  "What's a secret talent no one knows about?",
  "What's the weirdest dream you've ever had?",
  "What's the most trouble you got into as a kid?",
  "What's a movie you love that everyone else hates?",
  "What's the cringiest thing you've ever posted online?",
  "What's your biggest irrational fear?",
  "What's a song you know all the lyrics to?",
  "What's the most ridiculous rumor you've ever heard about yourself?",
  "What's a hobby you'd never admit to having?",
  "What's the worst fashion choice you've ever made?",
  "What's something you believed as a kid that was totally wrong?",
  "What's the most childish thing you still do?",
  "What's a food combination you secretly love?",
  "What's the most interesting place you've ever been?",
  "What's a skill you wish you had?",
  "What's the kindest thing a stranger has ever done for you?",
  "What's a rule you always break?",
  "What's the most spontaneous thing you've ever done?",
  "What's something you've done that you'd never tell your parents?",
];

const DARE_PROMPTS = [
  "Send a selfie making your silliest face right now.",
  "Text someone you haven't talked to in a year.",
  "Sing the chorus of your favorite song out loud.",
  "Do 10 jumping jacks and report back.",
  "Change your display name to something funny for the next hour.",
  "Tell us your most embarrassing childhood nickname.",
  "Do your best impression of a celebrity.",
  "Post a screenshot of your camera roll's last photo.",
  "Send a voice note saying something nice to the other person.",
  "Try to lick your elbow and tell us if you succeeded.",
  "Write a haiku about this conversation.",
  "Dance for 15 seconds with no music.",
  "Tell us the most trouble you ever got in at school.",
  "Do your best animal impression.",
  "Send a screenshot of your most-played song this week.",
  "Say three nice things about the other person.",
  "Take a photo of whatever you're looking at right now and send it.",
  "Tell us your biggest pet peeve.",
  "Pretend you're a tour guide for the room you're in.",
  "Do your best impression of a famous movie scene.",
];

function pickRandom<T>(arr: T[], used: number[]): { value: T; index: number } | null {
  const available = arr.map((_, i) => i).filter((i) => !used.includes(i));
  if (available.length === 0) return null;
  const chosen = available[Math.floor(Math.random() * available.length)];
  return { value: arr[chosen], index: chosen };
}

interface TruthOrDareGameProps {
  state: Record<string, unknown>;
  currentUserId: string;
  onMove: (state: Record<string, unknown>) => void;
}

export function TruthOrDareGame({ state, currentUserId, onMove }: TruthOrDareGameProps) {
  const promptsUsed = (state.prompts_used as { type: string; index: number }[] | undefined) ?? [];
  const current = state.current as { type: string; text: string; for_user_id: string } | undefined;
  const createdById = state.created_by as string | undefined;
  const isMyTurnToPick = !current && !state.status || (current && current.for_user_id === currentUserId);

  const pick = useCallback(
    (type: "truth" | "dare") => {
      const pool = type === "truth" ? TRUTH_PROMPTS : DARE_PROMPTS;
      const usedForType = promptsUsed.filter((p) => p.type === type).map((p) => p.index);
      const picked = pickRandom(pool, usedForType);
      if (!picked) {
        onMove({
          ...state,
          prompts_used: [],
          current: { type, text: pool[0], for_user_id: createdById === currentUserId ? (state as Record<string, unknown>).opponent_id! : createdById! },
        });
        return;
      }
      onMove({
        ...state,
        prompts_used: [...promptsUsed, { type, index: picked.index }],
        current: {
          type,
          text: picked.value,
          for_user_id: createdById === currentUserId ? (state as Record<string, unknown>).opponent_id! : createdById!,
        },
      });
    },
    [currentUserId, createdById, promptsUsed, state, onMove]
  );

  const doneViewing = useCallback(() => {
    onMove({
      ...state,
      current: null,
    });
  }, [state, onMove]);

  const gameOver = state.status === "completed";

  if (gameOver) {
    return (
      <div className="flex flex-col items-center gap-2 py-3">
        <p className="text-sm font-medium text-muted-foreground">Game completed</p>
      </div>
    );
  }

  if (current) {
    const isForMe = current.for_user_id === currentUserId;
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${current.type === "truth" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"}`}>
          {current.type === "truth" ? "🤔 Truth" : "🔥 Dare"}
        </span>
        <p className="text-sm text-center font-medium">{current.text}</p>
        {isForMe && (
          <button
            onClick={doneViewing}
            className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95"
          >
            Done
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <p className="text-xs text-muted-foreground">{isMyTurnToPick ? "Pick one:" : "Waiting for other player…"}</p>
      <div className="flex gap-2">
        <button
          onClick={() => pick("truth")}
          disabled={!isMyTurnToPick}
          className="rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          Truth
        </button>
        <button
          onClick={() => pick("dare")}
          disabled={!isMyTurnToPick}
          className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          Dare
        </button>
      </div>
    </div>
  );
}