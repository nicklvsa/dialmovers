import { Router, Request, Response } from 'express';
import { wsService } from '../services/websocket.service';
import { gameService } from '../services/game.service';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check game server connection
    const gameServerConnected = await wsService.isConnected();

    const stats = gameService.getStats();

    const healthStatus = {
      status: gameServerConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        gameServer: gameServerConnected ? 'up' : 'down',
      },
      metrics: {
        activeSessions: stats.activeSessions,
        sessionsWithPin: stats.sessionsWithPin,
      },
    };

    const statusCode = gameServerConnected ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe (for Kubernetes)
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  const gameServerConnected = await wsService.isConnected();

  if (gameServerConnected) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

/**
 * GET /health/live
 * Liveness probe (for Kubernetes)
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

export default router;
