import { Player } from '../models/types.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

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
  ): { type: 'player_match' | 'waiting'; waitingPlayer?: Player } {
    
    // 🔍 Check if there's already a waiting player
    const waitingEntry = Array.from(this.waitingPlayers.values())[0];
    
    if (waitingEntry && waitingEntry.player.id !== player.id) {
      // 🎯 MATCH FOUND!
      logger.info(`✅ MATCH FOUND: ${waitingEntry.player.username} vs ${player.username}`);
      
      // 🔥 CRITICAL: Clear timeout IMMEDIATELY
      clearTimeout(waitingEntry.timeout);
      
      // 🔥 CRITICAL: Remove from queue IMMEDIATELY  
      this.waitingPlayers.delete(waitingEntry.socketId);
      
      logger.info(`🧹 Removed ${waitingEntry.player.username} from matchmaking queue`);
      logger.info(`📊 Queue size after match: ${this.waitingPlayers.size}`);
      
      // 🔥 RETURN IMMEDIATELY - Don't add player2 to queue!
      return { 
        type: 'player_match', 
        waitingPlayer: waitingEntry.player 
      };
    }
    
    // 📝 No match found, add to queue
    logger.info(`➕ Adding ${player.username} to matchmaking queue`);
    
    // Set timeout for bot match
    const timeout = setTimeout(() => {
      // Check if player still in queue
      const entry = this.waitingPlayers.get(player.socketId);
      
      if (entry && onBotMatch) {
        // 🔥 Remove from queue BEFORE calling callback
        this.waitingPlayers.delete(player.socketId);
        
        logger.info(`⏰ Matchmaking timeout for ${player.username} - creating bot game`);
        logger.info(`📊 Queue size after timeout: ${this.waitingPlayers.size}`);
        
        onBotMatch(player);
      }
    }, config.game.matchmakingTimeout);
    
    // Add to queue with timeout
    this.waitingPlayers.set(player.socketId, { 
      player, 
      timeout,
      socketId: player.socketId 
    });
    
    logger.info(`⏳ ${player.username} waiting for opponent (${this.waitingPlayers.size} in queue)`);
    
    return { type: 'waiting' };
  }

  removePlayerFromQueue(socketId: string): void {
    const waitingEntry = this.waitingPlayers.get(socketId);
    
    if (waitingEntry) {
      clearTimeout(waitingEntry.timeout);
      this.waitingPlayers.delete(socketId);
      logger.info(`➖ Removed player from queue: ${waitingEntry.player.username}`);
      logger.info(`📊 Queue size: ${this.waitingPlayers.size}`);
    }
  }

  isPlayerInQueue(socketId: string): boolean {
    return this.waitingPlayers.has(socketId);
  }

  getQueueSize(): number {
    return this.waitingPlayers.size;
  }
}

export const matchmakingService = new MatchmakingService();