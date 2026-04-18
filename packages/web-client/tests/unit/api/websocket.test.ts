import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketClient } from '@/api/websocket';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send = vi.fn();
  close = vi.fn();

  static createInstance(): MockWebSocket {
    return new MockWebSocket('ws://localhost');
  }
}

// @ts-expect-error - Mocking global
global.WebSocket = MockWebSocket;

describe('WebSocketClient', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    vi.useFakeTimers();
    client = new WebSocketClient('ws://localhost:8081', 'user123');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('connect', () => {
    it('should resolve when connection opens', async () => {
      const promise = client.connect();
      await vi.runAllTimersAsync();
      await expect(promise).resolves.toBeUndefined();
    });

    it('should report connected after open', async () => {
      const promise = client.connect();
      await vi.runAllTimersAsync();
      await promise;
      expect(client.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should clean up and prevent reconnection', async () => {
      const promise = client.connect();
      await vi.runAllTimersAsync();
      await promise;

      client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('send', () => {
    it('should return false when not connected', () => {
      expect(client.send({ payload_type: 'game:move', payload: {} })).toBe(false);
    });
  });

  describe('event listeners', () => {
    it('should register and notify listeners', async () => {
      const promise = client.connect();
      await vi.runAllTimersAsync();
      await promise;

      const listener = vi.fn();
      client.on('game:move', listener);

      // Simulate message
      const ws = (client as any).ws as MockWebSocket;
      ws.onmessage?.({
        data: JSON.stringify({
          payload_type: 'game:move',
          payload: { user_id: 'user1', direction: 'UP' },
        }),
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ payload_type: 'game:move' })
      );
    });

    it('should unsubscribe via returned function', async () => {
      const promise = client.connect();
      await vi.runAllTimersAsync();
      await promise;

      const listener = vi.fn();
      const unsub = client.on('game:move', listener);
      unsub();

      const ws = (client as any).ws as MockWebSocket;
      ws.onmessage?.({
        data: JSON.stringify({
          payload_type: 'game:move',
          payload: { user_id: 'user1', direction: 'UP' },
        }),
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
