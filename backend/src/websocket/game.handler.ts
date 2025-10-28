import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { gameService } from '../services/game.service';
import { matchmakingService } from '../services/matchmaking.service';
import { botService } from '../services/bot.service';
import { analyticsService } from '../services/analytic.service';
import { prisma } from '../config/database';
import { Player } from '../models/types';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { Validator } from '../utils/validations';

export class GameHandler {
  private io: Server;
  private processingMoves: Set<string> = new Set(); // 🔒 Prevent double moves

  constructor(io: Server) {
    this.io = io;
  }

  handleConnection(socket: Socket): void {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('find_match', (data: { username: string }) =>
      this.handleFindMatch(socket, data)
    );

    socket.on('make_move', (data: { gameId: string; column: number }) =>
      this.handleMakeMove(socket, data)
    );

    socket.on('rejoin_game', (data: { gameId: string; playerId: string }) =>
      this.handleRejoinGame(socket, data)
    );

    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  private async handleFindMatch(
    socket: Socket,
    data: { username: string }
  ): Promise<void> {
    try {
      const { username } = data;

      // Validate username
      const usernameValidation = Validator.isValidUsername(username);
      if (!usernameValidation.valid) {
        socket.emit('error', { message: usernameValidation.error });
        return;
      }

      // Get or create player
      let player = await prisma.player.findUnique({ where: { username } });
      if (!player) {
        player = await prisma.player.create({ data: { username } });
      }

      const playerObj: Player = {
        id: player.id,
        username: player.username,
        socketId: socket.id,
        isBot: false,
      };

      // Define bot match callback
      const handleBotMatch = async (player: Player) => {
        logger.info(`🤖 Creating bot game for ${player.username}`);

        // Create bot player
        const bot: Player = {
          id: uuidv4(),
          username: 'Bot',
          socketId: 'bot-' + Date.now(),
          isBot: true,
        };

        // Create game with bot
        const botGame = gameService.createGame(player);
        gameService.joinGame(botGame.id, bot);

        // Join socket room
        socket.join(botGame.id);

        // Emit game_found to the player
        socket.emit('game_found', {
          gameId: botGame.id,
          playerId: player.id,
          opponent: 'Bot',
          isVsBot: true,
          currentTurn: botGame.currentTurn,
          playerNumber: 'player1', // Always player1 vs bot
        });

        logger.info(`✅ Bot game started: ${botGame.id} - ${player.username} vs Bot`);

        // Send analytics
        await analyticsService.gameStarted(
          botGame.id,
          botGame.player1.username,
          'Bot',
          true
        );

        // If it's bot's turn at start (shouldn't happen, but just in case)
        setTimeout(() => {
          const currentGame = gameService.getGame(botGame.id);
          if (!currentGame || currentGame.status !== 'active') return;

          // Bot is always player2, so check if it's player2's turn
          if (currentGame.currentTurn === 'player2') {
            logger.info(`🤖 Making initial bot move for game ${botGame.id}`);
            this.makeBotMove(botGame.id);
          }
        }, 1000);
      };

      // Try to match with another player
      const matchResult = matchmakingService.addPlayerToQueue(playerObj, handleBotMatch);

      if (matchResult.type === 'player_match' && matchResult.waitingPlayer) {
        // PLAYER VS PLAYER MATCH!
        const player1 = matchResult.waitingPlayer;
        const player2 = playerObj;

        logger.info(`🎮 Matched: ${player1.username} vs ${player2.username}`);
        
        // Add 2-second delay for better UX (feels more natural)
        setTimeout(async () => {
          // Create game
          const game = gameService.createGame(player1);
          gameService.joinGame(game.id, player2);

          // ✅ FIX: Both players join the socket room
          const player1Socket = this.io.sockets.sockets.get(player1.socketId);
          if (player1Socket) {
            player1Socket.join(game.id);
            logger.info(`✅ Player1 ${player1.username} joined room ${game.id}`);
          } else {
            logger.error(`❌ Could not find socket for player1: ${player1.socketId}`);
          }

          socket.join(game.id);
          logger.info(`✅ Player2 ${player2.username} joined room ${game.id}`);

          // Emit to player 1 (who was waiting)
          this.io.to(player1.socketId).emit('game_found', {
            gameId: game.id,
            playerId: player1.id,
            opponent: player2.username,
            isVsBot: false,
            currentTurn: game.currentTurn,
            playerNumber: 'player1',
          });

          // Emit to player 2 (who just joined)
          socket.emit('game_found', {
            gameId: game.id,
            playerId: player2.id,
            opponent: player1.username,
            isVsBot: false,
            currentTurn: game.currentTurn,
            playerNumber: 'player2',
          });

          logger.info(`✅ PvP game started: ${game.id} - ${player1.username} vs ${player2.username}`);
          logger.info(`🎯 First turn: ${game.currentTurn}`);

          // Send analytics
          await analyticsService.gameStarted(
            game.id,
            player1.username,
            player2.username,
            false
          );
        }, 2000); // 2-second delay for matchmaking feel

      } else if (matchResult.type === 'waiting') {
        // Waiting for opponent or bot
        socket.emit('waiting_for_opponent');
        logger.info(`⏳ ${username} waiting for opponent...`);
      }
    } catch (error) {
      logger.error('Error in handleFindMatch:', error);
      socket.emit('error', { message: 'Failed to find match' });
    }
  }

  private async handleMakeMove(
    socket: Socket,
    data: { gameId: string; column: number }
  ): Promise<void> {
    const { gameId, column } = data;
    
    // 🔒 Prevent concurrent moves on same game
    const lockKey = `${gameId}-move`;
    if (this.processingMoves.has(lockKey)) {
      logger.warn(`⚠️ Move already being processed for game ${gameId}`);
      socket.emit('error', { message: 'Please wait, processing previous move' });
      return;
    }

    this.processingMoves.add(lockKey);

    try {
      // Validate column
      const columnValidation = Validator.isValidColumn(column);
      if (!columnValidation.valid) {
        socket.emit('error', { message: columnValidation.error });
        return;
      }

      // Validate game ID
      const gameIdValidation = Validator.isValidGameId(gameId);
      if (!gameIdValidation.valid) {
        socket.emit('error', { message: gameIdValidation.error });
        return;
      }

      const game = gameService.getGame(gameId);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.status !== 'active') {
        socket.emit('error', { message: 'Game is not active' });
        return;
      }

      // Find which player is making the move
      const player = game.player1.socketId === socket.id 
        ? game.player1 
        : game.player2?.socketId === socket.id 
        ? game.player2 
        : null;

      if (!player) {
        socket.emit('error', { message: 'Player not found in game' });
        return;
      }

      // 🔒 CRITICAL: Check if it's this player's turn
      const playerNumber = game.player1.id === player.id ? 'player1' : 'player2';
      if (game.currentTurn !== playerNumber) {
        logger.warn(`❌ Not ${player.username}'s turn. Current turn: ${game.currentTurn}, Player: ${playerNumber}`);
        socket.emit('error', { message: 'Not your turn!' });
        return;
      }

      logger.info(`🎯 ${player.username} (${playerNumber}) making move at column ${column}`);

      // Determine who made the move BEFORE turn switches
      const playerWhoMoved = playerNumber;

      const result = gameService.makeMove(gameId, player.id, column);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      logger.info(`✅ Move successful! Next turn: ${game.currentTurn}`);

      // ✅ Emit to ALL players in the room
      this.io.to(gameId).emit('move_made', {
        position: result.position,
        player: playerWhoMoved,
        nextTurn: game.currentTurn,
        board: game.board,
      });

      await analyticsService.moveMade(gameId, player.id, result.position!);

      // Check for game end
      if (result.winner || result.isDraw) {
        await this.handleGameEnd(game, result.winner, result.isDraw);
      } else {
        // If opponent is bot and it's bot's turn, make bot move
        const opponent = player.id === game.player1.id ? game.player2 : game.player1;
        if (opponent?.isBot) {
          setTimeout(() => this.makeBotMove(gameId), 500);
        }
      }
    } catch (error) {
      logger.error('Error in handleMakeMove:', error);
      socket.emit('error', { message: 'Failed to make move' });
    } finally {
      // 🔓 Release lock after processing
      this.processingMoves.delete(lockKey);
    }
  }

