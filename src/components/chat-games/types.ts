export type GameType = "dice" | "truth_or_dare" | "tic_tac_toe";

export interface GameMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  message_type: string;
  game_id: string | null;
  game?: {
    id: string;
    game_type: GameType;
    state: Record<string, unknown>;
    status: string;
    created_by: string;
    result: Record<string, unknown> | null;
  } | null;
}