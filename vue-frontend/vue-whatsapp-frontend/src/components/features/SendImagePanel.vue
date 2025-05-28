<template>
  <section id="sendImagePanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Send Image/Video</h3>
    <form @submit.prevent="handleSendMedia" class="space-y-4">
        <div><label for="mediaRecipientNumber" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Recipient:</label><input type="text" id="mediaRecipientNumber" v-model="recipient" required class="form-input"></div>
        <div class="my-3"><span class="text-sm font-medium text-slate-600 dark:text-slate-400">Source:</span><div class="mt-1 flex items-center space-x-4"><label class="inline-flex items-center"><input type="radio" class="form-radio" name="imageSourceType" value="file" v-model="mediaSourceType" @change="onMediaSourceChange"><span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Upload</span></label><label class="inline-flex items-center"><input type="radio" class="form-radio" name="imageSourceType" value="url" v-model="mediaSourceType" @change="onMediaSourceChange"><span class="ml-2 text-sm text-slate-700 dark:text-slate-300">URL</span></label></div></div>
        <div v-show="mediaSourceType === 'file'"><label for="mediaFileInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media File:</label><input type="file" id="mediaFileInput" @change="handleFileSelect" accept="image/*,video/*" class="file-input-styled"></div>
        <div v-show="mediaSourceType === 'url'"><label for="mediaUrlInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media URL:</label><input type="url" id="mediaUrlInput" v-model="mediaUrl" class="form-input" placeholder="https://example.com/image.png"></div>
        <div><label for="mediaCaptionInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Caption (Optional):</label><input type="text" id="mediaCaptionInput" v-model="caption" class="form-input"></div>
        <button type="submit" class="btn btn-teal" :disabled="isSending">{{ isSending ? 'Sending Media...' : 'Send Media' }}</button>
    </form>
    <p v-if="sendStatus" class="mt-3 text-sm" :class="sendStatusType === 'error' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'">{{ sendStatus }}</p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useSessionStore } from '../../stores/sessionStore';
import { sendImageApi, sendTypingStateApi } from '../../services/api'; // Import sendTypingStateApi

const sessionStore = useSessionStore();
const recipient = ref(''); const caption = ref(''); const mediaSourceType = ref('file');
const selectedFile = ref(null); const mediaUrl = ref('');
const sendStatus = ref(''); const sendStatusType = ref(''); const isSending = ref(false);

watch(() => sessionStore.quickSendRecipientId, (newId) => { if (newId) recipient.value = newId; });
watch(() => sessionStore.currentSelectedSessionId, (newSess) => { if (!newSess) recipient.value = '';});

function handleFileSelect(event) { selectedFile.value = event.target.files[0] || null; }
function onMediaSourceChange() { if (mediaSourceType.value === 'file') { mediaUrl.value = ''; } else { selectedFile.value = null; const el = document.getElementById('mediaFileInput'); if(el) el.value = ''; }}

async function handleSendMedia() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) { sendStatus.value = 'No active session.'; sendStatusType.value = 'error'; return; }
  const currentRecipient = recipient.value.trim();
  if (!currentRecipient) { sendStatus.value = 'Recipient required.'; sendStatusType.value = 'error'; return; }
  const formData = new FormData(); formData.append('number', currentRecipient); formData.append('caption', caption.value.trim());
  if (mediaSourceType.value === 'file') { if (!selectedFile.value) { sendStatus.value = 'Media file required.'; sendStatusType.value = 'error'; return; } formData.append('imageFile', selectedFile.value);
  } else if (mediaSourceType.value === 'url') { if (!mediaUrl.value.trim()) { sendStatus.value = 'Media URL required.'; sendStatusType.value = 'error'; return; } formData.append('imageUrl', mediaUrl.value.trim());
  } else { sendStatus.value = 'Invalid media source.'; sendStatusType.value = 'error'; return; }
  isSending.value = true; sendStatus.value = 'Sending media...'; sendStatusType.value = 'info';
  try {
    if (sessionStore.sessionFeatureToggles.isTypingIndicatorEnabled) { // MODIFIED: Check toggle
      const typingChatId = currentRecipient.includes('@') ? currentRecipient : `${currentRecipient.replace(/\D/g, '')}@c.us`;
      await sendTypingStateApi(sessionStore.currentSelectedSessionId, typingChatId);
    }
    const result = await sendImageApi(sessionStore.currentSelectedSessionId, formData);
    if (result.success) { sendStatus.value = result.message || 'Media sent!'; sendStatusType.value = 'success'; /* Retain inputs */ } 
    else { sendStatus.value = `Error: ${result.error || 'Failed.'}`; sendStatusType.value = 'error'; }
  } catch (error) { console.error("Error sending media:", error); sendStatus.value = `Client error: ${error.message}`; sendStatusType.value = 'error'; }
  isSending.value = false;
}
</script>
