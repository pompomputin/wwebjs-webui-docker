<template>
  <section id="bulkSendPanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Bulk Send Message</h3>
    <form @submit.prevent="handleBulkSend" class="space-y-4" ref="bulkSendFormElement">
        <div>
            <label for="panelBulkRecipients" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Recipients (comma/newline):</label>
            <textarea id="panelBulkRecipients" v-model="recipients" rows="3" required class="form-textarea" placeholder="e.g., 123..., 456..."></textarea>
        </div>
        <div>
            <label for="panelBulkMessageText" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Message Text (Also used as caption if sending media):</label>
            <textarea id="panelBulkMessageText" v-model="messageText" rows="2" class="form-textarea"></textarea>
        </div>

        <div>
            <label for="panelBulkSendInterval" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Time Interval (seconds):</label>
            <input
                type="number"
                id="panelBulkSendInterval"
                v-model.number="sendIntervalSeconds"
                class="form-input"
                min="1"
                placeholder="e.g., 5"
                required
            />
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Delay in seconds between sending each message.</p>
        </div>

        <hr class="my-2 border-gray-200 dark:border-slate-700">
        <h4 class="text-base font-medium text-gray-600 dark:text-slate-300">Optional Media (Image/Video):</h4>
        <div class="my-2">
            <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Source:</span>
            <div class="mt-1 flex items-center space-x-4">
                <label class="inline-flex items-center">
                    <input type="radio" class="form-radio" name="bulkMediaSourceType" value="none" v-model="mediaSourceType" @change="onMediaSourceChange">
                    <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">None</span>
                </label>
                <label class="inline-flex items-center">
                    <input type="radio" class="form-radio" name="bulkMediaSourceType" value="file" v-model="mediaSourceType" @change="onMediaSourceChange">
                    <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Upload</span>
                </label>
                <label class="inline-flex items-center">
                    <input type="radio" class="form-radio" name="bulkMediaSourceType" value="url" v-model="mediaSourceType" @change="onMediaSourceChange">
                    <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">URL</span>
                </label>
            </div>
        </div>
        <div v-show="mediaSourceType === 'file'">
            <label for="panelBulkMediaFileInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media File:</label>
            <input type="file" id="panelBulkMediaFileInput" @change="handleFileSelect" accept="image/*,video/*" class="file-input-styled">
        </div>
        <div v-show="mediaSourceType === 'url'">
            <label for="panelBulkMediaUrlInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Media URL:</label>
            <input type="url" id="panelBulkMediaUrlInput" v-model="mediaUrl" class="form-input" placeholder="https://example.com/media.mp4">
        </div>

        <button v-if="!isSending" type="submit" class="btn btn-purple">Start Bulk Send</button>
        <button v-if="isSending" @click="stopBulkSendProcess" type="button" class="btn bg-red-600 hover:bg-red-700 focus:ring-red-500">
          Stop Bulk Send
        </button>
    </form>
    <div id="panelBulkSendResponse" class="mt-3 text-sm">
        <p :class="overallStatusType === 'error' ? 'text-red-500 dark:text-red-400' : (overallStatusType === 'success' ? 'text-green-500 dark:text-green-400' : (overallStatusType === 'warning' ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-600 dark:text-slate-400'))">{{ overallStatus }}</p>
        <div id="panelBulkSendResultsLog" class="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-700/40 rounded text-xs custom-scrollbar">
            <div v-for="(log, index) in resultsLog" :key="index" :class="log.type === 'error' ? 'text-red-500 dark:text-red-400' : (log.type === 'success' ? 'text-green-600 dark:text-green-400' : (log.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'))">{{ log.message }}</div>
        </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useSessionStore } from '../../stores/sessionStore';
import { sendMessageApi, sendImageApi, sendTypingStateApi, checkWhatsAppNumberApi } from '../../services/api';

const sessionStore = useSessionStore();
const recipients = ref('');
const messageText = ref('');
const mediaSourceType = ref('none');
const selectedMediaFile = ref(null);
const mediaUrl = ref('');
const sendIntervalSeconds = ref(5);

const isSending = ref(false);
const overallStatus = ref('Status will appear here.');
const overallStatusType = ref(''); // 'info', 'success', 'error', 'warning'
const resultsLog = ref([]);
const bulkSendFormElement = ref(null);
const forceStop = ref(false); // <-- New reactive variable for stopping

