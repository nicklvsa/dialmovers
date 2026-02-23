import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useGame } from '@/composables/useGame';

describe('useGame', () => {
  let canvasRef: ref<HTMLCanvasElement | undefined>;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    // Create mock context
    mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;

    mockCanvas.getContext = vi.fn(() => mockContext);

    canvasRef = ref(mockCanvas);
  });

  describe('addPosition', () => {
    it('should add a player position', () => {
      const { addPosition, positions } = useGame(canvasRef);

      addPosition('user1', true);

      expect(positions.has('user1')).toBe(true);
      expect(positions.get('user1')?.x).toBe(100);
      expect(positions.get('user1')?.y).toBe(100);
    });

    it('should set correct color for caller', () => {
      const { addPosition, positions } = useGame(canvasRef);

      addPosition('user1', true);

      expect(positions.get('user1')?.color).toBe('#009933');
    });

    it('should set correct color for non-caller', () => {
      const { addPosition, positions } = useGame(canvasRef);

      addPosition('user1', false);

      expect(positions.get('user1')?.color).toBe('#FF0000');
    });
  });

  describe('movePlayer', () => {
    it('should move player UP', () => {
      const { addPosition, movePlayer, positions } = useGame(canvasRef);

      addPosition('user1', true);
      movePlayer('user1', 'UP');

      expect(positions.get('user1')?.y).toBe(80); // 100 - 20
    });

    it('should move player DOWN', () => {
      const { addPosition, movePlayer, positions } = useGame(canvasRef);

      addPosition('user1', true);
      movePlayer('user1', 'DOWN');

      expect(positions.get('user1')?.y).toBe(120); // 100 + 20
    });

    it('should move player LEFT', () => {
      const { addPosition, movePlayer, positions } = useGame(canvasRef);

      addPosition('user1', true);
      movePlayer('user1', 'LEFT');

      expect(positions.get('user1')?.x).toBe(80); // 100 - 20
    });

    it('should move player RIGHT', () => {
      const { addPosition, movePlayer, positions } = useGame(canvasRef);

      addPosition('user1', true);
      movePlayer('user1', 'RIGHT');

      expect(positions.get('user1')?.x).toBe(120); // 100 + 20
    });

    it('should not crash when moving non-existent player', () => {
      const { movePlayer, positions } = useGame(canvasRef);

      movePlayer('nonexistent', 'UP');

      expect(positions.size).toBe(0);
    });
  });

  describe('removePosition', () => {
    it('should remove a player position', () => {
      const { addPosition, removePosition, positions } = useGame(canvasRef);

      addPosition('user1', true);
      expect(positions.has('user1')).toBe(true);

      removePosition('user1');
      expect(positions.has('user1')).toBe(false);
    });
  });

  describe('addEvent', () => {
    it('should add event to history', () => {
      const { addEvent, events } = useGame(canvasRef);

      addEvent('Test', 'green', 'Test message');

      expect(events.value).toHaveLength(1);
      expect(events.value[0]).toEqual({
        type: 'Test',
        color: 'green',
        message: 'Test message',
      });
    });
  });

  describe('clearEvents', () => {
    it('should clear all events', () => {
      const { addEvent, clearEvents, events } = useGame(canvasRef);

      addEvent('Test1', 'green', 'Message 1');
      addEvent('Test2', 'red', 'Message 2');

      expect(events.value).toHaveLength(2);

      clearEvents();

      expect(events.value).toHaveLength(0);
    });
  });

  describe('render', () => {
    it('should call clearRect and fillRect when rendering', () => {
      const { addPosition, render } = useGame(canvasRef);

      addPosition('user1', true);
      render();

      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });
});
