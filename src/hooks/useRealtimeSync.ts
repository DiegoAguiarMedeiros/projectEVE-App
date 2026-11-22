import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { getAccessToken, getSocketBaseUrl } from 'src/api/client';

interface SyncInvalidatePayload {
  resource: string;
  method: string;
  keys: string[][];
  timestamp: number;
}

export function useRealtimeSync(userId?: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return undefined;

    const socketUrl = getSocketBaseUrl();
    const token = getAccessToken();

    const socket: Socket = io(socketUrl, {
      auth: token ? { token } : undefined,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('sync:invalidate', (payload: SyncInvalidatePayload) => {
      if (Array.isArray(payload?.keys)) {
        for (const queryKey of payload.keys) {
          queryClient.invalidateQueries({ queryKey });
        }
      }
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !socket.connected) {
        const freshToken = getAccessToken();
        if (freshToken) {
          socket.auth = { token: freshToken };
        }
        socket.connect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      socket.off('sync:invalidate');
      socket.disconnect();
    };
  }, [userId, queryClient]);
}
