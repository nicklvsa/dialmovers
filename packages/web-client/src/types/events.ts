/**
 * Event payload types for WebSocket communication
 */

export type PayloadType = 'connect' | 'disconnect' | 'game:join' | 'game:move';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface BaseEvent<T = ConnectionPayload | JoinPayload | MovePayload> {
  payload_type: PayloadType;
  payload: T;
}

export interface ConnectionPayload {
  user_id: string;
}

export interface JoinPayload {
  user_id: string;
  game_id: string;
}

export interface MovePayload {
  user_id: string;
  game_id: string;
  direction: Direction;
}

export type SocketEvent = BaseEvent<ConnectionPayload | JoinPayload | MovePayload>;

export interface PlayerPosition {
  userId: string;
  x: number;
  y: number;
  color: string;
  updatePos: (x: number, y: number) => void;
}

export interface GameEvent {
  type: string;
  color: string;
  message: string;
}
