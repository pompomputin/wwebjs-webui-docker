<template>
  <div class="space-y-6 p-4">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div class="flex flex-col md:flex-row items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 md:mb-0">WhatsApp Devices</h3>
        <button @click="openAddSessionModal" class="btn btn-indigo flex items-center space-x-2 !w-auto px-4 py-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New</span>
        </button>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-3 sm:space-y-0 sm:space-x-4">
        <div class="flex items-center space-x-2">
          <label for="show-entries" class="text-sm text-gray-600 dark:text-gray-300">Show</label>
          <select id="show-entries" v-model="entriesPerPage" class="form-select text-sm">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span class="text-sm text-gray-600 dark:text-gray-300">entries</span>
        </div>
        <div class="w-full sm:w-auto">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search devices..."
            class="form-input w-full"
          />
        </div>
      </div>

      <div class="overflow-x-auto custom-scrollbar">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">DEVICE</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NUMBER</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STATUS</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-if="paginatedSessions.length === 0">
              <td colspan="4" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">No devices found.</td>
            </tr>
            <tr v-for="session in paginatedSessions" :key="session.sessionId">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{{ session.sessionId }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ session.sessionId }} </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100': session.isReady,
                    'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100': session.qrCode || session.hasQr,
                    'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100': session.initializing && !session.qrCode && !session.isReady,
                    'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100': !session.isReady && !session.hasQr && !session.initializing,
                  }"
                >
                  {{ session.statusMessage }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    v-if="session.hasQr"
                    @click="showQr(session.sessionId)"
                    class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md border border-gray-300 dark:border-slate-600"
                    title="Show QR Code"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 13h8v8H3v-8zm2 6h4v-4H5v4zm13 0l-3-3v3h-2v-7h9v2h-4v4h2v3h-2z" />
                    </svg>
                  </button>
                  <button
                    v-if="session.isReady"
                    @click="selectSession(session.sessionId)"
                    class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md border border-gray-300 dark:border-slate-600"
                    title="Select Session"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    v-if="session.isReady"
                    @click="openSessionSettingsModal(session.sessionId)"
                    class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md border border-gray-300 dark:border-slate-600"
                    title="Session Settings"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.827 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.827 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.827-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.827-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    @click="removeSession(session.sessionId)"
                    :disabled="sessionStore.isProcessingSession === session.sessionId"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1 rounded-md border border-gray-300 dark:border-slate-600"
                    title="Remove Session"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav class="flex items-center justify-between pt-4">
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Showing {{ currentStartIndex + 1 }} to {{ currentEndIndex }} of {{ filteredSessions.length }} entries
        </div>
        <ul class="flex items-center space-x-1">
          <li>
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600"
            >
              Previous
            </button>
          </li>
          <li v-for="page in totalPages" :key="page">
            <button
              @click="goToPage(page)"
              :class="{
                'px-3 py-1 rounded-md font-bold': true,
                'bg-indigo-600 text-white dark:bg-indigo-700': currentPage === page,
                'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600': currentPage !== page,
              }"
            >
              {{ page }}
            </button>
          </li>
          <li>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600"
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <div v-if="isQrModalOpen" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 relative w-96">
        <button @click="closeQrModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Scan QR Code for Session: {{ sessionStore.currentSelectedSessionId }}</h3>
        <div v-if="sessionStore.selectedSessionQrCode" class="flex justify-center p-4">
          <qrcode-vue :value="sessionStore.selectedSessionQrCode" :size="250" level="H" class="bg-white p-2 rounded-md" />
        </div>
        <p v-else class="text-center text-red-500 dark:text-red-400">QR code not available or expired.</p>
        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Keep this window open until your session connects.
        </p>
      </div>
    </div>

    <AddSessionModal v-if="isAddSessionModalOpen" @confirm="handleAddSessionConfirm" @cancel="handleAddSessionCancel" />

    <SessionSettingsModal v-if="isSessionSettingsModalOpen" :sessionId="selectedSettingsSessionId" @close="closeSessionSettingsModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import QrcodeVue from 'qrcode.vue';
import AddSessionModal from '@/components/modals/AddSessionModal.vue';
import SessionSettingsModal from '@/components/modals/SessionSettingsModal.vue'; // Import the new settings modal

const sessionStore = useSessionStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const searchQuery = ref('');
const entriesPerPage = ref(5);
const currentPage = ref(1);
const isQrModalOpen = ref(false);
const isAddSessionModalOpen = ref(false);
const isSessionSettingsModalOpen = ref(false); // State to control settings modal visibility
const selectedSettingsSessionId = ref(null); // To pass session ID to settings modal
const currentTime = ref('');

const isConnected = computed(() => {
  // Directly check the reactive status exported from socket.js
  if (window.socketInstance) {
    return window.socketInstance.connected;
  }
  return false;
});

const onlineSessionsCount = computed(() => {
  return sessionStore.sessionList.filter(session => session.isReady).length;
});

const filteredSessions = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return sessionStore.sessionList.filter(session =>
    session.sessionId.toLowerCase().includes(query) ||
    session.statusMessage.toLowerCase().includes(query)
  );
});

const paginatedSessions = computed(() => {
  const start = (currentPage.value - 1) * entriesPerPage.value;
  const end = start + entriesPerPage.value;
  return filteredSessions.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredSessions.value.length / entriesPerPage.value);
});

const currentStartIndex = computed(() => (currentPage.value - 1) * entriesPerPage.value);
const currentEndIndex = computed(() => Math.min(currentPage.value * entriesPerPage.value, filteredSessions.value.length));


const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const selectSession = (sessionId) => {
  sessionStore.selectSession(sessionId);
  if (window.socketInstance && window.socketInstance.connected) {
    window.socketInstance.emit('join_session_room', sessionId);
  }
};

const removeSession = async (sessionId) => {
  if (confirm(`Are you sure you want to remove session '${sessionId}'?`)) {
    await sessionStore.removeSession(sessionId);
  }
};

const openAddSessionModal = () => {
  isAddSessionModalOpen.value = true;
};

const handleAddSessionConfirm = (newSessionId) => {
  isAddSessionModalOpen.value = false;
  if (newSessionId) {
    sessionStore.addNewSession(newSessionId);
  }
};

const handleAddSessionCancel = () => {
  isAddSessionModalOpen.value = false;
};

const showQr = (sessionId) => {
  sessionStore.selectSession(sessionId);
  isQrModalOpen.value = true;
};

const closeQrModal = () => {
  isQrModalOpen.value = false;
};

// NEW: Functions to open/close session settings modal
const openSessionSettingsModal = (sessionId) => {
  selectedSettingsSessionId.value = sessionId;
  isSessionSettingsModalOpen.value = true;
};

const closeSessionSettingsModal = () => {
  isSessionSettingsModalOpen.value = false;
  selectedSettingsSessionId.value = null;
};


onMounted(() => {
  sessionStore.fetchSessions();

  window.openQrModalForSession = (sessionId) => {
    sessionStore.selectSession(sessionId);
    isQrModalOpen.value = true;
  };

  updateTime();
  setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (window.openQrModalForSession) {
    window.openQrModalForSession = null;
  }
});

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

watch(() => sessionStore.currentSelectedSessionId, (newSessionId) => {
  if (newSessionId) {
    // Logic for chat panel if it's dynamic
  }
});
</script>

<style scoped>
/* Add any specific styles for this panel if needed */
.feature-panel {
  /* No specific styles currently, Tailwind is handling most of it */
}
</style>