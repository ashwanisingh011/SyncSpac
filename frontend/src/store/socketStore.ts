import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  emitEvent: (event: string, data: any) => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connectSocket: (token: string) => {
    // If socket is already connected or actively connecting, do not re-establish
    if (get().socket && (get().socket?.connected || (get().socket as any).active)) return;

    // Disconnect existing instance if any
    get().disconnectSocket();

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      set({ isConnected: true });
    });

    socketInstance.on('disconnect', () => {
      set({ isConnected: false });
    });

    socketInstance.on('connect_error', async (error) => {
      console.error('[Socket] Connection error:', error.message);
      set({ isConnected: false });

      // If token authentication error, attempt to refresh the JWT and reconnect
      if (
        error.message.includes('Authentication error') ||
        error.message.includes('token') ||
        error.message.includes('jwt')
      ) {
        try {
          const { default: api } = await import('@/api/axios');
          const response = await api.post('/auth/refresh');
          const newToken = response.data?.token;
          if (newToken) {
            get().connectSocket(newToken);
          }
        } catch (refreshErr) {
          console.error('[Socket] Failed to refresh token for socket reconnection:', refreshErr);
        }
      }
    });

    set({ socket: socketInstance });
  },

  disconnectSocket: () => {
    const activeSocket = get().socket;
    if (activeSocket) {
      activeSocket.disconnect();
    }
    set({ socket: null, isConnected: false });
  },

  emitEvent: (event: string, data: any) => {
    const activeSocket = get().socket;
    if (activeSocket && get().isConnected) {
      activeSocket.emit(event, data);
    } else {
      console.warn(`[Socket] Cannot emit event "${event}". Socket is not connected.`);
    }
  },
}));