function handleFileSelect(event) { selectedMediaFile.value = event.target.files[0] || null; }
function onMediaSourceChange() {
  if (mediaSourceType.value === 'file') {
    mediaUrl.value = '';
  } else if (mediaSourceType.value === 'url') {
    selectedMediaFile.value = null;
    const fileInput = document.getElementById('panelBulkMediaFileInput');
    if (fileInput) fileInput.value = '';
  } else {
    selectedMediaFile.value = null;
    mediaUrl.value = '';
    const fileInput = document.getElementById('panelBulkMediaFileInput');
    if (fileInput) fileInput.value = '';
  }
}

// Helper function for creating an interruptible delay
async function interruptibleDelay(ms, stopFlagRef) {
  const step = 100; // Check for stop signal every 100ms
  let elapsed = 0;
  while (elapsed < ms) {
    if (stopFlagRef.value) {
      return true; // Indicates stopped
    }
    await new Promise(resolve => setTimeout(resolve, Math.min(step, ms - elapsed)));
    elapsed += step;
  }
  return false; // Indicates not stopped
}

// Method to signal stopping the bulk send
function stopBulkSendProcess() {
  forceStop.value = true;
  resultsLog.value.push({ message: `STOP signal received. Will halt after current operation or delay.`, type: 'warning' });
  overallStatus.value = 'Stopping bulk send...';
  overallStatusType.value = 'warning';
  // Note: The loop will stop and then re-enable the form.
  // If isSending is true, the stop button is visible. If the user clicks it,
  // forceStop becomes true, and the loop will break at the next check.
}

