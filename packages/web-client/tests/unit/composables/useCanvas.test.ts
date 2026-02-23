import { describe, it, expect, vi } from 'vitest';
import { useCanvas } from '@/composables/useCanvas';

describe('useCanvas', () => {
  it('should create canvas ref', () => {
    const { canvasRef } = useCanvas();

    expect(canvasRef.value).toBeUndefined();
  });

  it('should have default canvas size', () => {
    const { getCanvasSize } = useCanvas();

    // Canvas ref is undefined initially
    expect(getCanvasSize()).toBeNull();
  });
});
