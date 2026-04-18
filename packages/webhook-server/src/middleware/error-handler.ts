import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.LOG_FORMAT === 'pretty'
    ? { target: 'pino-pretty' }
    : undefined,
});

export class ValidationError extends Error {
  constructor(public errors: { path: (string | number)[]; message: string }[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class GameServerError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'GameServerError';
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    req: {
      method: req.method,
      url: req.url,
      query: req.query,
    },
  }, 'Request error');

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle custom validation errors
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.errors,
    });
    return;
  }

  // Handle custom game server errors
  if (err instanceof GameServerError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Generic error response
  const statusCode = (err as any).statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : undefined,
    ...(isDevelopment && { stack: err.stack }),
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new GameServerError(`Route not found: ${req.method} ${req.url}`, 404);
  next(error);
};

export { logger };
