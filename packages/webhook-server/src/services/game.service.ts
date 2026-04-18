import WebSocket from 'ws';
import { logger } from '../middleware/error-handler';
import { config } from '../config';
import { DirectionSchema } from '../middleware/validator';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * User session information
 */
export interface UserSession {
  userId: string;
  pin: string | null;
  connection: WebSocket | null;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Game Service for managing game logic and user sessions
 */
export class GameService {
  private sessions: Map<string, UserSession> = new Map();
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Generate a random game PIN
   */
  generatePIN(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create or update a user session
   */
  createSession(userId: string, pin?: string): UserSession {
    const now = new Date();

    const session: UserSession = {
      userId,
      pin: pin || null,
      connection: null,
      createdAt: now,
      lastActivity: now,
    };

    this.sessions.set(userId, session);
    logger.info({ userId, pin }, 'User session created');

    return session;
  }

  /**
   * Get a user session
   */
  getSession(userId: string): UserSession | undefined {
    return this.sessions.get(userId);
  }

  /**
   * Update user session with game PIN
   */
  setSessionPin(userId: string, pin: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.pin = pin;
      session.lastActivity = new Date();
      logger.info({ userId, pin }, 'Game PIN set for user session');
    }
  }

  /**
   * Set WebSocket connection for a session
   */
  setSessionConnection(userId: string, connection: WebSocket): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.connection = connection;
      session.lastActivity = new Date();
      logger.info({ userId }, 'WebSocket connection set for user session');
    }
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(userId: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Delete a user session
   */
  deleteSession(userId: string): boolean {
    const result = this.sessions.delete(userId);
    if (result) {
      logger.info({ userId }, 'User session deleted');
    }
    return result;
  }

  /**
   * Check if a user has an active session with a PIN
   */
  hasActiveSession(userId: string): boolean {
    const session = this.sessions.get(userId);
    return session?.pin !== null && session?.pin !== undefined;
  }

  /**
   * Map DTMF digit to direction
   */
  digitToDirection(digit: string): Direction | null {
    const directionMap: Record<string, Direction> = {
      '2': 'UP',
      '8': 'DOWN',
      '4': 'LEFT',
      '6': 'RIGHT',
      '0': 'DOWN', // Alternative down
    };

    return directionMap[digit] || null;
  }

  /**
   * Validate direction
   */
  isValidDirection(direction: string): direction is Direction {
    return DirectionSchema.safeParse(direction).success;
  }

  /**
   * Format user ID from phone number
   */
  formatUserId(phoneNumber: string, suffix: 'caller' | 'client' = 'caller'): string {
    const formatted = phoneNumber.replace(/\D/g, '');
    return `+${formatted}:${suffix}`.toLowerCase();
  }

  /**
   * Extract phone number from user ID
   */
  extractPhoneNumber(userId: string): string {
    const match = userId.match(/^\+?(\d{10,15}):/);
    return match ? `+${match[1]}` : userId;
  }

  /**
   * Check if user is a caller (vs web client)
   */
  isCaller(userId: string): boolean {
    return userId.endsWith(':caller');
  }

  /**
   * Calculate new position based on direction
   */
  calculatePosition(
    currentX: number,
    currentY: number,
    direction: Direction
  ): { x: number; y: number } {
    const speed = config.game.speed;

    switch (direction) {
      case 'UP':
        return { x: currentX, y: Math.max(0, currentY - speed) };
      case 'DOWN':
        return {
          x: currentX,
          y: Math.min(config.game.canvasHeight, currentY + speed),
        };
      case 'LEFT':
        return { x: Math.max(0, currentX - speed), y: currentY };
      case 'RIGHT':
        return {
          x: Math.min(config.game.canvasWidth, currentX + speed),
          y: currentY,
        };
    }
  }

  /**
   * Start cleanup interval for expired sessions
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [userId, session] of this.sessions.entries()) {
      const sessionAge = now - session.lastActivity.getTime();
      if (sessionAge > this.sessionTimeout) {
        expired.push(userId);
      }
    }

    for (const userId of expired) {
      this.sessions.delete(userId);
    }

    if (expired.length > 0) {
      logger.info({ count: expired.length }, 'Cleaned up expired sessions');
    }
  }

  /**
   * Get all sessions
   */
  getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    sessionsWithPin: number;
  } {
    const totalSessions = this.sessions.size;
    const sessionsWithPin = Array.from(this.sessions.values()).filter(
      (s) => s.pin !== null && s.pin !== undefined
    ).length;

    return {
      totalSessions,
      activeSessions: totalSessions,
      sessionsWithPin,
    };
  }

  /**
   * Clean up (close cleanup interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }
}

// Export singleton instance
export const gameService = new GameService();
