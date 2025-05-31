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
          <span v-else>Start Number Check</span>
        </button>

        <button
          v-if="isChecking"
          @click="handleStopCheck"
          class="btn btn-red w-full sm:w-auto flex-grow sm:flex-grow-0"
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useBulkCheckStore } from '@/stores/bulkCheckStore';
import { checkWhatsAppNumberApi } from '@/services/api';

const sessionStore = useSessionStore();
const bulkCheckStore = useBulkCheckStore();

const numbersInput = ref('');
const isChecking = ref(false);
const overallStatus = ref('');
const stopRequested = ref(false); // <-- NEW: Flag to signal stop

const parseNumbers = (input) => {
  if (!input) return [];
  return input
    .split(/[,;\n]+/)
    .map(num => num.trim().replace(/\D/g, ''))
    .filter(num => num.length > 0);
};

// NEW: Function to handle stop button click
const handleStopCheck = () => {
  stopRequested.value = true;
  overallStatus.value = 'Stopping checks... Please wait for the current number to finish.';
};

const performBulkCheck = async () => {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) {
    overallStatus.value = 'Session not selected or not ready for checking numbers.';
    return;
  }
  if (!numbersInput.value.trim()) {
    overallStatus.value = 'Please enter numbers to check.';
    return;
  }

  isChecking.value = true;
  stopRequested.value = false; // <-- NEW: Reset stop flag at the beginning
  overallStatus.value = 'Starting checks... This may take a while.';
  
  bulkCheckStore.startNewBulkCheck(); 

  const numbersToCheck = parseNumbers(numbersInput.value);
  if (numbersToCheck.length === 0) {
    overallStatus.value = 'No valid numbers to check after parsing.';
    isChecking.value = false;
    bulkCheckStore.setBulkCheckComplete();
    return;
  }

  let checkedCount = 0;
  const totalNumbers = numbersToCheck.length;

  for (const number of numbersToCheck) {
    // NEW: Check if stop has been requested before processing each number
    if (stopRequested.value) {
      overallStatus.value = `Bulk check stopped by user after processing ${checkedCount} of ${totalNumbers} numbers.`;
      break; // Exit the loop
    }

    if (!sessionStore.currentSelectedSessionId) { 
        overallStatus.value = 'Session changed or removed during checks. Aborting.';
        break; 
    }
    try {
      const response = await checkWhatsAppNumberApi(sessionStore.currentSelectedSessionId, number);
      // Ensure stop wasn't requested during the API call
      if (stopRequested.value && checkedCount < totalNumbers -1) { // check if it's not the very last one already processed
         // overallStatus.value might already be "Stopping...". No need to overwrite immediately.
         // The loop will break on the next iteration.
      } else {
         if (response.success && response.isRegistered) {
           bulkCheckStore.addRegisteredNumber(number); 
         } else if (response.success && !response.isRegistered) {
           bulkCheckStore.addUnregisteredNumber({ number, reason: response.message || 'Not registered' });
         } else {
           bulkCheckStore.addUnregisteredNumber({ number, reason: response.error || 'Failed to check (API error)' });
         }
      }
    } catch (error) {
      // Only add error if not stopped
      if (!stopRequested.value) {
         bulkCheckStore.addUnregisteredNumber({ number, reason: error.message || 'Network error or critical API failure' });
      }
    }
    
    // Only increment if not stopped before processing
    if (!stopRequested.value || (stopRequested.value && checkedCount < totalNumbers -1) ) {
        checkedCount++;
    }

    if (!stopRequested.value) { // Don't update status if we are trying to stop
        overallStatus.value = `Checked ${checkedCount} of ${totalNumbers} numbers...`;
    }
  }
  
  isChecking.value = false; // Always set to false when loop finishes or breaks
  if (!stopRequested.value) { // If not stopped by user
    overallStatus.value = `Bulk check complete. Processed ${checkedCount} numbers. Results are displayed below.`;
  }
  // stopRequested.value = false; // Reset for next run, already done at the start of performBulkCheck
  bulkCheckStore.setBulkCheckComplete();
};

onMounted(() => {
  bulkCheckStore.setIsCheckingActive(true);
});

onUnmounted(() => {
  bulkCheckStore.setIsCheckingActive(false);
  // If checking was in progress and component is unmounted, ensure it's signaled to stop
  if (isChecking.value) {
    stopRequested.value = true;
  }
});

</script>

<style scoped>
/* Add any specific styles for this panel if needed */
.feature-panel {
  /* You might want to ensure it takes enough height or has its own scrollbar if content overflows */
}
</style>
