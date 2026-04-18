import { SessionService } from '../../../src/services/session.service';
import { gameService } from '../../../src/services/game.service';
import { wsService } from '../../../src/services/websocket.service';

// Mock the WebSocket service to avoid actual connections
jest.mock('../../../src/services/websocket.service', () => {
  const mockWsService = {
    hasConnection: jest.fn().mockReturnValue(false),
    createConnection: jest.fn().mockReturnValue({ close: jest.fn() }),
    sendMessage: jest.fn().mockReturnValue(true),
    closeConnection: jest.fn(),
    closeAll: jest.fn(),
    removeAllListeners: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
  };
  return {
    wsService: mockWsService,
    WebSocketService: jest.fn().mockImplementation(() => mockWsService),
  };
});

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionService = new SessionService();
  });

  afterEach(() => {
    gameService.destroy();
  });

  describe('handleUserConnection', () => {
    it('should create session and WebSocket connection', async () => {
      const result = await sessionService.handleUserConnection('+1234567890:caller', '123456');

      expect(result).toBe(true);
      expect(gameService.getSession('+1234567890:caller')).toBeDefined();
      expect(wsService.createConnection).toHaveBeenCalledWith('+1234567890:caller');
    });

    it('should return false on connection failure', async () => {
      (wsService.sendMessage as jest.Mock).mockReturnValue(false);

      const result = await sessionService.handleUserConnection('+1234567890:caller', '123456');

      expect(result).toBe(false);
    });
  });

  describe('movePlayer', () => {
    it('should return false when no active session', async () => {
      const result = await sessionService.movePlayer('+9999999999:caller', 'UP');

      expect(result).toBe(false);
    });

    it('should send move message when session exists', async () => {
      gameService.createSession('+1234567890:caller', '123456');
      (wsService.sendMessage as jest.Mock).mockReturnValue(true);

      const result = await sessionService.movePlayer('+1234567890:caller', 'UP');

      expect(result).toBe(true);
      expect(wsService.sendMessage).toHaveBeenCalledWith(
        '+1234567890:caller',
        expect.objectContaining({
          payload_type: 'game:move',
          payload: expect.objectContaining({
            user_id: '+1234567890:caller',
            direction: 'UP',
          }),
        })
      );
    });
  });

  describe('handleUserDisconnection', () => {
    it('should close connection and delete session', async () => {
      gameService.createSession('+1234567890:caller', '123456');

      await sessionService.handleUserDisconnection('+1234567890:caller');

      expect(wsService.closeConnection).toHaveBeenCalledWith('+1234567890:caller');
      expect(gameService.getSession('+1234567890:caller')).toBeUndefined();
    });
  });

  describe('getSessionInfo', () => {
    it('should return correct info for user with no session', () => {
      const info = sessionService.getSessionInfo('+9999999999:caller');

      expect(info).toEqual({
        hasSession: false,
        hasPin: false,
        hasConnection: false,
      });
    });

    it('should return correct info for user with session', () => {
      gameService.createSession('+1234567890:caller', '123456');

      const info = sessionService.getSessionInfo('+1234567890:caller');

      expect(info.hasSession).toBe(true);
      expect(info.hasPin).toBe(true);
    });
  });
});
