import { TwilioService } from '../../../src/services/twilio.service';

describe('TwilioService', () => {
  let twilioService: TwilioService;

  beforeEach(() => {
    twilioService = new TwilioService();
  });

  describe('createSayResponse', () => {
    it('should return valid TwiML with Say verb', () => {
      const twiml = twilioService.createSayResponse('Hello world');

      expect(twiml).toContain('<Say');
      expect(twiml).toContain('Hello world');
      expect(twiml).toContain('</Say>');
      expect(twiml).toContain('<Response>');
    });
  });

  describe('createGatherResponse', () => {
    it('should return valid TwiML with Gather verb', () => {
      const twiml = twilioService.createGatherResponse({
        text: 'Press a key',
      });

      expect(twiml).toContain('<Gather');
      expect(twiml).toContain('Press a key');
    });

    it('should use default action and method', () => {
      const twiml = twilioService.createGatherResponse({});

      expect(twiml).toContain('action="/voice"');
      expect(twiml).toContain('method="GET"');
    });
  });

  describe('createSayAndGatherResponse', () => {
    it('should return TwiML with both Say and Gather', () => {
      const twiml = twilioService.createSayAndGatherResponse({
        sayText: 'Welcome!',
        gatherText: 'Press a number',
      });

      expect(twiml).toContain('<Say>');
      expect(twiml).toContain('Welcome!');
      expect(twiml).toContain('<Gather');
      expect(twiml).toContain('Press a number');
    });
  });

  describe('createHangupResponse', () => {
    it('should return TwiML with Hangup verb', () => {
      const twiml = twilioService.createHangupResponse('Goodbye');

      expect(twiml).toContain('<Say>');
      expect(twiml).toContain('Goodbye');
      expect(twiml).toContain('<Hangup');
    });

    it('should work without message', () => {
      const twiml = twilioService.createHangupResponse();

      expect(twiml).toContain('<Hangup');
      expect(twiml).not.toContain('<Say>');
    });
  });

  describe('createRedirectResponse', () => {
    it('should return TwiML with Redirect verb', () => {
      const twiml = twilioService.createRedirectResponse('/voice');

      expect(twiml).toContain('<Redirect>');
      expect(twiml).toContain('/voice');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should add + prefix to digits', () => {
      expect(twilioService.formatPhoneNumber('1234567890')).toBe('+1234567890');
    });

    it('should add country code to 10-digit number not starting with 1', () => {
      expect(twilioService.formatPhoneNumber('2345678901')).toBe('+12345678901');
    });

    it('should preserve existing country code', () => {
      expect(twilioService.formatPhoneNumber('+11234567890')).toBe('+11234567890');
    });

    it('should strip non-digit characters', () => {
      expect(twilioService.formatPhoneNumber('(123) 456-7890')).toBe('+1234567890');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should accept valid phone numbers', () => {
      expect(twilioService.isValidPhoneNumber('+1234567890')).toBe(true);
      expect(twilioService.isValidPhoneNumber('1234567890')).toBe(true);
      expect(twilioService.isValidPhoneNumber('+123456789012345')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(twilioService.isValidPhoneNumber('123')).toBe(false);
      expect(twilioService.isValidPhoneNumber('abc')).toBe(false);
    });
  });

  describe('makeCall / getCallInfo', () => {
    it('should throw error when client not initialized', async () => {
      await expect(twilioService.makeCall('+1234567890')).rejects.toThrow(
        'Twilio client not initialized'
      );
    });

    it('should throw error for getCallInfo when client not initialized', async () => {
      await expect(twilioService.getCallInfo('CA123')).rejects.toThrow(
        'Twilio client not initialized'
      );
    });
  });
});
