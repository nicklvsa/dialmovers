import { WebSocketService } from '../../../src/services/websocket.service';

describe('WebSocketService', () => {
  let wsService: WebSocketService;

  beforeEach(() => {
    wsService = new WebSocketService();
  });

  afterEach(() => {
    wsService.closeAll();
    wsService.removeAllListeners();
  });

  describe('connection management', () => {
    it('should report no connection for unknown user', () => {
      expect(wsService.hasConnection('unknown')).toBe(false);
    });

    it('should return empty active connection ids when no connections', () => {
      expect(wsService.getActiveConnectionIds()).toEqual([]);
    });

    it('should close connection for unknown user without error', () => {
      expect(() => wsService.closeConnection('unknown')).not.toThrow();
    });

    it('should return false when sending to unknown user', () => {
      expect(wsService.sendMessage('unknown', { type: 'test' })).toBe(false);
    });

    it('should close all connections without error', () => {
      expect(() => wsService.closeAll()).not.toThrow();
    });
  });

  describe('event emitter', () => {
    it('should emit and listen for custom events', () => {
      const listener = jest.fn();
      wsService.on('test', listener);
      wsService.emit('test', 'data');

      expect(listener).toHaveBeenCalledWith('data');
    });
  });
});
