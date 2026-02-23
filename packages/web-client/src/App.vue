<template>
  <div id="app">
    <h1>DialMovers Game</h1>
    <ConnectionPanel
      ref="connectionPanelRef"
      @connect="handleConnect"
      @disconnect="handleDisconnect"
    />
    <div v-if="isConnected" class="game-content">
      <GameCanvas
        ref="gameCanvasRef"
        :show="isConnected"
        @ready="handleCanvasReady"
      />
      <EventHistory
        :show="showEventHistory"
        :events="gameEvents"
        @clear="handleClearEvents"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWebSocket } from '@/composables/useWebSocket';
import { useGame } from '@/composables/useGame';
import ConnectionPanel from '@/components/ConnectionPanel.vue';
import GameCanvas from '@/components/GameCanvas.vue';
import EventHistory from '@/components/EventHistory.vue';
import type { SocketEvent } from '@/types/events';

const connectionPanelRef = ref<InstanceType<typeof ConnectionPanel> | null>(null);
const gameCanvasRef = ref<InstanceType<typeof GameCanvas> | null>(null);

const isConnected = ref(false);
const showEventHistory = ref(false);
const gameEvents = ref<any[]>([]);

let wsUrl: string;
let userId: string;
let gameID: string;

const { positions, events, addEvent, clearEvents, handleSocketEvent } = useGame(ref(undefined));

const handleCanvasReady = (ctx: CanvasRenderingContext2D) => {
  console.log('Canvas ready:', ctx);
};

const formatUserId = (phone: string): string => {
  return `+1${phone}:client`;
};

const isCaller = (callerId: string): boolean => {
  const stripped = callerId.split(':');
  return stripped[0] === `+1${userId}` && stripped[1] === 'caller';
};

const handleConnect = async (phone: string, id: string) => {
  userId = phone;
  gameID = id;
  wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8081';

  try {
    const { connect, on } = useWebSocket(wsUrl, formatUserId(userId));

    await connect();
    isConnected.value = true;
    showEventHistory.value = connectionPanelRef.value?.showEventHistory || false;

    // Listen for events
    on('connect', (event: SocketEvent) => {
      handleSocketEvent(event, isCaller);
      gameEvents.value = [...events.value];
    });

    on('disconnect', (event: SocketEvent) => {
      handleSocketEvent(event, isCaller);
      gameEvents.value = [...events.value];
    });

    on('game:join', (event: SocketEvent) => {
      handleSocketEvent(event, isCaller);
      gameEvents.value = [...events.value];
    });

    on('game:move', (event: SocketEvent) => {
      handleSocketEvent(event, isCaller);
      gameEvents.value = [...events.value];
    });

    // Join the game
    connect();
  } catch (error) {
    console.error('Failed to connect:', error);
    alert('Failed to connect to game server. Please try again.');
  }
};

const handleDisconnect = () => {
  isConnected.value = false;
  showEventHistory.value = false;
  clearEvents();
};

const handleClearEvents = () => {
  clearEvents();
  gameEvents.value = [];
};
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.game-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

@media (min-width: 768px) {
  .game-content {
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
  }
}
</style>
