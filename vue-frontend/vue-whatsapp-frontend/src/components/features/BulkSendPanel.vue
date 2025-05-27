<template>
  <section id="bulkSendPanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Bulk Send Message</h3>
    <form @submit.prevent="handleBulkSend" class="space-y-4" ref="bulkSendFormElement">
        <div><label for="panelBulkRecipients" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Recipients (comma/newline):</label><textarea id="panelBulkRecipients" v-model="recipients" rows="3" required class="form-textarea" placeholder="e.g., 123..., 456..."></textarea></div>
        <div><label for="panelBulkMessageText" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Message Text (Optional if media):</label><textarea id="panelBulkMessageText" v-model="messageText" rows="2" class="form-textarea"></textarea></div>
        <hr class="my-2 border-gray-200 dark:border-slate-700"><h4 class="text-base font-medium text-gray-600 dark:text-slate-300">Optional Media (Image/Video):</h4>
        <div class="my-2"><span class="text-sm font-medium text-slate-600 dark:text-slate-400">Source:</span><div class="mt-1 flex items-center space-x-4"><label class="inline-flex items-center"><input type="radio" class="form-radio" name="bulkMediaSourceType" value="none" v-model="mediaSourceType" @change="onMediaSourceChange"><span class="ml-2 text-sm text-slate-700 dark:text-slate-300">None</span></label><label class="inline-flex items-center"><input type="radio" class="form-radio" name="bulkMediaSourceType" value="file" v-model="mediaSourceType" @change="onMediaSourceChange"><span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Upload</span></label><label class="inline-flex items-center"><input type="radio" class="form-radio" name="bulkMediaSourceType" value="url" v-model="mediaSourceType" @change="onMediaSourceChange"><span class="ml-2 text-sm text-slate-700 dark:text-slate-300">URL</span></label></div></div>
        <div v-show="mediaSourceType === 'file'" id="panelBulkMediaFileUploadDiv"><label for="panelBulkMediaFileInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media File:</label><input type="file" id="panelBulkMediaFileInput" @change="handleFileSelect" accept="image/*,video/*" class="file-input-styled"></div>
        <div v-show="mediaSourceType === 'url'" id="panelBulkMediaUrlDiv"><label for="panelBulkMediaUrlInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media URL:</label><input type="url" id="panelBulkMediaUrlInput" v-model="mediaUrl" class="form-input" placeholder="https://example.com/media.mp4"></div>
        <div><label for="panelBulkMediaCaptionInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media Caption:</label><input type="text" id="panelBulkMediaCaptionInput" v-model="mediaCaption" class="form-input"></div>
        <button type="submit" class="btn btn-purple" :disabled="isSending">{{ isSending ? 'Sending Bulk...' : 'Start Bulk Send' }}</button>
    </form>
    <div id="panelBulkSendResponse" class="mt-3 text-sm">
      <p :class="overallStatusType === 'error' ? 'text-red-500 dark:text-red-400' : (overallStatusType === 'success' ? 'text-green-500 dark:text-green-400' : 'text-slate-600 dark:text-slate-400')">{{ overallStatus }}</p>
      <div id="panelBulkSendResultsLog" class="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-700/40 rounded text-xs custom-scrollbar">
        <div v-for="(log, index) in resultsLog" :key="index" :class="log.type === 'error' ? 'text-red-500 dark:text-red-400' : (log.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400')">{{ log.message }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'; // Removed watch as quickSendRecipientId is less relevant for bulk recipients
import { useSessionStore } from '../../stores/sessionStore';
import { sendMessageApi, sendImageApi } from '../../services/api';

const sessionStore = useSessionStore();

const recipients = ref('');
const messageText = ref('');
const mediaSourceType = ref('none');
const selectedMediaFile = ref(null);
const mediaUrl = ref('');
const mediaCaption = ref('');
const isSending = ref(false);
const overallStatus = ref('Status will appear here.');
const overallStatusType = ref('');
const resultsLog = ref([]);
const bulkSendFormElement = ref(null); // Ref for the form element

function handleFileSelect(event) { selectedMediaFile.value = event.target.files[0] || null; }
function onMediaSourceChange() { /* ... (same as before, no change) ... */ if (mediaSourceType.value === 'file') { mediaUrl.value = ''; } else if (mediaSourceType.value === 'url') { selectedMediaFile.value = null; const fileInput = document.getElementById('panelBulkMediaFileInput'); if(fileInput) fileInput.value = ''; } else { selectedMediaFile.value = null; mediaUrl.value = ''; const fileInput = document.getElementById('panelBulkMediaFileInput'); if(fileInput) fileInput.value = ''; }}

