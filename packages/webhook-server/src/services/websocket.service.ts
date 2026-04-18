import WebSocket from 'ws';
import { EventEmitter } from 'events';
import http from 'http';
import { logger } from '../middleware/error-handler';
import { config } from '../config';

export interface WebSocketConnection {
  socket: WebSocket;
  userId: string;
  isConnected: boolean;
}

/**
 * WebSocket Service for managing connections to the game server
 */
export class WebSocketService extends EventEmitter {
  private connections: Map<string, WebSocketConnection> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();

  /**
   * Create a new WebSocket connection for a user
   */
  createConnection(userId: string): WebSocket {
    const url = `${config.gameServer.url}/ws/${userId}`;
    logger.info({ userId, url }, 'Creating WebSocket connection');

    const socket = new WebSocket(url, {
      handshakeTimeout: config.websocket.writeTimeout,
    });

    const connection: WebSocketConnection = {
      socket,
      userId,
      isConnected: false,
    };

    socket.on('open', () => {
      logger.info({ userId }, 'WebSocket connection opened');
      connection.isConnected = true;
      this.connections.set(userId, connection);
      this.reconnectAttempts.delete(userId);
      this.emit('connected', userId, socket);
    });

    socket.on('error', (error) => {
      logger.error({ userId, error }, 'WebSocket error');
      connection.isConnected = false;
      this.emit('error', userId, error);
    });

    socket.on('close', () => {
      logger.info({ userId }, 'WebSocket connection closed');
      connection.isConnected = false;
      this.connections.delete(userId);
      this.emit('disconnected', userId);
    });

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        logger.debug({ userId, message }, 'WebSocket message received');
        this.emit('message', userId, message);
      } catch (error) {
        logger.error({ userId, data }, 'Failed to parse WebSocket message');
      }
    });

    socket.on('pong', () => {
      // Keep connection alive
      logger.debug({ userId }, 'WebSocket pong received');
    });

    return socket;
  }

  /**
   * Send a message through a WebSocket connection
   */
  sendMessage(userId: string, message: object): boolean {
    const connection = this.connections.get(userId);

    if (!connection || !connection.isConnected) {
      logger.warn({ userId }, 'Cannot send message: no active connection');
      return false;
    }

    try {
      connection.socket.send(JSON.stringify(message));
      logger.debug({ userId, message }, 'WebSocket message sent');
      return true;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to send WebSocket message');
      return false;
    }
  }

  /**
   * Close a WebSocket connection
   */
  closeConnection(userId: string): void {
    const connection = this.connections.get(userId);

    if (connection) {
      logger.info({ userId }, 'Closing WebSocket connection');
      connection.socket.close();
      this.connections.delete(userId);
    }
  }

  /**
   * Check if a user has an active connection
   */
  hasConnection(userId: string): boolean {
    const connection = this.connections.get(userId);
    return connection?.isConnected ?? false;
  }

  /**
   * Get all active connection IDs
   */
  getActiveConnectionIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Check if the game server is reachable via HTTP health endpoint
   */
  async isConnected(): Promise<boolean> {
    return new Promise((resolve) => {
      const url = new URL('/health', config.gameServer.url.replace(/^ws/, 'http'));

      const req = http.get(url, { timeout: 3000 }, (res) => {
        resolve(res.statusCode === 200);
        res.resume(); // drain response
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    logger.info('Closing all WebSocket connections');
    for (const connection of this.connections.values()) {
      connection.socket.close();
    }
    this.connections.clear();
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
