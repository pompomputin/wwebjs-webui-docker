<template>
  <section id="sendMessagePanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Send Text Message</h3>
    <form @submit.prevent="handleSendMessage" class="space-y-4">
      <div>
        <label for="panelRecipientNumber" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Recipient Number/ID:</label>
        <input 
          type="text" 
          id="panelRecipientNumber" 
          v-model="recipient" 
          required 
          class="form-input" 
          placeholder="e.g., 123... or group@g.us"
        >
      </div>
      <div>
        <label for="panelMessageText" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Message:</label>
        <textarea 
          id="panelMessageText" 
          v-model="message" 
          rows="3" 
          required 
          class="form-textarea" 
          placeholder="Type your message..."
        ></textarea>
      </div>
      <button 
        type="submit" 
        class="btn btn-green"
        :disabled="isSending"
      >
        {{ isSending ? 'Sending...' : 'Send Message' }}
      </button>
    </form>
    <p v-if="sendStatus" class="mt-3 text-sm" :class="sendStatusType === 'error' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'">
      {{ sendStatus }}
    </p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'; // Import watch
import { useSessionStore } from '../../stores/sessionStore';
import { sendMessageApi } from '../../services/api';

const sessionStore = useSessionStore();

const recipient = ref('');
const message = ref('');
const sendStatus = ref('');
const sendStatusType = ref(''); 
const isSending = ref(false);

// WATCH for quickSendRecipientId changes to auto-fill recipient
watch(() => sessionStore.quickSendRecipientId, (newRecipientId) => {
  if (newRecipientId) {
    recipient.value = newRecipientId;
    // Decide if you want to clear it from the store immediately after filling
    // sessionStore.setQuickSendRecipient(null); 
  }
});

// Also, when selected session changes, clear this panel's recipient if it's not from quick send
watch(() => sessionStore.currentSelectedSessionId, (newSession) => {
    if (newSession) { // New session selected
        // If quickSendRecipientId is not already set for this new session context, clear it.
        // Or, you might decide to always clear recipient when session changes,
        // and rely on chat click to re-populate.
        if (recipient.value !== sessionStore.quickSendRecipientId) {
             // This logic might need refinement based on desired UX for session switching
        }
    } else { // No session selected
        recipient.value = '';
        message.value = '';
    }
});


async function handleSendMessage() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) {
    sendStatus.value = 'No active and ready session selected.';
    sendStatusType.value = 'error';
    return;
  }
  if (!recipient.value.trim() || !message.value.trim()) {
    sendStatus.value = 'Recipient and message are required.';
    sendStatusType.value = 'error';
    return;
  }

  isSending.value = true;
  sendStatus.value = 'Sending...';
  sendStatusType.value = 'info';

  const result = await sendMessageApi(
    sessionStore.currentSelectedSessionId,
    recipient.value.trim(),
    message.value.trim()
  );

  if (result.success) {
    sendStatus.value = result.message || 'Message sent successfully!';
    sendStatusType.value = 'success';
    // message.value = ''; // MODIFIED: Do not clear message
    // recipient.value = ''; // MODIFIED: Do not clear recipient
  } else {
    sendStatus.value = `Error: ${result.error || 'Failed to send message.'}`;
    sendStatusType.value = 'error';
  }
  isSending.value = false;
}
</script>