async function handleBulkSend() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) { overallStatus.value = 'Select a ready session first.'; overallStatusType.value = 'error'; return; }
  const recipientsArray = recipients.value.trim().split(/[\n,]+/).map(r => r.trim()).filter(r => r);
  if (recipientsArray.length === 0) { overallStatus.value = 'Recipients are required.'; overallStatusType.value = 'error'; return; }
  if (!messageText.value.trim() && mediaSourceType.value === 'none') { overallStatus.value = 'Message text or media is required.'; overallStatusType.value = 'error'; return; }
  let currentMediaFile = selectedMediaFile.value; let currentMediaUrl = mediaUrl.value.trim();
  if (mediaSourceType.value === 'file' && !currentMediaFile) { overallStatus.value = 'Media file is required for upload.'; overallStatusType.value = 'error'; return; }
  if (mediaSourceType.value === 'url' && !currentMediaUrl) { overallStatus.value = 'Media URL is required.'; overallStatusType.value = 'error'; return; }

  isSending.value = true; overallStatus.value = `Starting bulk send to ${recipientsArray.length} recipients...`; overallStatusType.value = 'info'; resultsLog.value = [];
  if (bulkSendFormElement.value) bulkSendFormElement.value.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
  
  let successes = 0, failures = 0;
  for (let i = 0; i < recipientsArray.length; i++) {
    const recipientTarget = recipientsArray[i];
    resultsLog.value.push({ message: `Sending to ${recipientTarget}... `, type: 'info' });
    let result = { success: false, error: 'No action' }, actionTaken = false, logMessageSuffix = '';
    if (mediaSourceType.value !== 'none') {
      actionTaken = true; const fd = new FormData(); fd.append('number', recipientTarget); fd.append('caption', messageText.value.trim() || mediaCaption.value.trim());
      if (currentMediaFile) fd.append('imageFile', currentMediaFile); else if (currentMediaUrl) fd.append('imageUrl', currentMediaUrl);
      result = await sendImageApi(sessionStore.currentSelectedSessionId, fd);
      logMessageSuffix = mediaCaption.value.trim() || messageText.value.trim() ? 'media with caption' : 'media';
    } else if (messageText.value.trim()) {
      actionTaken = true; result = await sendMessageApi(sessionStore.currentSelectedSessionId, recipientTarget, messageText.value.trim());
      logMessageSuffix = 'text message';
    }
    if (actionTaken) {
      const logIndex = resultsLog.value.length -1; // Get the current log entry index
      if (result.success) { resultsLog.value[logIndex].message += `Sent ${logMessageSuffix} successfully!`; resultsLog.value[logIndex].type = 'success'; successes++; }
      else { resultsLog.value[logIndex].message += `Failed: ${result.error || 'Unknown'}`; resultsLog.value[logIndex].type = 'error'; failures++; }
    } else { resultsLog.value[resultsLog.value.length - 1].message += 'Skipped.'; resultsLog.value[resultsLog.value.length - 1].type = 'info';}
    overallStatus.value = `Processed ${i+1}/${recipientsArray.length}. Success: ${successes}, Fail: ${failures}.`;
    if (i < recipientsArray.length - 1) await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  }
  overallStatus.value = `Bulk send done. Total: ${recipientsArray.length}, Success: ${successes}, Fail: ${failures}.`;
  overallStatusType.value = failures > 0 ? 'error' : 'success';
  isSending.value = false;
  if (bulkSendFormElement.value) bulkSendFormElement.value.querySelectorAll('input, textarea, button').forEach(el => el.disabled = false);
  // Do not clear recipients, messageText, or mediaCaption to allow modifications for next send
  // selectedMediaFile.value = null; // Keep file if user wants to resend to modified list
  // mediaUrl.value = ''; // Keep URL
  // if (ui.bulkMediaFileInput) ui.bulkMediaFileInput.value = ''; // Keep file input selection
}
</script>
