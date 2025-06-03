<template>
  <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 relative w-11/12 max-w-md">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Add New Session</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Enter a unique ID for your new WhatsApp session. This ID will be used to identify your device.
      </p>
      
      <div class="mb-4">
        <label for="newSessionIdInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session ID:</label>
        <input
          type="text"
          id="newSessionIdInput"
          v-model="newSessionId"
          @keyup.enter="confirmAdd"
          placeholder="e.g., mydevice1, client_office"
          class="form-input"
        />
        <p v-if="errorMessage" class="text-red-500 text-xs mt-1">{{ errorMessage }}</p>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button @click="cancelAdd" class="btn btn-light !w-auto px-4 py-2">
          Cancel
        </button>
        <button @click="confirmAdd" :disabled="!newSessionId.trim()" class="btn btn-indigo !w-auto px-4 py-2">
          Add Session
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const newSessionId = ref('');
const errorMessage = ref('');

const emit = defineEmits(['confirm', 'cancel']);

const confirmAdd = () => {
  if (!newSessionId.value.trim()) {
    errorMessage.value = 'Session ID cannot be empty.';
    return;
  }
  // Basic validation: prevent spaces or special characters except hyphens/underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(newSessionId.value.trim())) {
    errorMessage.value = 'Session ID can only contain letters, numbers, hyphens, and underscores.';
    return;
  }
  
  emit('confirm', newSessionId.value.trim().toLowerCase());
  newSessionId.value = ''; // Clear input after confirming
  errorMessage.value = '';
};

const cancelAdd = () => {
  emit('cancel');
  newSessionId.value = ''; // Clear input on cancel
  errorMessage.value = '';
};

// Clear error message when user starts typing again
watch(newSessionId, () => {
  if (errorMessage.value) {
    errorMessage.value = '';
  }
});
</script>

<style scoped>
/* No specific styles needed here, Tailwind handles most styling */
</style>
