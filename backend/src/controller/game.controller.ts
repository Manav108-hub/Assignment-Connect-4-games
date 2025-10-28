import { Request, Response } from 'express';
import { gameService } from '../services/game.service.js';
import { logger } from '../utils/logger.js';

export class GameController {
  async getGameById(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      
      const game = gameService.getGame(gameId);
      
      if (!game) {
        res.status(404).json({ success: false, error: 'Game not found' });
        return;
      }

      res.json({ 
        success: true, 
        data: {
          id: game.id,
          board: game.board,
          status: game.status,
          currentTurn: game.currentTurn,
          winner: game.winner,
          createdAt: game.createdAt,
        }
      });
    } catch (error) {
      logger.error('Error fetching game:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch game' });
    }
  }

  async getActiveGames(req: Request, res: Response): Promise<void> {
    try {
      const games = gameService.getAllActiveGames();
      
      const gameData = games.map(game => ({
        id: game.id,
        status: game.status,
        player1: game.player1.username,
        player2: game.player2?.username || 'Waiting...',
        createdAt: game.createdAt,
      }));

      res.json({ success: true, data: gameData });
    } catch (error) {
      logger.error('Error fetching active games:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch games' });
    }
  }

  async getGameStats(req: Request, res: Response): Promise<void> {
    try {
      const games = gameService.getAllActiveGames();
      
      const stats = {
        activeGames: games.filter(g => g.status === 'active').length,
        waitingGames: games.filter(g => g.status === 'waiting').length,
        totalGames: games.length,
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error fetching game stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  }
}

export const gameController = new GameController();