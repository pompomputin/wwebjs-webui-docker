<template>
  <section id="sendLocationPanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Send Location</h3>
    <form @submit.prevent="handleSendLocation" class="space-y-4">
      <div><label for="locRecipientNumber" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Recipient:</label><input type="text" id="locRecipientNumber" v-model="recipient" required class="form-input"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label for="locLatitudeInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Latitude:</label><input type="number" step="any" id="locLatitudeInput" v-model.number="latitude" required class="form-input" placeholder="e.g., 37.422"></div>
        <div><label for="locLongitudeInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Longitude:</label><input type="number" step="any" id="locLongitudeInput" v-model.number="longitude" required class="form-input" placeholder="e.g., -122.084"></div>
      </div>
      <div><label for="locDescriptionInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Description (Optional):</label><input type="text" id="locDescriptionInput" v-model="description" class="form-input" placeholder="Location Name"></div>
      <button type="submit" class="btn btn-orange" :disabled="isSending">{{ isSending ? 'Sending...' : 'Send Location' }}</button>
    </form>
    <p v-if="sendStatus" class="mt-3 text-sm" :class="sendStatusType === 'error' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'">{{ sendStatus }}</p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'; // Import watch
import { useSessionStore } from '../../stores/sessionStore';
import { sendLocationApi } from '../../services/api';

const sessionStore = useSessionStore();
const recipient = ref('');
const latitude = ref('');
const longitude = ref('');
const description = ref('');
const sendStatus = ref('');
const sendStatusType = ref('');
const isSending = ref(false);

watch(() => sessionStore.quickSendRecipientId, (newRecipientId) => {
  if (newRecipientId) {
    recipient.value = newRecipientId;
  }
});

watch(() => sessionStore.currentSelectedSessionId, (newSession) => {
    if (!newSession) recipient.value = ''; // Clear if session is deselected
});

async function handleSendLocation() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) { sendStatus.value = 'Select ready session.'; sendStatusType.value = 'error'; return; }
  if (!recipient.value.trim() || latitude.value === '' || longitude.value === '') { sendStatus.value = 'Recipient, lat, lon required.'; sendStatusType.value = 'error'; return; }
  isSending.value = true; sendStatus.value = 'Sending...'; sendStatusType.value = 'info';
  const result = await sendLocationApi(sessionStore.currentSelectedSessionId, recipient.value.trim(), parseFloat(latitude.value), parseFloat(longitude.value), description.value.trim());
  if (result.success) {
    sendStatus.value = result.message || 'Location sent!'; sendStatusType.value = 'success';
    // MODIFIED: Do not clear form
    // recipient.value = ''; latitude.value = ''; longitude.value = ''; description.value = '';
  } else { sendStatus.value = `Error: ${result.error || 'Failed.'}`; sendStatusType.value = 'error'; }
  isSending.value = false;
}
</script>
