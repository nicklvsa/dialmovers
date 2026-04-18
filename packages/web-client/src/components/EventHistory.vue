<template>
  <div v-if="show" class="event-history">
    <h3>Event History</h3>
    <div class="event-list">
      <div
        v-for="(event, index) in events"
        :key="index"
        class="event-item"
        :style="{ backgroundColor: event.color }"
      >
        <strong>[{{ event.type }}]</strong> {{ event.message }}
      </div>
      <div v-if="events.length === 0" class="no-events">
        No events yet
      </div>
    </div>
    <button @click="handleClear" class="clear-button">Clear History</button>
  </div>
</template>

<script setup lang="ts">
import { GameEvent } from '@/types/events';

interface Props {
  show: boolean;
  events: GameEvent[];
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const handleClear = () => {
  emit('clear');
};
</script>

<style scoped>
.event-history {
  text-align: center;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 15px;
  background-color: white;
  min-width: 300px;
}

.event-history h3 {
  margin: 0 0 10px 0;
}

.event-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.event-item {
  margin-top: 5px;
  margin-bottom: 5px;
  padding: 8px;
  border-radius: 4px;
  text-align: left;
  font-size: 14px;
}

.no-events {
  padding: 20px;
  color: #666;
  font-style: italic;
}

.clear-button {
  padding: 8px 16px;
  font-size: 12px;
  background-color: #555;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.clear-button:hover {
  background-color: #333;
}
</style>
