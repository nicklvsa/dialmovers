import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for voice endpoints
 * Limits based on phone number (from query parameter)
 */
export const voiceRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Use phone number for rate limiting
    const caller = req.query.Caller as string;
    return caller || req.ip || 'unknown';
  },
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit for phone calls. Please try again later.',
  },
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait before making more requests.',
    });
  },
});

/**
 * Rate limiter for general API endpoints
 * Limits based on IP address
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the API rate limit. Please try again later.',
  },
});
