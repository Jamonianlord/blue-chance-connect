import { DiceGame } from "./DiceGame";
import { TicTacToeGame } from "./TicTacToeGame";
import { TruthOrDareGame } from "./TruthOrDareGame";
import type { GameType } from "./types";

interface GameCardProps {
  gameType: GameType;
  state: Record<string, unknown>;
  currentUserId: string;
  onMove: (state: Record<string, unknown>) => void;
}

export function GameCard({ gameType, state, currentUserId, onMove }: GameCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
      {gameType === "dice" && <DiceGameInner state={state} currentUserId={currentUserId} onMove={onMove} />}
      {gameType === "tic_tac_toe" && <TicTacToeGameInner state={state} currentUserId={currentUserId} onMove={onMove} />}
      {gameType === "truth_or_dare" && <TruthOrDareGameInner state={state} currentUserId={currentUserId} onMove={onMove} />}
    </div>
  );
}

function DiceGameInner(props: Parameters<typeof DiceGame>[0]) {
  return <DiceGame {...props} />;
}
function TicTacToeGameInner(props: Parameters<typeof TicTacToeGame>[0]) {
  return <TicTacToeGame {...props} />;
}
function TruthOrDareGameInner(props: Parameters<typeof TruthOrDareGame>[0]) {
  return <TruthOrDareGame {...props} />;
}