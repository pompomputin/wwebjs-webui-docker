<template>
  <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 relative w-11/12 max-w-md">
      <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
        Session Settings: {{ sessionId }}
      </h3>
      
      <p v-if="statusMessage" class="text-center text-sm mb-4" :class="{ 'text-green-500': !statusError, 'text-red-500': statusError }">
        {{ statusMessage }}
      </p>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label for="toggleTyping" class="text-gray-700 dark:text-gray-300 text-base font-medium">Show "typing..." indicator</label>
          <label class="switch">
            <input type="checkbox" id="toggleTyping" v-model="sessionStore.sessionFeatureToggles.isTypingIndicatorEnabled" @change="handleTypingToggle" :disabled="isProcessingToggle || !sessionStore.selectedSessionData?.isReady" />
            <span class="slider round"></span>
          </label>
        </div>

        <div class="flex items-center justify-between">
          <label for="toggleAutoSeen" class="text-gray-700 dark:text-gray-300 text-base font-medium">Auto Send "seen"</label>
          <label class="switch">
            <input type="checkbox" id="toggleAutoSeen" v-model="sessionStore.sessionFeatureToggles.autoSendSeenEnabled" @change="handleAutoSeenToggle" :disabled="isProcessingToggle || !sessionStore.selectedSessionData?.isReady" />
            <span class="slider round"></span>
          </label>
        </div>

        <div class="flex items-center justify-between">
          <label for="toggleOnlinePresence" class="text-gray-700 dark:text-gray-300 text-base font-medium">Maintain Online Presence</label>
          <label class="switch">
            <input type="checkbox" id="toggleOnlinePresence" v-model="sessionStore.sessionFeatureToggles.maintainOnlinePresenceEnabled" @change="handleOnlinePresenceToggle" :disabled="isProcessingToggle || !sessionStore.selectedSessionData?.isReady" />
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';

const props = defineProps({
  sessionId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

const sessionStore = useSessionStore();
const isProcessingToggle = ref(false);
const statusMessage = ref('');
const statusError = ref(false);

const closeModal = () => {
  emit('close');
};

const showStatus = (message, isError = false) => {
  statusMessage.value = message;
  statusError.value = isError;
  setTimeout(() => {
    statusMessage.value = '';
  }, 3000);
};

// Handle toggle changes
const handleTypingToggle = async (event) => {
  isProcessingToggle.value = true;
  const enabled = event.target.checked;
  showStatus(`Updating 'typing...' indicator setting to ${enabled ? 'enabled' : 'disabled'}...`);
  const result = await sessionStore.toggleTypingIndicator(enabled);
  if (result.success) {
    showStatus(`'Typing...' indicator setting updated.`, false);
  } else {
    showStatus(`Failed to update 'typing...' indicator: ${result.error || 'Unknown error'}`, true);
    // Revert UI toggle state if API failed
    sessionStore.sessionFeatureToggles.isTypingIndicatorEnabled = !enabled;
  }
  isProcessingToggle.value = false;
};

const handleAutoSeenToggle = async (event) => {
  isProcessingToggle.value = true;
  const enabled = event.target.checked;
  showStatus(`Updating 'auto seen' setting to ${enabled ? 'enabled' : 'disabled'}...`);
  const result = await sessionStore.toggleAutoSendSeen(enabled);
  if (result.success) {
    showStatus(`'Auto seen' setting updated.`, false);
  } else {
    showStatus(`Failed to update 'auto seen': ${result.error || 'Unknown error'}`, true);
    // Revert UI toggle state if API failed
    sessionStore.sessionFeatureToggles.autoSendSeenEnabled = !enabled;
  }
  isProcessingToggle.value = false;
};

const handleOnlinePresenceToggle = async (event) => {
  isProcessingToggle.value = true;
  const enabled = event.target.checked;
  
  if (!sessionStore.selectedSessionData?.isReady) {
    showStatus('Cannot set online presence: Session not ready.', true);
    event.target.checked = !enabled; // Revert the UI toggle visually
    sessionStore.sessionFeatureToggles.maintainOnlinePresenceEnabled = !enabled; // Revert local state
    isProcessingToggle.value = false;
    return;
  }

  showStatus(`Updating online presence setting to ${enabled ? 'enabled' : 'disabled'}...`);
  const result = await sessionStore.toggleMaintainOnlinePresence(enabled);
  
  if (result.success) {
    showStatus(`Online presence setting updated.`, false);
  } else {
    showStatus(`Failed to update online presence: ${result.error || 'Unknown error'}`, true);
    event.target.checked = !enabled; // Revert the UI toggle visually
    sessionStore.sessionFeatureToggles.maintainOnlinePresenceEnabled = !enabled; // Revert local state
  }
  isProcessingToggle.value = false;
};

// Initialize modal toggles with current session settings
// This makes sure the toggles reflect the stored state when the modal opens
onMounted(() => {
    if (sessionStore.selectedSessionData && sessionStore.selectedSessionData.settings) {
        sessionStore.sessionFeatureToggles.isTypingIndicatorEnabled = sessionStore.selectedSessionData.settings.isTypingIndicatorEnabled || false;
        sessionStore.sessionFeatureToggles.autoSendSeenEnabled = sessionStore.selectedSessionData.settings.autoSendSeenEnabled || false;
        sessionStore.sessionFeatureToggles.maintainOnlinePresenceEnabled = sessionStore.selectedSessionData.settings.maintainOnlinePresenceEnabled || false;
    }
});
</script>

<style scoped>
/* Modern Toggle Switch CSS */
.switch {
  position: relative;
  display: inline-block;
  width: 48px; /* Standard width for a modern toggle */
  height: 28px; /* Standard height */
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc; /* Off state color */
  transition: .4s;
  -webkit-transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px; /* Circle height */
  width: 20px; /* Circle width */
  left: 4px; /* Initial position from left */
  bottom: 4px; /* Initial position from bottom */
  background-color: white;
  transition: .4s;
  -webkit-transition: .4s;
}

input:checked + .slider {
  background-color: #4f46e5; /* Tailwind indigo-600 for On state */
}

input:focus + .slider {
  box-shadow: 0 0 1px #4f46e5;
}

input:checked + .slider:before {
  -webkit-transform: translateX(20px); /* Move circle to right */
  -ms-transform: translateX(20px);
  transform: translateX(20px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 28px; /* Match height for perfect roundness */
}

.slider.round:before {
  border-radius: 50%;
}
</style>