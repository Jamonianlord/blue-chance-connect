import { useState, useCallback } from "react";

interface TicTacToeGameProps {
  state: Record<string, unknown>;
  currentUserId: string;
  onMove: (state: Record<string, unknown>) => void;
}

type CellValue = null | "X" | "O";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: CellValue[]): { winner: "X" | "O" | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a]!, line };
    }
  }
  if (board.every((c) => c !== null)) return { winner: null, line: null };
  return { winner: null, line: null };
}

export function TicTacToeGame({ state, currentUserId, onMove }: TicTacToeGameProps) {
  const board = (state.board as CellValue[] | undefined) ?? Array(9).fill(null);
  const turnUserId = state.turn as string | undefined;
  const winner = state.winner as string | null | undefined;
  const creatorId = state.created_by as string | undefined;
  const gameOver = state.status === "completed";

  const myMark = creatorId === currentUserId ? "X" : "O";
  const isMyTurn = !gameOver && turnUserId === currentUserId;

  const handleCell = useCallback(
    (index: number) => {
      if (board[index] || gameOver || !isMyTurn) return;
      const newBoard = [...board] as CellValue[];
      newBoard[index] = myMark;
      const { winner: w, line } = checkWinner(newBoard);
      const nextState: Record<string, unknown> = {
        ...state,
        board: newBoard,
        turn: turnUserId === currentUserId ? (creatorId === currentUserId ? (state as Record<string, unknown>).opponent_id : creatorId) : currentUserId,
      };
      if (w) {
        nextState.winner = w;
        nextState.status = "completed";
        nextState.result = { winner: w, line };
      } else if (newBoard.every((c) => c !== null)) {
        nextState.status = "completed";
        nextState.result = { winner: "draw" };
      }
      onMove(nextState);
    },
    [board, gameOver, isMyTurn, myMark, currentUserId, creatorId, onMove, state, turnUserId]
  );

  const playAgain = useCallback(() => {
    onMove({
      board: Array(9).fill(null),
      turn: creatorId,
      created_by: creatorId,
      opponent_id: creatorId === currentUserId ? (state as Record<string, unknown>).opponent_id : creatorId,
      status: "active",
      winner: null,
      result: null,
    });
  }, [creatorId, currentUserId, onMove, state]);

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winner && (state.result as { line?: number[] } | null)?.line?.includes(index);
    return (
      <button
        key={index}
        onClick={() => handleCell(index)}
        disabled={!!value || gameOver || !isMyTurn}
        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-colors sm:h-12 sm:w-12 sm:text-base ${
          value === "X"
            ? "bg-[var(--brand)] text-white"
            : value === "O"
              ? "bg-muted text-foreground"
              : "bg-muted/50 hover:bg-muted"
        } ${isWinningCell ? "ring-2 ring-green-400" : ""}`}
      >
        {value ?? ""}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="grid grid-cols-3 gap-1.5">
        {Array(9)
          .fill(0)
          .map((_, i) => renderCell(i))}
      </div>
      {gameOver ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {winner ? (winner === myMark ? "You won!" : "You lost") : "Draw!"}
          </p>
          <button
            onClick={playAgain}
            className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95"
          >
            Play again
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{isMyTurn ? "Your turn" : `${myMark === "X" ? "O" : "X"}'s turn`}</p>
      )}
    </div>
  );
}