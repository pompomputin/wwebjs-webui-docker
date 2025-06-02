<template>
  <div class="p-4 md:p-6 bg-white dark:bg-slate-800 shadow-lg rounded-lg feature-panel">
    <h2 class="text-xl md:text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
      Bulk Check WhatsApp Numbers
    </h2>

    <div class="space-y-6">
      <div>
        <label for="numbersToCheckBulk" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Numbers to Check (comma/newline separated)
        </label>
        <textarea
          id="numbersToCheckBulk"
          v-model="numbersInput"
          rows="8"
          class="form-textarea custom-scrollbar"
          placeholder="e.g., 1234567890, 0987654321&#10;5551234567"
          :disabled="isChecking"
        ></textarea>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter phone numbers separated by commas or newlines.</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          @click="performBulkCheck"
          :disabled="isChecking || !sessionStore.selectedSessionData?.isReady || !numbersInput.trim()"
          class="btn btn-teal w-full sm:w-auto flex-grow sm:flex-grow-0" 
        >
          <span v-if="isChecking">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking...
          </span>
          <span v-else-if="resumeIndex > 0 && !isChecking">Resume Check (from #{{ resumeIndex + 1 }})</span>
          <span v-else>Start Number Check</span>
        </button>

        <button
          v-if="isChecking"
          @click="handleStopCheck"
          class="btn w-full sm:w-auto flex-grow sm:flex-grow-0 bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 text-white"
        >
          Stop Check
        </button>
      </div>
       <div class="mt-2">
          <p v-if="!sessionStore.selectedSessionData?.isReady && sessionStore.currentSelectedSessionId" class="text-sm text-orange-500 dark:text-orange-400">
            Selected session ({{ sessionStore.currentSelectedSessionId }}) is not ready.
          </p>
          <p v-else-if="!sessionStore.currentSelectedSessionId" class="text-sm text-orange-500 dark:text-orange-400">
            No session selected. Please select or initialize a session first.
          </p>
       </div>
    </div>
      <p v-if="overallStatus" class="mt-4 text-sm text-slate-600 dark:text-slate-300">{{ overallStatus }}</p>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useBulkCheckStore } from '@/stores/bulkCheckStore';
import { checkWhatsAppNumberApi } from '@/services/api';

const sessionStore = useSessionStore();
const bulkCheckStore = useBulkCheckStore();

const numbersInput = ref('');
const isChecking = ref(false);
const overallStatus = ref('');
const stopRequested = ref(false);
const resumeIndex = ref(0); 

const parseNumbers = (input) => {
  if (!input) return [];
  return input
    .split(/[,;\n]+/)
    .map(num => num.trim().replace(/\D/g, '')) 
    .filter(num => num.length > 0);
};

watch(numbersInput, (newVal, oldVal) => {
  if (newVal.trim() !== oldVal.trim() && !isChecking.value) { 
    resumeIndex.value = 0;
    overallStatus.value = 'Number list changed. Any new check will start from the beginning.';
    bulkCheckStore.clearBulkCheckResults(); 
    console.log('Numbers input changed, resumeIndex reset.');
  }
});

const handleStopCheck = () => {
  stopRequested.value = true;
  overallStatus.value = 'Stop signal received. Finishing current number and pausing...';
};

const performBulkCheck = async () => {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) {
    overallStatus.value = 'Session not selected or not ready for checking numbers.';
    return;
  }
  const allParsedNumbers = parseNumbers(numbersInput.value);
  if (allParsedNumbers.length === 0) {
    overallStatus.value = 'No valid numbers to check.';
    resumeIndex.value = 0; 
    bulkCheckStore.clearBulkCheckResults();
    return;
  }

  isChecking.value = true;
  stopRequested.value = false;

  if (resumeIndex.value === 0) {
    bulkCheckStore.startNewBulkCheck(); 
    overallStatus.value = `Starting new check for ${allParsedNumbers.length} numbers...`;
  } else {
    overallStatus.value = `Resuming check from number ${resumeIndex.value + 1} of ${allParsedNumbers.length}...`;
  }
  
  for (let i = resumeIndex.value; i < allParsedNumbers.length; i++) {
    const number = allParsedNumbers[i];

    if (stopRequested.value) {
      overallStatus.value = `Check paused. Processed ${bulkCheckStore.registeredNumbers.length + bulkCheckStore.unregisteredNumbers.length} of ${allParsedNumbers.length}. Ready to resume from number ${i + 1}.`;
      resumeIndex.value = i; 
      break; 
    }

    if (!sessionStore.currentSelectedSessionId) { 
      overallStatus.value = 'Session changed or removed during checks. Aborting.';
      resumeIndex.value = i; 
      break; 
    }

    let currentStatusUpdate = `Checking ${i + 1}/${allParsedNumbers.length}: ${number}...`;
    overallStatus.value = currentStatusUpdate;

    try {
      const response = await checkWhatsAppNumberApi(sessionStore.currentSelectedSessionId, number);
      
      if (stopRequested.value && i < allParsedNumbers.length -1 ) {
         resumeIndex.value = i;
      } else {
        if (response.success && response.isRegistered) {
          bulkCheckStore.addRegisteredNumber(number); 
          overallStatus.value = `${currentStatusUpdate} Registered.`;
        } else if (response.success && !response.isRegistered) {
          bulkCheckStore.addUnregisteredNumber({ number, reason: 'Not registered' }); 
          overallStatus.value = `${currentStatusUpdate} Not Registered.`;
        } else { 
          bulkCheckStore.addUnregisteredNumber({ number, reason: response.error || 'Failed to check (API error)' });
          overallStatus.value = `${currentStatusUpdate} Error: ${response.error || 'API Error'}.`;
        }
      }
    } catch (error) { 
       if (!stopRequested.value) {
        bulkCheckStore.addUnregisteredNumber({ number, reason: error.message || 'Network error' });
        overallStatus.value = `${currentStatusUpdate} Error: ${error.message || 'Network Error'}.`;
      }
    }
  } 

  isChecking.value = false; 
  
  if (!stopRequested.value) { 
    overallStatus.value = `Bulk check complete. Processed ${allParsedNumbers.length} numbers.`;
    resumeIndex.value = 0; 
  }
  
  bulkCheckStore.setBulkCheckComplete();
};

onMounted(() => {
  bulkCheckStore.setIsCheckingActive(true);
});

onUnmounted(() => {
  bulkCheckStore.setIsCheckingActive(false);
  if (isChecking.value) {
    stopRequested.value = true;
  }
});

</script>

<style scoped>
/* Add any specific styles for this panel if needed */
.feature-panel {
}
</style>
