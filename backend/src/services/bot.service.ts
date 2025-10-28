import { CellValue } from '../models/types.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

class BotService {
  /**
   * Determines the best move for the bot using strategic analysis
   * with some randomness to feel more human-like
   */
  getBestMove(board: CellValue[][], botPiece: 'player1' | 'player2'): number {
    const opponentPiece: CellValue = botPiece === 'player1' ? 'player2' : 'player1';

    // Priority 1: Win if possible (95% chance to take it)
    for (let col = 0; col < config.game.cols; col++) {
      if (this.canPlacePiece(board, col)) {
        const row = this.getLowestEmptyRow(board, col);
        if (this.wouldWin(board, row, col, botPiece)) {
          // 95% chance to take winning move (5% chance to miss it - more human!)
          if (Math.random() > 0.05) {
            logger.debug(`Bot choosing winning move: column ${col}`);
            return col;
          }
        }
      }
    }

    // Priority 2: Block opponent's winning move (90% chance)
    for (let col = 0; col < config.game.cols; col++) {
      if (this.canPlacePiece(board, col)) {
        const row = this.getLowestEmptyRow(board, col);
        if (this.wouldWin(board, row, col, opponentPiece)) {
          // 90% chance to block (10% chance to miss - makes it beatable!)
          if (Math.random() > 0.10) {
            logger.debug(`Bot blocking opponent at column ${col}`);
            return col;
          }
        }
      }
    }

    // Priority 3: Create opportunities (look for moves that create 3 in a row)
    const opportunityMoves: number[] = [];
    for (let col = 0; col < config.game.cols; col++) {
      if (this.canPlacePiece(board, col)) {
        const row = this.getLowestEmptyRow(board, col);
        if (this.createsThreeInRow(board, row, col, botPiece)) {
          opportunityMoves.push(col);
        }
      }
    }

    // Sometimes choose from opportunity moves with randomness
    if (opportunityMoves.length > 0 && Math.random() > 0.2) {
      const randomChoice = opportunityMoves[Math.floor(Math.random() * opportunityMoves.length)];
      logger.debug(`Bot creating opportunity at column ${randomChoice}`);
      return randomChoice;
    }

    // Priority 4: Play center column if available (70% of the time)
    const centerCol = Math.floor(config.game.cols / 2);
    if (this.canPlacePiece(board, centerCol) && Math.random() > 0.3) {
      logger.debug(`Bot choosing center column ${centerCol}`);
      return centerCol;
    }

    // Priority 5: Choose near center with some randomness
    const validMoves = this.getValidMoves(board);
    
    // Add weighted randomness - prefer center but allow variety
    const weights = validMoves.map(col => {
      const distanceFromCenter = Math.abs(col - centerCol);
      // Closer to center = higher weight, but not too deterministic
      return Math.max(1, 5 - distanceFromCenter) * (0.7 + Math.random() * 0.6);
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < validMoves.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        logger.debug(`Bot choosing strategic column ${validMoves[i]}`);
        return validMoves[i];
      }
    }

    // Fallback: totally random valid move
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    logger.debug(`Bot choosing random fallback column ${randomMove}`);
    return randomMove;
  }

  private canPlacePiece(board: CellValue[][], col: number): boolean {
    return board[0][col] === 'empty';
  }

  private getLowestEmptyRow(board: CellValue[][], col: number): number {
    for (let row = config.game.rows - 1; row >= 0; row--) {
      if (board[row][col] === 'empty') {
        return row;
      }
    }
    return -1;
  }

  private getValidMoves(board: CellValue[][]): number[] {
    const moves: number[] = [];
    for (let col = 0; col < config.game.cols; col++) {
      if (this.canPlacePiece(board, col)) {
        moves.push(col);
      }
    }
    return moves;
  }

  private wouldWin(
    board: CellValue[][],
    row: number,
    col: number,
    piece: CellValue
  ): boolean {
    // Temporarily place the piece
    const originalValue = board[row][col];
    board[row][col] = piece;

    // Check if this creates a win
    const isWin =
      this.checkDirection(board, row, col, 0, 1, piece) || // horizontal
      this.checkDirection(board, row, col, 1, 0, piece) || // vertical
      this.checkDirection(board, row, col, 1, 1, piece) || // diagonal /
      this.checkDirection(board, row, col, 1, -1, piece); // diagonal \

    // Restore original value
    board[row][col] = originalValue;

    return isWin;
  }

  private createsThreeInRow(
    board: CellValue[][],
    row: number,
    col: number,
    piece: CellValue
  ): boolean {
    // Temporarily place the piece
    const originalValue = board[row][col];
    board[row][col] = piece;

    // Check if this creates 3 in a row
    const hasThree =
      this.countInDirection(board, row, col, 0, 1, piece) >= 3 || // horizontal
      this.countInDirection(board, row, col, 1, 0, piece) >= 3 || // vertical
      this.countInDirection(board, row, col, 1, 1, piece) >= 3 || // diagonal /
      this.countInDirection(board, row, col, 1, -1, piece) >= 3; // diagonal \

    // Restore original value
    board[row][col] = originalValue;

    return hasThree;
  }

  private checkDirection(
    board: CellValue[][],
    row: number,
    col: number,
    deltaRow: number,
    deltaCol: number,
    piece: CellValue
  ): boolean {
    return this.countInDirection(board, row, col, deltaRow, deltaCol, piece) >= 4;
  }

  private countInDirection(
    board: CellValue[][],
    row: number,
    col: number,
    deltaRow: number,
    deltaCol: number,
    piece: CellValue
  ): number {
    let count = 1;

    // Check positive direction
    let r = row + deltaRow;
    let c = col + deltaCol;
    while (
      r >= 0 &&
      r < config.game.rows &&
      c >= 0 &&
      c < config.game.cols &&
      board[r][c] === piece
    ) {
      count++;
      r += deltaRow;
      c += deltaCol;
    }

    // Check negative direction
    r = row - deltaRow;
    c = col - deltaCol;
    while (
      r >= 0 &&
      r < config.game.rows &&
      c >= 0 &&
      c < config.game.cols &&
      board[r][c] === piece
    ) {
      count++;
      r -= deltaRow;
      c -= deltaCol;
    }

    return count;
  }
}

export const botService = new BotService();