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
      <button type="submit" class="btn btn-green" :disabled="isSending">{{ isSending ? 'Processing...' : 'Send Message' }}</button>
    </form>
    <p v-if="sendStatus" class="mt-3 text-sm" :class="sendStatusType === 'error' ? 'text-red-500 dark:text-red-400' : (sendStatusType === 'success' ? 'text-green-500 dark:text-green-400' : 'text-slate-600 dark:text-slate-400')">{{ sendStatus }}</p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'; //
import { useSessionStore } from '../../stores/sessionStore'; //
// Import checkWhatsAppNumberApi
import { sendMessageApi, sendTypingStateApi, checkWhatsAppNumberApi } from '../../services/api'; // sendMessageApi, sendTypingStateApi

const sessionStore = useSessionStore(); //
const recipient = ref(''); //
const message = ref(''); //
const sendStatus = ref(''); //
const sendStatusType = ref(''); //
const isSending = ref(false); //

watch(() => sessionStore.quickSendRecipientId, (newRecipientId) => { if (newRecipientId) recipient.value = newRecipientId; }); //
watch(() => sessionStore.currentSelectedSessionId, (newSession) => { if (!newSession) { recipient.value = ''; sendStatus.value = ''; sendStatusType.value = ''; } }); //

async function handleSendMessage() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) { //
    sendStatus.value = 'No active session or session not ready.'; //
    sendStatusType.value = 'error'; //
    return;
  }
  const currentRecipient = recipient.value.trim(); //
  const currentMessage = message.value.trim(); //
  if (!currentRecipient || !currentMessage) { //
    sendStatus.value = 'Recipient & message required.'; //
    sendStatusType.value = 'error'; //
    return;
  }

  isSending.value = true; //
  sendStatus.value = `Checking number ${currentRecipient}...`; //
  sendStatusType.value = 'info'; //

  try {
    // Step 1: Check if number is registered
    const checkRes = await checkWhatsAppNumberApi(sessionStore.currentSelectedSessionId, currentRecipient);

    if (checkRes.success && checkRes.isRegistered) {
      sendStatus.value = `Number ${currentRecipient} is registered. Sending message...`;
      sendStatusType.value = 'info';
      
      // Step 2: Send Typing Indicator (if enabled)
      const typingChatId = currentRecipient.includes('@') ? currentRecipient : `${currentRecipient.replace(/\D/g, '')}@c.us`; //
      if (sessionStore.sessionFeatureToggles.isTypingIndicatorEnabled) { //
        try {
          await sendTypingStateApi(sessionStore.currentSelectedSessionId, typingChatId); //
        } catch (typingError) {
          console.warn("Could not send typing state:", typingError);
        }
      }
      
      // Step 3: Send Message
      const result = await sendMessageApi(sessionStore.currentSelectedSessionId, currentRecipient, currentMessage); //
      if (result.success) { //
        sendStatus.value = result.message || 'Message Sent!'; //
        sendStatusType.value = 'success'; //
        // message.value = ''; // Retain inputs as per original //
      } else {
        sendStatus.value = `Error sending: ${result.error || 'Failed.'}`; //
        sendStatusType.value = 'error'; //
      }
    } else if (checkRes.success && !checkRes.isRegistered) {
      sendStatus.value = `Number ${currentRecipient} is not registered on WhatsApp. (Reason: ${checkRes.message || 'Not registered'}). Message not sent.`;
      sendStatusType.value = 'error';
    } else { // checkRes.success is false or other issues
      sendStatus.value = `Could not verify number ${currentRecipient}: ${checkRes.error || 'Unknown error during check'}. Message not sent.`;
      sendStatusType.value = 'error';
    }
  } catch (error) {
    console.error("Error sending text:", error); //
    sendStatus.value = `Client error: ${error.message}`; //
    sendStatusType.value = 'error'; //
  }
  isSending.value = false; //
}
</script>