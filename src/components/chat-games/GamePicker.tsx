import { useState, useRef, useEffect } from "react";
import type { GameType } from "./types";
import { Dice1, Grid3X3, MessageCircle } from "lucide-react";

const GAMES: { type: GameType; label: string; Icon: typeof Dice1 }[] = [
  { type: "dice", label: "Dice", Icon: Dice1 },
  { type: "tic_tac_toe", label: "Tic-Tac-Toe", Icon: Grid3X3 },
  { type: "truth_or_dare", label: "Truth or Dare", Icon: MessageCircle },
];

interface GamePickerProps {
  onSelect: (type: GameType) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GamePicker({ onSelect, open, onOpenChange }: GamePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl z-50"
      style={{ animation: "msg-in 0.15s ease-out both" }}
    >
      <p className="px-2 py-1 text-xs text-muted-foreground mb-1">Play a game</p>
      {GAMES.map(({ type, label, Icon }) => (
        <button
          key={type}
          onClick={() => {
            onSelect(type);
            onOpenChange(false);
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Icon className="h-5 w-5 text-[var(--brand)]" />
          {label}
        </button>
      ))}
    </div>
  );
}