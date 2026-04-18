import { ref, reactive, watch, Ref } from 'vue';
import { PlayerPosition, GameEvent, Direction, SocketEvent, MovePayload } from '@/types/events';

const GAME_SPEED = 20;
const STARTING_X = 100;
const STARTING_Y = 100;
const CALLER_COLOR = '#009933';
const ENEMY_COLOR = '#FF0000';
const SQUARE_SIZE = 20;

export function useGame(canvasRef: Ref<HTMLCanvasElement | undefined>) {
  const positions = reactive<Map<string, PlayerPosition>>(new Map());
  const events = ref<GameEvent[]>([]);
  const context = ref<CanvasRenderingContext2D | null>(null);

  // Initialize canvas context when canvas is available
  watch(canvasRef, (canvas) => {
    if (canvas) {
      context.value = canvas.getContext('2d');
      render();
    }
  });

  const addPosition = (userId: string, isCaller: boolean): PlayerPosition => {
    const position: PlayerPosition = {
      userId,
      x: STARTING_X,
      y: STARTING_Y,
      color: isCaller ? CALLER_COLOR : ENEMY_COLOR,
      updatePos(x: number, y: number) {
        this.x = x;
        this.y = y;
        render();
      },
    };
    positions.set(userId, position);
    render();
    return position;
  };

  const removePosition = (userId: string): void => {
    positions.delete(userId);
    render();
  };

  const movePlayer = (userId: string, direction: Direction): void => {
    const pos = positions.get(userId);
    if (!pos) return;

    const canvas = canvasRef.value;
    if (!canvas) return;

    const maxX = canvas.width - SQUARE_SIZE;
    const maxY = canvas.height - SQUARE_SIZE;

    switch (direction) {
      case 'UP':
        pos.y = Math.max(0, pos.y - GAME_SPEED);
        break;
      case 'DOWN':
        pos.y = Math.min(maxY, pos.y + GAME_SPEED);
        break;
      case 'LEFT':
        pos.x = Math.max(0, pos.x - GAME_SPEED);
        break;
      case 'RIGHT':
        pos.x = Math.min(maxX, pos.x + GAME_SPEED);
        break;
    }
    render();
  };

  const render = (): void => {
    if (!context.value || !canvasRef.value) return;

    const canvas = canvasRef.value;
    context.value.clearRect(0, 0, canvas.width, canvas.height);

    positions.forEach((pos) => {
      if (context.value) {
        context.value.fillStyle = pos.color;
        context.value.fillRect(pos.x, pos.y, SQUARE_SIZE, SQUARE_SIZE);
      }
    });
  };

  const addEvent = (type: string, color: string, message: string): void => {
    events.value.push({ type, color, message });
  };

  const clearEvents = (): void => {
    events.value = [];
  };

  const handleSocketEvent = (event: SocketEvent, isCurrentUserCaller: (userId: string) => boolean): void => {
    switch (event.payload_type) {
      case 'connect':
        addEvent('Connect', 'green', `New user ${event.payload.user_id} has connected!`);
        break;

      case 'disconnect':
        addEvent('Disconnect', 'red', `User ${event.payload.user_id} has disconnected!`);
        removePosition(event.payload.user_id);
        break;

      case 'game:join':
        addEvent('Join', 'green', `User ${event.payload.user_id} has joined game ${event.payload.game_id}!`);
        addPosition(event.payload.user_id, isCurrentUserCaller(event.payload.user_id));
        break;

      case 'game:move':
        addEvent('Move', 'blue', `User ${event.payload.user_id} moved ${(event.payload as MovePayload).direction}`);
        movePlayer(event.payload.user_id, (event.payload as MovePayload).direction);
        break;
    }
  };

  return {
    positions,
    events,
    context,
    addPosition,
    removePosition,
    movePlayer,
    render,
    addEvent,
    clearEvents,
    handleSocketEvent,
  };
}
