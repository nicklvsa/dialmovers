import { logger } from '../middleware/error-handler';
import { wsService } from './websocket.service';
import { gameService, UserSession } from './game.service';

/**
 * Session Service for managing user sessions and WebSocket connections
 * This service coordinates between game state and WebSocket connections
 */
export class SessionService {
  /**
   * Handle user connection with WebSocket
   */
  async handleUserConnection(userId: string, pin: string): Promise<boolean> {
    try {
      // Create session if it doesn't exist
      let session = gameService.getSession(userId);

      if (!session) {
        session = gameService.createSession(userId, pin);
      } else {
        gameService.setSessionPin(userId, pin);
      }

      // Create WebSocket connection if not exists
      if (!wsService.hasConnection(userId)) {
        const socket = wsService.createConnection(userId);
        gameService.setSessionConnection(userId, socket);
      }

      // Join the game
      await this.joinGame(userId, pin);

      return true;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to handle user connection');
      return false;
    }
  }

  /**
   * Send join game event
   */
  async joinGame(userId: string, gameId: string): Promise<void> {
    const message = {
      payload_type: 'game:join',
      payload: {
        user_id: userId,
        game_id: gameId,
      },
    };

    const success = wsService.sendMessage(userId, message);

    if (!success) {
      throw new Error('Failed to send join game message');
    }

    logger.info({ userId, gameId }, 'User joined game');
  }

  /**
   * Handle player movement
   */
  async movePlayer(userId: string, direction: string): Promise<boolean> {
    try {
      const session = gameService.getSession(userId);

      if (!session || !session.pin) {
        logger.warn({ userId }, 'Cannot move player: no active session');
        return false;
      }

      const message = {
        payload_type: 'game:move',
        payload: {
          user_id: userId,
          game_id: session.pin,
          direction,
        },
      };

      const success = wsService.sendMessage(userId, message);

      if (success) {
        gameService.updateActivity(userId);
      }

      return success;
    } catch (error) {
      logger.error({ userId, direction, error }, 'Failed to move player');
      return false;
    }
  }

  /**
   * Handle user disconnection
   */
  async handleUserDisconnection(userId: string): Promise<void> {
    try {
      // Close WebSocket connection
      wsService.closeConnection(userId);

      // Delete session
      gameService.deleteSession(userId);

      logger.info({ userId }, 'User disconnected successfully');
    } catch (error) {
      logger.error({ userId, error }, 'Failed to handle user disconnection');
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): UserSession[] {
    return gameService.getAllSessions();
  }

  /**
   * Get session info for a user
   */
  getSessionInfo(userId: string): { hasSession: boolean; hasPin: boolean; hasConnection: boolean } {
    const session = gameService.getSession(userId);
    const hasConnection = wsService.hasConnection(userId);

    return {
      hasSession: !!session,
      hasPin: session?.pin !== null && session?.pin !== undefined,
      hasConnection,
    };
  }
}

// Export singleton instance
export const sessionService = new SessionService();
