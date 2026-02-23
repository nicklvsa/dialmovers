import { GameService } from '../../../src/services/game.service';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  afterEach(() => {
    gameService.destroy();
  });

  describe('generatePIN', () => {
    it('should generate a 6-digit PIN', () => {
      const pin = gameService.generatePIN();
      expect(pin).toHaveLength(6);
      expect(/^\d{6}$/.test(pin)).toBe(true);
    });

    it('should generate unique PINs', () => {
      const pins = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        pins.add(gameService.generatePIN());
      }
      expect(pins.size).toBe(1000);
    });
  });

  describe('digitToDirection', () => {
    it('should map digit 2 to UP', () => {
      expect(gameService.digitToDirection('2')).toBe('UP');
    });

    it('should map digit 8 to DOWN', () => {
      expect(gameService.digitToDirection('8')).toBe('DOWN');
    });

    it('should map digit 4 to LEFT', () => {
      expect(gameService.digitToDirection('4')).toBe('LEFT');
    });

    it('should map digit 6 to RIGHT', () => {
      expect(gameService.digitToDirection('6')).toBe('RIGHT');
    });

    it('should map digit 0 to DOWN', () => {
      expect(gameService.digitToDirection('0')).toBe('DOWN');
    });

    it('should return null for invalid digits', () => {
      expect(gameService.digitToDirection('1')).toBeNull();
      expect(gameService.digitToDirection('3')).toBeNull();
      expect(gameService.digitToDirection('5')).toBeNull();
      expect(gameService.digitToDirection('7')).toBeNull();
      expect(gameService.digitToDirection('9')).toBeNull();
    });
  });

  describe('session management', () => {
    it('should create a session', () => {
      const userId = 'user123';
      const pin = '123456';
      const session = gameService.createSession(userId, pin);

      expect(session.userId).toBe(userId);
      expect(session.pin).toBe(pin);
      expect(session.connection).toBeNull();
    });

    it('should get an existing session', () => {
      const userId = 'user123';
      const pin = '123456';
      gameService.createSession(userId, pin);

      const session = gameService.getSession(userId);
      expect(session).toBeDefined();
      expect(session?.userId).toBe(userId);
    });

    it('should return undefined for non-existent session', () => {
      const session = gameService.getSession('nonexistent');
      expect(session).toBeUndefined();
    });

    it('should delete a session', () => {
      const userId = 'user123';
      gameService.createSession(userId, '123456');

      const deleted = gameService.deleteSession(userId);
      expect(deleted).toBe(true);

      const session = gameService.getSession(userId);
      expect(session).toBeUndefined();
    });

    it('should check if user has active session', () => {
      const userId = 'user123';
      gameService.createSession(userId, '123456');

      expect(gameService.hasActiveSession(userId)).toBe(true);
      expect(gameService.hasActiveSession('nonexistent')).toBe(false);
    });
  });

  describe('user ID formatting', () => {
    it('should format user ID with caller suffix', () => {
      const userId = gameService.formatUserId('1234567890', 'caller');
      expect(userId).toBe('+1234567890:caller');
    });

    it('should format user ID with client suffix', () => {
      const userId = gameService.formatUserId('1234567890', 'client');
      expect(userId).toBe('+1234567890:client');
    });

    it('should extract phone number from user ID', () => {
      const phone = gameService.extractPhoneNumber('+1234567890:caller');
      expect(phone).toBe('+1234567890');
    });

    it('should identify caller user IDs', () => {
      expect(gameService.isCaller('+1234567890:caller')).toBe(true);
      expect(gameService.isCaller('+1234567890:client')).toBe(false);
    });
  });

  describe('position calculation', () => {
    it('should calculate UP movement', () => {
      const result = gameService.calculatePosition(100, 100, 'UP');
      expect(result).toEqual({ x: 100, y: 80 });
    });

    it('should calculate DOWN movement', () => {
      const result = gameService.calculatePosition(100, 100, 'DOWN');
      expect(result).toEqual({ x: 100, y: 120 });
    });

    it('should calculate LEFT movement', () => {
      const result = gameService.calculatePosition(100, 100, 'LEFT');
      expect(result).toEqual({ x: 80, y: 100 });
    });

    it('should calculate RIGHT movement', () => {
      const result = gameService.calculatePosition(100, 100, 'RIGHT');
      expect(result).toEqual({ x: 120, y: 100 });
    });

    it('should not move beyond canvas boundaries', () => {
      const upResult = gameService.calculatePosition(10, 5, 'UP');
      expect(upResult.y).toBe(0);

      const leftResult = gameService.calculatePosition(5, 10, 'LEFT');
      expect(leftResult.x).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return session statistics', () => {
      gameService.createSession('user1', '123456');
      gameService.createSession('user2', '789012');
      gameService.createSession('user3'); // No PIN

      const stats = gameService.getStats();
      expect(stats.totalSessions).toBe(3);
      expect(stats.sessionsWithPin).toBe(2);
    });
  });
});
