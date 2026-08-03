import { useState, useEffect, useCallback } from "react";

interface DiceGameProps {
  state: Record<string, unknown>;
  currentUserId: string;
  onMove: (state: Record<string, unknown>) => void;
}

interface RollEntry {
  user_id: string;
  value: number;
  at: string;
}

export function DiceGame({ state, currentUserId, onMove }: DiceGameProps) {
  const [rolling, setRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const rolls = (state.rolls as RollEntry[] | undefined) ?? [];
  const lastRoll = rolls[rolls.length - 1];

  useEffect(() => {
    if (lastRoll) setDisplayValue(lastRoll.value);
  }, [lastRoll]);

  const roll = useCallback(async () => {
    if (rolling) return;
    setRolling(true);
    setDisplayValue(null);
    const totalDuration = 600;
    const interval = 60;
    const steps = totalDuration / interval;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      if (step >= steps) {
        clearInterval(timer);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDisplayValue(finalValue);
        setRolling(false);
        onMove({
          rolls: [
            ...rolls,
            { user_id: currentUserId, value: finalValue, at: new Date().toISOString() },
          ],
        });
      }
    }, interval);
    return () => clearInterval(timer);
  }, [rolling, currentUserId, onMove, rolls]);

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex items-center justify-center h-16 w-16 rounded-xl border-2 border-[var(--brand)] bg-[var(--brand-soft)] text-2xl font-extrabold text-[var(--brand)]">
        {displayValue ?? "?"}
      </div>
      <button
        onClick={roll}
        disabled={rolling}
        className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
      >
        {rolling ? "Rolling…" : "Roll"}
      </button>
      {rolls.length > 0 && (
        <div className="flex gap-1.5 text-[10px] text-muted-foreground">
          {rolls.slice(-5).map((r, i) => (
            <span
              key={i}
              className={`rounded-full px-2 py-0.5 ${r.user_id === currentUserId ? "bg-[var(--brand)]/10 text-[var(--brand)]" : "bg-muted"}`}
            >
              {r.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}