  private async makeBotMove(gameId: string): Promise<void> {
    const game = gameService.getGame(gameId);
    if (!game || game.status !== 'active') return;

    const bot = game.player2?.isBot ? game.player2 : game.player1.isBot ? game.player1 : null;
    if (!bot) return;

    const botPiece = bot.id === game.player1.id ? 'player1' : 'player2';
    
    // Check if it's actually bot's turn
    if (game.currentTurn !== botPiece) {
      logger.warn(`⚠️ Tried to make bot move but it's not bot's turn. Current: ${game.currentTurn}`);
      return;
    }

    const column = botService.getBestMove(game.board, botPiece);

    logger.info(`🤖 Bot making move at column ${column}`);

    const result = gameService.makeMove(gameId, bot.id, column);

    if (result.success) {
      this.io.to(gameId).emit('move_made', {
        position: result.position,
        player: botPiece,
        nextTurn: game.currentTurn,
        board: game.board,
      });

      await analyticsService.moveMade(gameId, bot.id, result.position!);

      if (result.winner || result.isDraw) {
        await this.handleGameEnd(game, result.winner, result.isDraw);
      }
    }
  }

  private async handleGameEnd(
    game: any,
    winnerId?: string,
    isDraw?: boolean
  ): Promise<void> {
    try {
      const duration = Math.floor(
        (new Date().getTime() - game.createdAt.getTime()) / 1000
      );

      // --- 🎯 Update Player Stats ---
      if (isDraw) {
        // Draw for Player 1
        await prisma.player.updateMany({
          where: { id: game.player1.id },
          data: { draws: { increment: 1 } },
        });

        // Draw for Player 2 (only if exists and not a bot)
        if (game.player2 && !game.player2.isBot) {
          await prisma.player.updateMany({
            where: { id: game.player2.id },
            data: { draws: { increment: 1 } },
          });
        }

        logger.info(
          `🤝 Game ${game.id} ended in a draw between ${game.player1.username} and ${game.player2?.username || "Bot"}`
        );
      } else if (winnerId) {
        // Determine the loser
        const loserId =
          winnerId === game.player1.id ? game.player2?.id : game.player1.id;

        // Get winner and loser objects for easier reference
        const winner =
          game.player1.id === winnerId ? game.player1 : game.player2;
        const loser =
          game.player1.id === loserId ? game.player1 : game.player2;

        // Update winner stats (skip bot)
        if (winner && !winner.isBot) {
          await prisma.player.updateMany({
            where: { id: winner.id },
            data: { wins: { increment: 1 } },
          });
        }

        // Update loser stats (skip bot)
        if (loser && !loser.isBot && loserId && loserId !== winnerId) {
          await prisma.player.updateMany({
            where: { id: loser.id },
            data: { losses: { increment: 1 } },
          });
        }

        logger.info(
          `🏆 Game ${game.id} won by ${winner?.username || "Bot"}${
            loser?.username ? ` (defeated ${loser.username})` : ""
          }`
        );
      }

      // --- 💾 Save Game Record in Database ---
      await prisma.game.create({
        data: {
          id: game.id,
          player1Id: game.player1.id,
          player2Id: game.player2?.id || game.player1.id,
          winnerId: winnerId || null,
          status: "completed",
          board: JSON.stringify(game.board),
          duration,
          isVsBot: game.player2?.isBot || false,
          completedAt: new Date(),
        },
      });

      // --- 📢 Emit Game Over Event ---
      this.io.to(game.id).emit("game_over", {
        winner: winnerId,
        isDraw,
        board: game.board,
      });

      // --- 📊 Analytics ---
      await analyticsService.gameEnded(
        game.id,
        winnerId || undefined,
        duration,
        game.player2?.isBot || false
      );

      // --- 🧹 Cleanup ---
      setTimeout(() => gameService.deleteGame(game.id), 5000);
    } catch (error) {
      logger.error(`❌ Error in handleGameEnd for game ${game.id}:`, error);
    }
  }

