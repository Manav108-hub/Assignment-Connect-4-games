export class PlayerModel {
  id: string;
  username: string;
  socketId: string;
  isBot: boolean;
  isConnected: boolean;
  lastActivity: Date;

  constructor(id: string, username: string, socketId: string, isBot: boolean = false) {
    this.id = id;
    this.username = username;
    this.socketId = socketId;
    this.isBot = isBot;
    this.isConnected = true;
    this.lastActivity = new Date();
  }

  updateSocketId(newSocketId: string): void {
    this.socketId = newSocketId;
    this.isConnected = true;
    this.lastActivity = new Date();
  }

  disconnect(): void {
    this.isConnected = false;
    this.lastActivity = new Date();
  }

  reconnect(newSocketId: string): void {
    this.socketId = newSocketId;
    this.isConnected = true;
    this.lastActivity = new Date();
  }

  updateActivity(): void {
    this.lastActivity = new Date();
  }
}