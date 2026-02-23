import express, { Application } from 'express';
import { config } from './config';
import { logger, errorHandler, notFoundHandler } from './middleware/error-handler';
import { voiceRateLimiter, apiRateLimiter } from './middleware/rate-limiter';
import routes from './routes';

/**
 * Create and configure Express application
 */
function createApp(): Application {
  const app = express();

  // Trust proxy for rate limiting (important for Docker/production)
  app.set('trust proxy', 1);

  // Parse query parameters (for Twilio webhooks)
  app.use('/voice', express.urlencoded({ extended: true }));

  // Apply rate limiting to voice endpoints
  app.use('/voice', voiceRateLimiter);

  // Apply rate limiting to API endpoints
  app.use('/api', apiRateLimiter);

  // Routes
  app.use('/', routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function start(): Promise<void> {
  const app = createApp();

  const server = app.listen(config.webhook.port, config.webhook.host, () => {
    logger.info(
      {
        port: config.webhook.port,
        host: config.webhook.host,
        env: config.env,
      },
      'Webhook server started'
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down...');

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception');
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });
}

// Start the server if this file is run directly
if (require.main === module) {
  start().catch((error) => {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  });
}

export { createApp, start };
