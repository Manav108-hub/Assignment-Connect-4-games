// src/services/socket.ts
// Simplified for Go backend compatibility

import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    console.log('🔌 Creating socket with URL:', WS_URL);
    
    socket = io(WS_URL, {
      // Connection settings
      autoConnect: false,
      
      // CRITICAL: Start with polling for Go compatibility
      transports: ['polling'],
      upgrade: false, // Don't upgrade to websocket
      
      // Path
      path: '/socket.io',
      
      // CORS - must match backend
      withCredentials: false,
      
      // Reconnection
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      
      // Timeouts
      timeout: 10000,
      
      // Force EIO version 4
      forceNew: false,
    });

    // Event logging
    socket.on('connect', () => {
      console.log('✅ Connected to server, ID:', socket!.id);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      console.error('Error details:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚠️  Disconnected:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
    });
  }
  
  return socket;
};

export const connectSocket = (): void => {
  const socket = getSocket();
  if (!socket.connected) {
    console.log('🔌 Connecting socket...');
    socket.connect();
  } else {
    console.log('✅ Socket already connected');
  }
};

export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    console.log('👋 Disconnecting socket...');
    socket.disconnect();
  }
};

export default getSocket;