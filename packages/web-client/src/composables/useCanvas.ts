import { ref, onMounted, Ref } from 'vue';

export function useCanvas(width = 800, height = 600) {
  const canvasRef = ref<HTMLCanvasElement>();
  const context = ref<CanvasRenderingContext2D | null>(null);

  onMounted(() => {
    if (canvasRef.value) {
      canvasRef.value.width = width;
      canvasRef.value.height = height;
      context.value = canvasRef.value.getContext('2d');
    }
  });

  const clearCanvas = () => {
    if (context.value && canvasRef.value) {
      context.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
    }
  };

  const drawRect = (x: number, y: number, width: number, height: number, color: string) => {
    if (context.value) {
      context.value.fillStyle = color;
      context.value.fillRect(x, y, width, height);
    }
  };

  const getCanvasSize = () => {
    return canvasRef.value ? { width: canvasRef.value.width, height: canvasRef.value.height } : null;
  };

  return {
    canvasRef,
    context,
    clearCanvas,
    drawRect,
    getCanvasSize,
  };
}
