import { z } from 'zod';

/**
 * Configuration schema with validation using Zod
 */
export const ConfigSchema = z.object({
  // Server Configuration
  webhook: z.object({
    port: z.number().int().min(1).max(65535),
    host: z.string().min(1),
  }),

  // Game Server Configuration
  gameServer: z.object({
    url: z.string().url(),
  }),

  // Twilio Configuration
  twilio: z.object({
    accountSid: z.string().default(''),
    authToken: z.string().default(''),
    phoneNumber: z.string().default(''),
  }),

  // Game Configuration
  game: z.object({
    speed: z.number().int().positive(),
    canvasWidth: z.number().int().positive(),
    canvasHeight: z.number().int().positive(),
    startingX: z.number().int().nonnegative(),
    startingY: z.number().int().nonnegative(),
  }),

  // WebSocket Configuration
  websocket: z.object({
    pingInterval: z.string().optional(),
    writeTimeout: z.number().int().positive(),
    messageLimit: z.number().int().positive(),
  }),

  // CORS Configuration
  cors: z.object({
    allowedOrigins: z.array(z.string().url()),
  }),

  // Logging Configuration
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    format: z.enum(['json', 'pretty']),
  }),

  // Rate Limiting Configuration
  rateLimit: z.object({
    windowMs: z.number().int().positive(),
    max: z.number().int().positive(),
  }),

  // Environment
  env: z.enum(['development', 'production', 'test']),
});

export type Config = z.infer<typeof ConfigSchema>;