  private async handleRejoinGame(
    socket: Socket,
    data: { gameId: string; playerId: string }
  ): Promise<void> {
    try {
      const { gameId, playerId } = data;

      // Validate game ID
      const gameIdValidation = Validator.isValidGameId(gameId);
      if (!gameIdValidation.valid) {
        socket.emit('error', { message: gameIdValidation.error });
        return;
      }

      const game = gameService.getGame(gameId);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const player =
        game.player1.id === playerId ? game.player1 : game.player2?.id === playerId ? game.player2 : null;

      if (!player) {
        socket.emit('error', { message: 'Player not in this game' });
        return;
      }

      // Update socket ID
      player.socketId = socket.id;
      socket.join(gameId);

      gameService.clearDisconnected(gameId);

      const playerNumber = player.id === game.player1.id ? 'player1' : 'player2';

      socket.emit('game_rejoined', {
        gameId: game.id,
        board: game.board,
        currentTurn: game.currentTurn,
        opponent: player.id === game.player1.id ? game.player2?.username : game.player1.username,
        playerNumber,
      });

      await analyticsService.playerReconnected(gameId, playerId);

      logger.info(`Player ${player.username} rejoined game ${gameId}`);
    } catch (error) {
      logger.error('Error in handleRejoinGame:', error);
      socket.emit('error', { message: 'Failed to rejoin game' });
    }
  }

  private handleDisconnect(socket: Socket): void {
    logger.info(`Client disconnected: ${socket.id}`);

    // Remove from matchmaking queue
    matchmakingService.removePlayerFromQueue(socket.id);

    // Handle disconnect in active games
    const games = gameService.getAllActiveGames();
    const game = games.find(
      (g) =>
        g.player1.socketId === socket.id ||
        g.player2?.socketId === socket.id
    );

    if (game) {
      const player =
        game.player1.socketId === socket.id ? game.player1 : game.player2;

      if (player && !player.isBot) {
        gameService.setDisconnected(game.id, player.id);

        const timeout = setTimeout(() => {
          const currentGame = gameService.getGame(game.id);
          if (currentGame && currentGame.disconnectedPlayer === player.id) {
            gameService.forfeitGame(game.id, player.id);
            this.handleGameEnd(currentGame, currentGame.winner || undefined);
          }
        }, config.game.reconnectTimeout);

        game.disconnectTimeout = timeout;

        analyticsService.playerDisconnected(game.id, player.id);

        // Notify opponent
        const opponent =
          player.id === game.player1.id ? game.player2 : game.player1;
        if (opponent && !opponent.isBot) {
          this.io.to(opponent.socketId).emit('opponent_disconnected');
        }
      }
    }
  }
}