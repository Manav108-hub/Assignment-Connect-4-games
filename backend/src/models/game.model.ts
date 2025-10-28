import { CellValue, GameStatus } from './types.js';

export class GameModel {
  id: string;
  player1Id: string;
  player2Id: string | null;
  winnerId: string | null;
  board: CellValue[][];
  status: GameStatus;
  currentTurn: 'player1' | 'player2';
  createdAt: Date;
  lastMoveAt: Date;
  isVsBot: boolean;

  constructor(
    id: string,
    player1Id: string,
    rows: number = 6,
    cols: number = 7
  ) {
    this.id = id;
    this.player1Id = player1Id;
    this.player2Id = null;
    this.winnerId = null;
    this.board = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill('empty'));
    this.status = 'waiting';
    this.currentTurn = 'player1';
    this.createdAt = new Date();
    this.lastMoveAt = new Date();
    this.isVsBot = false;
  }

  addPlayer2(player2Id: string, isBot: boolean = false): void {
    this.player2Id = player2Id;
    this.status = 'active';
    this.isVsBot = isBot;
  }

  setWinner(winnerId: string): void {
    this.winnerId = winnerId;
    this.status = 'completed';
  }

  setDraw(): void {
    this.status = 'completed';
  }

  forfeit(playerId: string): void {
    this.status = 'forfeited';
    this.winnerId = playerId === this.player1Id ? this.player2Id : this.player1Id;
  }

  switchTurn(): void {
    this.currentTurn = this.currentTurn === 'player1' ? 'player2' : 'player1';
    this.lastMoveAt = new Date();
  }
}