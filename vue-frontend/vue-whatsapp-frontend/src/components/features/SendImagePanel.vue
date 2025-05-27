<template>
  <section id="sendImagePanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Send Image/Video</h3>
    <form @submit.prevent="handleSendMedia" class="space-y-4">
        <div>
            <label for="mediaRecipientNumber" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Recipient Number/ID:</label>
            <input type="text" id="mediaRecipientNumber" v-model="recipient" required class="form-input">
        </div>
        <div class="my-3"><span class="text-sm font-medium text-slate-600 dark:text-slate-400">Media Source:</span><div class="mt-1 flex items-center space-x-4"><label class="inline-flex items-center"><input type="radio" class="form-radio" name="imageSourceType" value="file" v-model="mediaSourceType" @change="onMediaSourceChange"><span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Upload File</span></label><label class="inline-flex items-center"><input type="radio" class="form-radio" name="imageSourceType" value="url" v-model="mediaSourceType" @change="onMediaSourceChange"><span class="ml-2 text-sm text-slate-700 dark:text-slate-300">From URL</span></label></div></div>
        <div v-show="mediaSourceType === 'file'" id="mediaFileUploadDiv">
            <label for="mediaFileInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media File (Image/Video):</label>
            <input type="file" id="mediaFileInput" @change="handleFileSelect" accept="image/*,video/*" class="file-input-styled">
        </div>
        <div v-show="mediaSourceType === 'url'" id="mediaUrlDiv">
            <label for="mediaUrlInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media URL (Image/Video):</label>
            <input type="url" id="mediaUrlInput" v-model="mediaUrl" class="form-input" placeholder="https://example.com/image.png">
        </div>
        <div><label for="mediaCaptionInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Caption (Optional):</label><input type="text" id="mediaCaptionInput" v-model="caption" class="form-input"></div>
        <button type="submit" class="btn btn-teal" :disabled="isSending">{{ isSending ? 'Sending Media...' : 'Send Media' }}</button>
    </form>
    <p v-if="sendStatus" class="mt-3 text-sm" :class="sendStatusType === 'error' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'">{{ sendStatus }}</p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'; // Import watch
import { useSessionStore } from '../../stores/sessionStore';
import { sendImageApi } from '../../services/api';

const sessionStore = useSessionStore();

const recipient = ref('');
const caption = ref('');
const mediaSourceType = ref('file');
const selectedFile = ref(null);
const mediaUrl = ref('');
const sendStatus = ref('');
const sendStatusType = ref('');
const isSending = ref(false);

// WATCH for quickSendRecipientId changes
watch(() => sessionStore.quickSendRecipientId, (newRecipientId) => {
  if (newRecipientId) {
    recipient.value = newRecipientId;
  }
});

watch(() => sessionStore.currentSelectedSessionId, (newSession) => {
    if (!newSession) { // No session selected
        recipient.value = '';
        // caption.value = ''; // Decide if caption should also clear on session change
        // mediaUrl.value = '';
        // selectedFile.value = null;
        // const fileInput = document.getElementById('mediaFileInput');
        // if(fileInput) fileInput.value = '';
    }
});


function handleFileSelect(event) { selectedFile.value = event.target.files[0] || null; }
function onMediaSourceChange() { if (mediaSourceType.value === 'file') { mediaUrl.value = ''; } else { selectedFile.value = null; const fileInput = document.getElementById('mediaFileInput'); if(fileInput) fileInput.value = ''; }}

async function handleSendMedia() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) { sendStatus.value = 'No active session.'; sendStatusType.value = 'error'; return; }
  if (!recipient.value.trim()) { sendStatus.value = 'Recipient required.'; sendStatusType.value = 'error'; return; }
  const formData = new FormData(); formData.append('number', recipient.value.trim()); formData.append('caption', caption.value.trim());
  if (mediaSourceType.value === 'file') { if (!selectedFile.value) { sendStatus.value = 'Media file required.'; sendStatusType.value = 'error'; return; } formData.append('imageFile', selectedFile.value);
  } else if (mediaSourceType.value === 'url') { if (!mediaUrl.value.trim()) { sendStatus.value = 'Media URL required.'; sendStatusType.value = 'error'; return; } formData.append('imageUrl', mediaUrl.value.trim());
  } else { sendStatus.value = 'Invalid media source.'; sendStatusType.value = 'error'; return; }
  isSending.value = true; sendStatus.value = 'Sending media...'; sendStatusType.value = 'info';
  const result = await sendImageApi(sessionStore.currentSelectedSessionId, formData);
  if (result.success) {
    sendStatus.value = result.message || 'Media sent!'; sendStatusType.value = 'success';
    // MODIFIED: Do not clear these fields to retain them
    // caption.value = '';
    // selectedFile.value = null;
    // mediaUrl.value = '';
    // const fileInput = document.getElementById('mediaFileInput');
    // if(fileInput) fileInput.value = '';
    // mediaSourceType.value = 'file'; // Optionally reset radio to default
  } else { sendStatus.value = `Error: ${result.error || 'Failed.'}`; sendStatusType.value = 'error'; }
  isSending.value = false;
}
</script>
