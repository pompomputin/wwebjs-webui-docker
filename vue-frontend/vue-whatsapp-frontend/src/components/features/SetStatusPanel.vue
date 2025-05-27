<template>
  <section id="setStatusPanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Set Your Status (About)</h3>
    <form @submit.prevent="handleSetStatus" class="space-y-4">
      <div>
        <label for="panelStatusMessageInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">New Status Message:</label>
        <input 
          type="text" 
          id="panelStatusMessageInput" 
          v-model="statusMessage" 
          class="form-input" 
          placeholder="Enter your new status..."
        >
      </div>
      <button 
        type="submit" 
        class="btn btn-indigo"
        :disabled="isSending"
      >
        {{ isSending ? 'Setting Status...' : 'Set Status' }}
      </button>
    </form>
    <p v-if="sendStatus" class="mt-3 text-sm" :class="sendStatusType === 'error' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'">
      {{ sendStatus }}
    </p>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useSessionStore } from '../../stores/sessionStore';
import { setStatusApi } from '../../services/api';

const sessionStore = useSessionStore();

const statusMessage = ref('');
const sendStatus = ref('');
const sendStatusType = ref(''); // 'success' or 'error'
const isSending = ref(false);

async function handleSetStatus() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) {
    sendStatus.value = 'Select a ready session first.';
    sendStatusType.value = 'error';
    return;
  }
  // Note: statusMessage can be an empty string to clear the status.
  // So, no explicit check for empty string here unless you want to prevent that.

  isSending.value = true;
  sendStatus.value = 'Setting status...';
  sendStatusType.value = 'info';

  const result = await setStatusApi(
    sessionStore.currentSelectedSessionId,
    statusMessage.value 
  );

  if (result.success) {
    sendStatus.value = result.message || 'Status updated successfully!';
    sendStatusType.value = 'success';
  } else {
    sendStatus.value = `Error: ${result.error || 'Could not set status.'}`;
    sendStatusType.value = 'error';
  }
  isSending.value = false;
}
</script>
