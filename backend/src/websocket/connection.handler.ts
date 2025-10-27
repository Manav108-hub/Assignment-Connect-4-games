import { Server, Socket } from 'socket.io';
import { GameHandler } from './game.handler';
import { logger } from '../utils/logger';

export class ConnectionHandler {
  private io: Server;
  private gameHandler: GameHandler;
  private connectedClients: Map<string, string> = new Map(); // socketId -> username

  constructor(io: Server) {
    this.io = io;
    this.gameHandler = new GameHandler(io);
  }

  handleConnections(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`New connection: ${socket.id} from ${socket.handshake.address}`);
      
      // Track connection
      this.connectedClients.set(socket.id, 'anonymous');

      // Set up game event handlers
      this.gameHandler.handleConnection(socket);

      // Handle username registration
      socket.on('register_username', (username: string) => {
        this.connectedClients.set(socket.id, username);
        logger.info(`User registered: ${username} with socket ${socket.id}`);
      });

      // Handle disconnect
      socket.on('disconnect', (reason: string) => {
        const username = this.connectedClients.get(socket.id) || 'unknown';
        logger.info(`Client disconnected: ${socket.id} (${username}) - Reason: ${reason}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle connection errors
      socket.on('error', (error: Error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to Connect Four server',
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('✅ WebSocket connection handler initialized');
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClients(): Array<{ socketId: string; username: string }> {
    return Array.from(this.connectedClients.entries()).map(([socketId, username]) => ({
      socketId,
      username,
    }));
  }
}