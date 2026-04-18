<template>
  <div class="connection-panel">
    <input
      v-model="phoneNumber"
      type="text"
      placeholder="Your phone number (10 digits)"
      :disabled="isConnected"
      class="phone-input"
      maxlength="10"
    />
    <button
      type="button"
      @click="handleConnect"
      :disabled="!isValidPhone || isConnected"
      class="connect-button"
    >
      {{ isConnected ? 'Disconnect!' : 'Connect!' }}
    </button>
    <div class="checkbox-container">
      <label>
        <input type="checkbox" v-model="showEventHistory" />
        Show Event History
      </label>
    </div>
    <div v-if="gameID" class="game-id-display">
      <strong>Game ID: {{ gameID }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const emit = defineEmits<{
  (e: 'connect', phoneNumber: string, gameID: string): void;
  (e: 'disconnect'): void;
}>();

const phoneNumber = ref('');
const gameID = ref('');
const isConnected = ref(false);
const showEventHistory = ref(false);

const isValidPhone = computed(() => {
  return phoneNumber.value.length === 10 && /^\d{10}$/.test(phoneNumber.value);
});

const generateGameID = (): string => {
  return (Math.floor(Math.random() * 100000) + 1).toString();
};

const handleConnect = () => {
  if (!isConnected.value) {
    // Connect
    if (!gameID.value) {
      gameID.value = generateGameID();
    }
    isConnected.value = true;
    emit('connect', phoneNumber.value, gameID.value);
  } else {
    // Disconnect
    isConnected.value = false;
    phoneNumber.value = '';
    gameID.value = '';
    emit('disconnect');
  }
};

defineExpose({
  isConnected,
  showEventHistory,
});
</script>

<style scoped>
.connection-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.phone-input {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 250px;
}

.connect-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #009933;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.connect-button:hover:not(:disabled) {
  background-color: #007722;
}

.connect-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 5px;
}

.game-id-display {
  font-size: 18px;
  color: #333;
}
</style>
