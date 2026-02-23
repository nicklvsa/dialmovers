<template>
  <div class="game-canvas-container">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="game-canvas"
    ></canvas>
    <button type="button" @click="showHelp" class="help-button">Help / Info</button>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color enemy"></div>
        <span>Red Square = Enemy</span>
      </div>
      <div class="legend-item">
        <div class="legend-color caller"></div>
        <span>Green Square = You</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useCanvas } from '@/composables/useCanvas';

interface Props {
  width?: number;
  height?: number;
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
  show: true,
});

const emit = defineEmits<{
  (e: 'ready', context: CanvasRenderingContext2D): void;
}>();

const { canvasRef, context, clearCanvas, drawRect } = useCanvas(props.width, props.height);

const showHelp = () => {
  alert(
    'To connect your phone, dial into the game number.\n' +
    'When entering your phone number, do NOT include the "+1,(),-" characters!\n\n' +
    'Controls:\n' +
    '2 = UP\n' +
    '8 = DOWN\n' +
    '4 = LEFT\n' +
    '6 = RIGHT\n' +
    '* = Disconnect\n\n' +
    'NOTE: This game is under development!'
  );
};

// Emit when canvas is ready
watch(context, (ctx) => {
  if (ctx) {
    emit('ready', ctx);
  }
}, { immediate: true });

defineExpose({
  canvasRef,
  context,
  clearCanvas,
  drawRect,
});
</script>

<style scoped>
.game-canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.game-canvas {
  border: 2px solid #333;
  background-color: #f5f5f5;
}

.help-button {
  padding: 8px 16px;
  font-size: 12px;
  background-color: #555;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.help-button:hover {
  background-color: #333;
}

.legend {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border: 1px solid #333;
}

.legend-color.enemy {
  background-color: #FF0000;
}

.legend-color.caller {
  background-color: #009933;
}
</style>
