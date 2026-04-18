import request from 'supertest';
import { createApp } from '../../src/index';
import { gameService } from '../../src/services/game.service';
import { wsService } from '../../src/services/websocket.service';

// Suppress unhandled WebSocket errors during tests
wsService.on('error', () => {});

describe('POST /voice Integration Tests', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(() => {
    gameService.destroy();
  });

  describe('Initial call handling', () => {
    it('should return TwiML with gather when no digits provided', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('<Gather');
      expect(response.text).toContain('Enter your game pin');
    });

    it('should handle phone numbers in various formats', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '1234567890' })
        .expect('Content-Type', /xml/);

      expect(response.status).toBe(200);
    });
  });

  describe('Game PIN entry', () => {
    it('should set game PIN on first digit input', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '1' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('Setting your game code');
      expect(response.text).toContain('1');
    });

    it('should reject multi-digit input for PIN', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '12345' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('one digit at a time');
    });
  });

  describe('Movement commands', () => {
    const userId = '+1234567890:caller';

    beforeEach(() => {
      // Create a session with a PIN for testing movement
      gameService.createSession(userId, '12345');
    });

    it('should handle UP movement (digit 2)', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '2' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('Moving UP');
    });

    it('should handle DOWN movement (digit 8)', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '8' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('Moving DOWN');
    });

    it('should handle LEFT movement (digit 4)', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '4' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('Moving LEFT');
    });

    it('should handle RIGHT movement (digit 6)', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '6' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('Moving RIGHT');
    });

    it('should handle DOWN movement with digit 0', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '0' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('Moving DOWN');
    });
  });

  describe('Disconnect handling', () => {
    it('should handle disconnect command (*)', async () => {
      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '*' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('Removing your game session');
    });
  });

  describe('Invalid input handling', () => {
    it('should reject invalid digits when user has active session', async () => {
      const userId = '+1234567890:caller';
      gameService.createSession(userId, '12345');

      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '9' })
        .expect('Content-Type', /xml/);

      // Twiml generates "Goodbye" with capital G
      const hasInvalidMove = response.text.toLowerCase().includes('invalid move');
      const hasGoodbye = response.text.toLowerCase().includes('goodbye');
      expect(hasInvalidMove || hasGoodbye).toBe(true);
    });

    it('should reject multi-digit input for movement', async () => {
      const userId = '+1234567890:caller';
      gameService.createSession(userId, '12345');

      const response = await request(app)
        .get('/voice')
        .query({ Caller: '+1234567890', Digits: '12' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('one digit at a time');
    });
  });

  describe('Health endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('dependencies');
    });
  });

  describe('Error handling', () => {
    it('should handle missing Caller parameter', async () => {
      const response = await request(app)
        .get('/voice')
        .expect(400);

      expect(response.text).toContain('Invalid caller');
    });
  });

  describe('POST method', () => {
    it('should also handle POST requests', async () => {
      const response = await request(app)
        .post('/voice')
        .query({ Caller: '+1234567890' })
        .expect('Content-Type', /xml/);

      expect(response.text).toContain('<Gather');
    });
  });
});
