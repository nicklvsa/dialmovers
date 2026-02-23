import { ref, onUnmounted } from 'vue';
import { WebSocketClient } from '@/api/websocket';
import { SocketEvent } from '@/types/events';

export function useWebSocket(url: string, userId: string) {
  const client = ref<WebSocketClient | null>(null);
  const isConnected = ref(false);
  const error = ref<Error | null>(null);

  let cleanup: (() => void) | null = null;

  const connect = async () => {
    try {
      error.value = null;
      client.value = new WebSocketClient(url, userId);

      // Listen to connect event
      cleanup = client.value.on('connect', () => {
        isConnected.value = true;
      });

      await client.value.connect();
      isConnected.value = true;
    } catch (e) {
      error.value = e as Error;
      isConnected.value = false;
      throw e;
    }
  };

  const disconnect = () => {
    if (client.value) {
      client.value.disconnect();
      client.value = null;
    }
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    isConnected.value = false;
  };

  const send = (event: SocketEvent) => {
    if (!client.value) {
      throw new Error('WebSocket client not initialized');
    }
    return client.value.send(event);
  };

  const on = (eventType: string, listener: (event: SocketEvent) => void) => {
    if (!client.value) {
      console.warn('Cannot add listener: WebSocket client not initialized');
      return () => {};
    }
    return client.value.on(eventType, listener);
  };

  // Auto-disconnect on unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    error,
    connect,
    disconnect,
    send,
    on,
  };
}
