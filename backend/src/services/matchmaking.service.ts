import { v4 as uuidv4 } from 'uuid';
import { Player } from '../models/types';
import { gameService } from './game.service';
import { config } from '../config/env';
import { logger } from '../utils/logger';

interface WaitingPlayer {
  player: Player;
  timeout: NodeJS.Timeout;
  socketId: string;
}

class MatchmakingService {
  private waitingPlayers: Map<string, WaitingPlayer> = new Map();

  addPlayerToQueue(
    player: Player, 
    onBotMatch?: (player: Player) => void
  ): { type: 'player_match' | 'waiting' | null; waitingPlayer?: Player } {
    // Check if there's already a waiting player
    const waitingEntry = Array.from(this.waitingPlayers.values())[0];

    if (waitingEntry && waitingEntry.player.id !== player.id) {
      // Match found! Clear timeout and return both players
      clearTimeout(waitingEntry.timeout);
      this.waitingPlayers.delete(waitingEntry.socketId);

      logger.info(`✅ Matched players: ${waitingEntry.player.username} vs ${player.username}`);
      
      return { 
        type: 'player_match', 
        waitingPlayer: waitingEntry.player 
      };
    }

    // No match found, add to queue and set timeout for bot
    const timeout = setTimeout(() => {
      const entry = this.waitingPlayers.get(player.socketId);
      if (entry && onBotMatch) {
        this.waitingPlayers.delete(player.socketId);
        logger.info(`⏰ Timeout reached for ${player.username}, calling bot match callback`);
        onBotMatch(player);
      }
    }, config.game.matchmakingTimeout);

    this.waitingPlayers.set(player.socketId, { 
      player, 
      timeout,
      socketId: player.socketId 
    });
    
    logger.info(`➕ Player ${player.username} added to matchmaking queue`);
    return { type: 'waiting' };
  }

  removePlayerFromQueue(socketId: string): void {
    const waitingEntry = this.waitingPlayers.get(socketId);
    if (waitingEntry) {
      clearTimeout(waitingEntry.timeout);
      this.waitingPlayers.delete(socketId);
      logger.info(`➖ Player removed from matchmaking queue`);
    }
  }

  isPlayerInQueue(socketId: string): boolean {
    return this.waitingPlayers.has(socketId);
  }
}

export const matchmakingService = new MatchmakingService();