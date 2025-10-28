export type CellValue = 'empty' | 'player1' | 'player2';
export type PlayerNumber = 'player1' | 'player2';
export type GameStatus = 'active' | 'finished';

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  gameId: string;
  playerId: string;
  playerNumber: PlayerNumber; // ✅ ADDED: Stores which player we are
  opponent: string;
  isVsBot: boolean;
  board: CellValue[][];
  currentTurn: PlayerNumber;
  myTurn: boolean;
  status: GameStatus;
  winner: string | null;
  isDraw: boolean;
}

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  draws: number;
}