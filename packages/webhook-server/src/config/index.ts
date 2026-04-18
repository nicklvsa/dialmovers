import { z } from 'zod';
import { ConfigSchema, Config } from './schema';

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const config = {
    webhook: {
      port: parseInt(process.env.WEBHOOK_SERVER_PORT || '8080', 10),
      host: process.env.WEBHOOK_SERVER_HOST || '0.0.0.0',
    },
    gameServer: {
      url: process.env.GAME_SERVER_URL || 'ws://localhost:8081',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    game: {
      speed: parseInt(process.env.GAME_SPEED || '20', 10),
      canvasWidth: parseInt(process.env.CANVAS_WIDTH || '800', 10),
      canvasHeight: parseInt(process.env.CANVAS_HEIGHT || '600', 10),
      startingX: parseInt(process.env.STARTING_X || '100', 10),
      startingY: parseInt(process.env.STARTING_Y || '100', 10),
    },
    websocket: {
      pingInterval: process.env.WS_PING_INTERVAL,
      writeTimeout: parseInt(process.env.WS_WRITE_TIMEOUT || '10000', 10),
      messageLimit: parseInt(process.env.WS_MESSAGE_LIMIT || '1024', 10),
    },
    cors: {
      allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:8080')
        .split(',')
        .map(o => o.trim()),
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info'),
      format: (process.env.LOG_FORMAT || 'json'),
    },
    rateLimit: {
      windowMs: parseDuration(process.env.RATE_LIMIT_WINDOW || '15m'),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    env: (process.env.NODE_ENV || 'development'),
  };

  // Validate configuration
  try {
    return ConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Configuration validation failed:\n${errors}`);
    }
    throw error;
  }
}

/**
 * Parse duration string (e.g., "15m", "1h", "30s") to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smh])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}

// Export singleton instance
export const config = loadConfig();
