export type CellValue = 'empty' | 'player1' | 'player2';

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  gameId: string;
  playerId: string;
  opponent: string;
  isVsBot: boolean;
  board: CellValue[][];
  currentTurn: 'player1' | 'player2';
  myTurn: boolean;
  status: 'waiting' | 'active' | 'finished';
  winner: string | null;
  isDraw: boolean;
}

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: string;
}