async function handleBulkSend() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) {
    overallStatus.value = 'Select a ready session first.';
    overallStatusType.value = 'error';
    return;
  }
  const recipientsArray = recipients.value.trim().split(/[\n,]+/).map(r => r.trim()).filter(r => r);
  if (recipientsArray.length === 0) {
    overallStatus.value = 'Recipients are required.';
    overallStatusType.value = 'error';
    return;
  }
  if (typeof sendIntervalSeconds.value !== 'number' || sendIntervalSeconds.value < 1) {
    overallStatus.value = 'Interval must be a number and at least 1 second.';
    overallStatusType.value = 'error';
    return;
  }

  const currentMessageText = messageText.value.trim();
  if (!currentMessageText && mediaSourceType.value === 'none') {
    overallStatus.value = 'Message text or media is required.';
    overallStatusType.value = 'error';
    return;
  }
  let currentMediaFile = selectedMediaFile.value;
  let currentMediaUrl = mediaUrl.value.trim();
  if (mediaSourceType.value === 'file' && !currentMediaFile) {
    overallStatus.value = 'Media file is required for upload source.';
    overallStatusType.value = 'error';
    return;
  }
  if (mediaSourceType.value === 'url' && !currentMediaUrl) {
    overallStatus.value = 'Media URL is required for URL source.';
    overallStatusType.value = 'error';
    return;
  }

  forceStop.value = false; // Reset stop flag at the beginning
  isSending.value = true;
  overallStatus.value = `Starting bulk send to ${recipientsArray.length} recipients...`;
  overallStatusType.value = 'info';
  resultsLog.value = [];
  // Form elements are implicitly disabled by the v-if on the submit button
  // and the stop button appearing. Or explicitly disable if needed:
  // if (bulkSendFormElement.value) bulkSendFormElement.value.querySelectorAll('input, textarea').forEach(el => el.disabled = true);
  
  let successes = 0, failures = 0;

  for (let i = 0; i < recipientsArray.length; i++) {
    if (forceStop.value) {
      resultsLog.value.push({ message: 'Bulk send process stopped by user.', type: 'warning' });
      break; 
    }

    const recipientTarget = recipientsArray[i];
    resultsLog.value.push({ message: `Processing ${i + 1}/${recipientsArray.length}: ${recipientTarget}... `, type: 'info' });
    let currentLogIndex = resultsLog.value.length - 1;
    let logEntry = resultsLog.value[currentLogIndex]; // Reference to modify

    let result = { success: false, error: 'No action taken' };
    let actionTaken = false;
    let logMessageSuffix = '';
    
    const recipientChatId = recipientTarget.includes('@') ? recipientTarget : `${recipientTarget.replace(/\D/g, '')}@c.us`;

    // Step 1: Check number
    logEntry.message += 'Checking... ';
    try {
      const checkResponse = await checkWhatsAppNumberApi(sessionStore.currentSelectedSessionId, recipientTarget);
      if (forceStop.value) { resultsLog.value.push({ message: 'Stopped after number check.', type: 'warning'}); break; }
      
      if (checkResponse.success && checkResponse.isRegistered) {
        logEntry.message += 'Registered. ';
      } else {
        logEntry.message += `Not registered (${checkResponse.error || 'Unknown reason'}). Skipping.`;
        logEntry.type = 'error';
        failures++;
        if (i < recipientsArray.length - 1) {
          if (await interruptibleDelay(sendIntervalSeconds.value * 1000, forceStop)) break;
        }
        continue; 
      }
    } catch (e) {
      logEntry.message += `Error checking: ${e.message}. Skipping.`;
      logEntry.type = 'error';
      failures++;
      if (i < recipientsArray.length - 1) {
        if (await interruptibleDelay(sendIntervalSeconds.value * 1000, forceStop)) break;
      }
      continue; 
    }

    // Step 2: Typing indicator
    if (sessionStore.sessionFeatureToggles.isTypingIndicatorEnabled) {
      try { 
        await sendTypingStateApi(sessionStore.currentSelectedSessionId, recipientChatId);
        if (forceStop.value) { resultsLog.value.push({ message: 'Stopped after typing indicator.', type: 'warning'}); break; }
      } catch (e) { console.warn(`Typing indicator failed for ${recipientChatId}`, e); }
    }

    // Step 3: Send Message/Media
    logEntry.message += 'Sending... ';
    if (mediaSourceType.value !== 'none') {
      actionTaken = true;
      const fd = new FormData();
      fd.append('number', recipientTarget);
      fd.append('caption', currentMessageText || ''); 
      if (currentMediaFile) fd.append('imageFile', currentMediaFile);
      else if (currentMediaUrl) fd.append('imageUrl', currentMediaUrl);
      
      result = await sendImageApi(sessionStore.currentSelectedSessionId, fd);
      if (forceStop.value) { resultsLog.value.push({ message: 'Stopped during media send.', type: 'warning'}); break; }
      logMessageSuffix = currentMessageText ? 'media with caption' : 'media';
    } else if (currentMessageText) {
      actionTaken = true;
      result = await sendMessageApi(sessionStore.currentSelectedSessionId, recipientTarget, currentMessageText);
      if (forceStop.value) { resultsLog.value.push({ message: 'Stopped during text send.', type: 'warning'}); break; }
      logMessageSuffix = 'text';
    }

    if (actionTaken) {
      if (result.success) {
        logEntry.message += `Sent ${logMessageSuffix}!`;
        logEntry.type = 'success';
        successes++;
      } else {
        logEntry.message += `Failed: ${result.error || 'Unknown error'}`;
        logEntry.type = 'error';
        failures++;
      }
    } else { 
      logEntry.message += 'Skipped (no action).';
      logEntry.type = 'info';
      failures++; 
    }
    
    overallStatus.value = `Processed ${i + 1}/${recipientsArray.length}. OK: ${successes}, Fail: ${failures}.`;

    if (i < recipientsArray.length - 1) {
      if (forceStop.value) break; // Check before starting delay
      resultsLog.value.push({ message: `Waiting ${sendIntervalSeconds.value}s...`, type: 'info' });
      const stoppedDuringDelay = await interruptibleDelay(sendIntervalSeconds.value * 1000, forceStop);
      if (stoppedDuringDelay) {
        resultsLog.value.push({ message: 'Stopped during delay.', type: 'warning' });
        break;
      }
    }
  }

  if (forceStop.value) {
      overallStatus.value = `Bulk send STOPPED by user. Total: ${recipientsArray.length} (processed up to point of stop). OK: ${successes}, Fail: ${failures}.`;
      overallStatusType.value = 'warning';
  } else {
      overallStatus.value = `Bulk send COMPLETE. Total: ${recipientsArray.length}, OK: ${successes}, Fail: ${failures}.`;
      overallStatusType.value = failures > 0 ? 'error' : (successes > 0 ? 'success' : 'info');
  }
  
  isSending.value = false;
  forceStop.value = false; // Reset for next time
  // Re-enable form elements if they were explicitly disabled:
  // if (bulkSendFormElement.value) bulkSendFormElement.value.querySelectorAll('input, textarea').forEach(el => el.disabled = false);
}
</script>
