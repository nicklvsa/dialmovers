import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from './error-handler';

/**
 * Phone number validation schema
 */
const PhoneNumberSchema = z.string().regex(/^\+?\d{10,15}$/, {
  message: 'Phone number must be 10-15 digits, optionally starting with +',
});

/**
 * DTMF digit validation schema
 */
const DtmfDigitSchema = z.string().regex(/^[0-9*#]{1,10}$/, {
  message: 'DTMF digits must be 1-10 characters from 0-9, *, or #',
});

/**
 * Direction validation schema
 */
const DirectionSchema = z.enum(['UP', 'DOWN', 'LEFT', 'RIGHT'], {
  errorMap: () => ({ message: 'Direction must be one of: UP, DOWN, LEFT, RIGHT' }),
});

/**
 * Voice request query validation schema
 */
export const VoiceRequestQuerySchema = z.object({
  Caller: PhoneNumberSchema,
  Digits: DtmfDigitSchema.optional(),
});

/**
 * Voice request body validation schema (for POST requests)
 */
export const VoiceRequestBodySchema = z.object({
  Caller: PhoneNumberSchema,
  Digits: DtmfDigitSchema.optional(),
});

/**
 * Middleware to validate voice request query parameters
 */
export const validateVoiceRequestQuery = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const result = VoiceRequestQuerySchema.safeParse(req.query);

  if (!result.success) {
    throw new ValidationError(result.error.errors);
  }

  // Attach validated data to request
  req.validatedQuery = result.data;
  next();
};

/**
 * Middleware to validate voice request body
 */
export const validateVoiceRequestBody = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const result = VoiceRequestBodySchema.safeParse(req.body);

  if (!result.success) {
    throw new ValidationError(result.error.errors);
  }

  // Attach validated data to request
  req.validatedBody = result.data;
  next();
};

/**
 * Validate game PIN format
 */
export const GamePinSchema = z.string().regex(/^\d{3,10}$/, {
  message: 'Game PIN must be 3-10 digits',
});

/**
 * Validate direction parameter
 */
export const validateDirection = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { direction } = req.params;

  const result = DirectionSchema.safeParse(direction?.toUpperCase());

  if (!result.success) {
    throw new ValidationError(result.error.errors);
  }

  req.validatedDirection = result.data;
  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      validatedQuery?: z.infer<typeof VoiceRequestQuerySchema>;
      validatedBody?: z.infer<typeof VoiceRequestBodySchema>;
      validatedDirection?: z.infer<typeof DirectionSchema>;
    }
  }
}

// Re-export schemas for use in services
export { PhoneNumberSchema, DtmfDigitSchema, DirectionSchema };
