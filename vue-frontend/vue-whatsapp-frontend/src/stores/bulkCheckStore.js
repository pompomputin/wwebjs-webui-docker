// src/stores/bulkCheckStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useBulkCheckStore = defineStore('bulkCheck', () => {
  const isCheckingActive = ref(false);
  const registeredNumbers = ref([]);
  const unregisteredNumbers = ref([]);
  const lastCheckTimestamp = ref(null);

  // Action to add a single registered number
  function addRegisteredNumber(number) {
    registeredNumbers.value.push(number);
  }

  // Action to add a single unregistered/error number
  function addUnregisteredNumber(item) { // item is { number, reason }
    unregisteredNumbers.value.push(item);
  }

  // Called at the start of a new bulk check
  function startNewBulkCheck() {
    registeredNumbers.value = [];
    unregisteredNumbers.value = [];
    isCheckingActive.value = true; // Indicate that bulk check display is active
    lastCheckTimestamp.value = Date.now();
  }

  function setBulkCheckComplete() {
    // isCheckingActive remains true so results are shown
    // lastCheckTimestamp is already set
    // No specific action needed here unless you want to add a "completed" flag
  }

  function clearBulkCheckResults() {
    registeredNumbers.value = [];
    unregisteredNumbers.value = [];
    isCheckingActive.value = false; // Set to false when clearing or navigating away
    lastCheckTimestamp.value = null;
  }
  
  function setIsCheckingActive(status) {
    isCheckingActive.value = status;
    // If we are deactivating the view, and results should not persist, clear them.
    // This is currently handled in BulkCheckNumbersPanel.vue on unmount.
    // if (!status) {
    //   clearBulkCheckResults();
    // }
  }

  return {
    isCheckingActive,
    registeredNumbers,
    unregisteredNumbers,
    lastCheckTimestamp,
    addRegisteredNumber, // New action
    addUnregisteredNumber, // New action
    startNewBulkCheck, // New action
    setBulkCheckComplete, // New action
    clearBulkCheckResults, // Keep this for full clear
    setIsCheckingActive
  };
});
