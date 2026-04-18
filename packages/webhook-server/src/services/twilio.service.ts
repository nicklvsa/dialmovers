import twilio from 'twilio';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { logger } from '../middleware/error-handler';
import { config } from '../config';

// Extract the language type from VoiceResponse SayAttributes
type SayAttributes = Parameters<typeof VoiceResponse.prototype.say>[0];
type SayLanguage = SayAttributes extends { language?: infer L } ? L : string;

/**
 * Twilio Service for handling voice responses and SDK interactions
 */
export class TwilioService {
  private client: ReturnType<typeof twilio> | null;

  constructor() {
    // Only initialize client if credentials are provided
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    } else {
      this.client = null;
    }
  }

  /**
   * Create a VoiceResponse for gathering DTMF input
   */
  createGatherResponse(options: {
    action?: string;
    method?: 'GET' | 'POST';
    text?: string;
    numDigits?: number;
    timeout?: number;
    finishOnKey?: string;
  }): string {
    const twiml = new VoiceResponse();

    const gather = twiml.gather({
      action: options.action || '/voice',
      method: options.method || 'GET',
      numDigits: options.numDigits,
      timeout: options.timeout || 5,
      finishOnKey: options.finishOnKey,
    });

    if (options.text) {
      gather.say(options.text);
    }

    return twiml.toString();
  }

  /**
   * Create a VoiceResponse with a spoken message
   */
  createSayResponse(text: string, options?: {
    voice?: 'man' | 'woman' | 'alice';
    language?: string;
    loop?: number;
  }): string {
    const twiml = new VoiceResponse();

    twiml.say({
      voice: options?.voice || 'alice',
      language: (options?.language || 'en-US') as SayLanguage,
      loop: options?.loop,
    }, text);

    return twiml.toString();
  }

  /**
   * Create a VoiceResponse that both says something and gathers input
   */
  createSayAndGatherResponse(options: {
    sayText?: string;
    gatherText?: string;
    action?: string;
    method?: 'GET' | 'POST';
  }): string {
    const twiml = new VoiceResponse();

    if (options.sayText) {
      twiml.say(options.sayText);
    }

    const gather = twiml.gather({
      action: options.action || '/voice',
      method: options.method || 'GET',
    });

    if (options.gatherText) {
      gather.say(options.gatherText);
    }

    return twiml.toString();
  }

  /**
   * Create a VoiceResponse for hanging up
   */
  createHangupResponse(message?: string): string {
    const twiml = new VoiceResponse();

    if (message) {
      twiml.say(message);
    }

    twiml.hangup();

    return twiml.toString();
  }

  /**
   * Create a VoiceResponse for redirecting to another URL
   */
  createRedirectResponse(url: string): string {
    const twiml = new VoiceResponse();
    twiml.redirect(url);
    return twiml.toString();
  }

  /**
   * Make an outbound call
   */
  async makeCall(to: string, options?: {
    from?: string;
    url?: string;
    applicationSid?: string;
    method?: 'GET' | 'POST';
    fallbackUrl?: string;
    statusCallback?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    if (!this.client) {
      throw new Error('Twilio client not initialized. Please provide TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }

    try {
      const call = await this.client.calls.create({
        to,
        from: options?.from || config.twilio.phoneNumber,
        url: options?.url,
        applicationSid: options?.applicationSid,
        method: options?.method || 'POST',
        fallbackUrl: options?.fallbackUrl,
        statusCallback: options?.statusCallback,
      });

      logger.info({ to, callSid: call.sid }, 'Outbound call initiated');
      return call;
    } catch (error) {
      logger.error({ to, error }, 'Failed to make outbound call');
      throw error;
    }
  }

  /**
   * Get call information
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCallInfo(callSid: string): Promise<any> {
    if (!this.client) {
      throw new Error('Twilio client not initialized. Please provide TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }

    try {
      const call = await this.client.calls(callSid).fetch();
      return call;
    } catch (error) {
      logger.error({ callSid, error }, 'Failed to get call info');
      throw error;
    }
  }

  /**
   * Format phone number to E.164 standard
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If no country code, add +1 (US)
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }

    return `+${cleaned}`;
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?\d{10,15}$/;
    return phoneRegex.test(phoneNumber);
  }
}

// Export singleton instance
export const twilioService = new TwilioService();
