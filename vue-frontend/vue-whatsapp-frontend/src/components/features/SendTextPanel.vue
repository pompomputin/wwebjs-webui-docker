<template>
  <section id="sendMessagePanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Send Text Message</h3>
    <form @submit.prevent="handleSendMessage" class="space-y-4">
      <div>
        <label for="panelRecipientNumber" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Recipient Number/ID:</label>
        <input type="text" id="panelRecipientNumber" v-model="recipient" required class="form-input" placeholder="e.g., 123... or group@g.us">
      </div>
      <div>
        <label for="panelMessageText" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Message:</label>
        <textarea id="panelMessageText" v-model="message" rows="3" required class="form-textarea" placeholder="Type your message..."></textarea>
      </div>
      <button type="submit" class="btn btn-green" :disabled="isSending">{{ isSending ? 'Sending...' : 'Send Message' }}</button>
    </form>
    <p v-if="sendStatus" class="mt-3 text-sm" :class="sendStatusType === 'error' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'">{{ sendStatus }}</p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useSessionStore } from '../../stores/sessionStore';
import { sendMessageApi, sendTypingStateApi } from '../../services/api'; // Import sendTypingStateApi

const sessionStore = useSessionStore();
const recipient = ref('');
const message = ref('');
const sendStatus = ref('');
const sendStatusType = ref(''); 
const isSending = ref(false);

watch(() => sessionStore.quickSendRecipientId, (newRecipientId) => { if (newRecipientId) recipient.value = newRecipientId; });
watch(() => sessionStore.currentSelectedSessionId, (newSession) => { if (!newSession) recipient.value = '';});

async function handleSendMessage() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) { sendStatus.value = 'No active session.'; sendStatusType.value = 'error'; return; }
  const currentRecipient = recipient.value.trim(); const currentMessage = message.value.trim();
  if (!currentRecipient || !currentMessage) { sendStatus.value = 'Recipient & message required.'; sendStatusType.value = 'error'; return; }
  isSending.value = true; sendStatus.value = 'Sending...'; sendStatusType.value = 'info';
  try {
    if (sessionStore.sessionFeatureToggles.isTypingIndicatorEnabled) { // MODIFIED: Check toggle
      const typingChatId = currentRecipient.includes('@') ? currentRecipient : `${currentRecipient.replace(/\D/g, '')}@c.us`;
      await sendTypingStateApi(sessionStore.currentSelectedSessionId, typingChatId);
    }
    const result = await sendMessageApi(sessionStore.currentSelectedSessionId, currentRecipient, currentMessage);
    if (result.success) { sendStatus.value = result.message || 'Sent!'; sendStatusType.value = 'success'; /* message.value = ''; Retain inputs */ } 
    else { sendStatus.value = `Error: ${result.error || 'Failed.'}`; sendStatusType.value = 'error'; }
  } catch (error) { console.error("Error sending text:", error); sendStatus.value = `Client error: ${error.message}`; sendStatusType.value = 'error'; }
  isSending.value = false;
}
</script>
