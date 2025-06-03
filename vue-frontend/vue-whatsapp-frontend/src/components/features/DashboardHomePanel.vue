// vue-frontend/vue-whatsapp-frontend/src/components/features/DashboardHomePanel.vue
<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6">
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Devices</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-3xl font-bold text-walazy-purple">{{ sessionStore.sessionList.length }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Active Sessions</p>
        </div>
        <div>
          <p class="text-3xl font-bold text-walazy-purple">{{ onlineSessionsCount }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Online Sessions</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6">
      <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200">WhatsApp Devices</h2>
        <button
          @click="openAddNewDeviceModal"
          class="btn-purple-theme flex items-center justify-center !w-auto px-5 py-2.5"
        >
          <PlusIcon class="h-5 w-5 mr-2" />
          Add New
        </button>
      </div>

      <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Show</span>
          <select v-model="itemsPerPage" class="form-input !py-1.5 !px-2 !w-auto !text-sm bg-slate-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-walazy-purple focus:border-walazy-purple">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
          </select>
          <span>entries</span>
        </div>
        <div class="relative w-full sm:w-auto">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Search devices..."
            class="form-input !py-2 !pr-10 w-full sm:w-64 bg-slate-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-walazy-purple focus:border-walazy-purple"
          />
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-slate-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      <div class="overflow-x-auto custom-scrollbar">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Device</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-if="sessionStore.isLoadingSessions && paginatedSessions.length === 0 && !searchTerm">
              <td colspan="3" class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                Loading sessions...
              </td>
            </tr>
            <tr v-else-if="filteredSessions.length === 0 && !sessionStore.isLoadingSessions">
               <td colspan="3" class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                No devices found{{ searchTerm ? ' for "' + searchTerm + '"' : '' }}. Click "Add New" to create one.
              </td>
            </tr>
            <tr v-for="session_item in paginatedSessions" :key="session_item.sessionId">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ session_item.sessionId }}</div>
                <pre class="text-xs mt-1 p-1 bg-gray-100 dark:bg-slate-700 rounded max-w-xs overflow-auto">{{ JSON.stringify({ isR: session_item.isReady, hQ: session_item.hasQr, qrP: !!session_item.qrCode, qrL: session_item.qrCode ? session_item.qrCode.length : 0, sM: session_item.statusMessage }, null, 0) }}</pre>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(session_item)"
                >
                  {{ session_item.isReady ? 'Connected' : (session_item.qrCode && session_item.qrCode.length > 0 ? 'QR. Scan.' : (session_item.hasQr ? 'Waiting QR...' : (session_item.statusMessage || 'Initializing...'))) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  v-if="!sessionStore.sessions[session_item.sessionId]?.isReady"
                  @click="displayQrCode(session_item.sessionId)"
                  title="Show QR Code"
                  class="p-1.5 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 rounded-md hover:bg-sky-100 dark:hover:bg-sky-700/50 transition-colors"
                  :class="{ 'opacity-50 cursor-not-allowed': !(sessionStore.sessions[session_item.sessionId]?.hasQr || sessionStore.sessions[session_item.sessionId]?.qrCode) }"
                  :disabled="!(sessionStore.sessions[session_item.sessionId]?.hasQr || sessionStore.sessions[session_item.sessionId]?.qrCode)"
                >
                  <QrCodeIcon class="h-5 w-5" />
                </button>
                 <button
                    @click="reinitializeSession(session_item.sessionId)"
                    title="Re-initialize Session"
                    :disabled="sessionStore.isProcessingSession === session_item.sessionId"
                    class="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowPathIcon class="h-5 w-5" :class="{'animate-spin': sessionStore.isProcessingSession === session_item.sessionId}" />
                  </button>
                <button
                  @click="confirmRemoveSession(session_item.sessionId)"
                  title="Remove Session"
                  :disabled="sessionStore.isProcessingSession === session_item.sessionId"
                  class="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1 && filteredSessions.length > 0" class="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {{ paginatedSessions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0 }} to {{ Math.min(currentPage * itemsPerPage, filteredSessions.length) }} of {{ filteredSessions.length }} entries
        </div>
        <div class="flex space-x-1">
          <button @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50">Previous</button>
          <button @click="currentPage++" :disabled="currentPage === totalPages || totalPages === 0" class="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <AddNewDeviceModal
      :show="isAddNewDeviceModalVisible"
      :is-loading="!!sessionStore.isProcessingSession && sessionStore.isProcessingSession === newSessionIdForModal"
      :error-message="addDeviceError"
      @close="closeAddNewDeviceModal"
      @submit="handleAddNewDevice"
    />
    <QrCodeDisplayModal
      :show="isQrModalVisible"
      :qr-code="currentQrCode"
      :session-id="currentSessionIdForQr"
      @close="isQrModalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useAuthStore } from '@/stores/authStore'; // Assuming globalStatusMessage might be here or in sessionStore
import AddNewDeviceModal from '@/components/modals/AddNewDeviceModal.vue';
import QrCodeDisplayModal from '@/components/modals/QrCodeDisplayModal.vue';
import { PlusIcon, QrCodeIcon, TrashIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline';

const sessionStore = useSessionStore();
const authStore = useAuthStore(); // If globalStatusMessage is from authStore

const isAddNewDeviceModalVisible = ref(false);
const newSessionIdForModal = ref('');
const isQrModalVisible = ref(false);
const currentQrCode = ref('');
const currentSessionIdForQr = ref('');
const addDeviceError = ref('');

const searchTerm = ref('');
const itemsPerPage = ref(5);
const currentPage = ref(1);

onMounted(() => {
  sessionStore.fetchSessions();
});

const onlineSessionsCount = computed(() => {
  return sessionStore.sessionList.filter(s => s.isReady).length;
});

const filteredSessions = computed(() => {
  if (!searchTerm.value) {
    return sessionStore.sessionList;
  }
  return sessionStore.sessionList.filter(session =>
    session.sessionId.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const totalPages = computed(() => {
  if (filteredSessions.value.length === 0) return 1;
  return Math.ceil(filteredSessions.value.length / itemsPerPage.value);
});

const paginatedSessions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSessions.value.slice(start, end);
});

watch(searchTerm, () => { currentPage.value = 1; });
watch(itemsPerPage, () => { currentPage.value = 1; });
watch(filteredSessions, () => {
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = totalPages.value;
    } else if (totalPages.value === 0 && filteredSessions.value.length === 0) {
        currentPage.value = 1;
    }
}, { deep: true });
watch(() => sessionStore.sessions, () => {
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = totalPages.value;
    } else if (totalPages.value === 0 && filteredSessions.value.length === 0) {
         currentPage.value = 1;
    }
}, { deep: true });


const getStatusClass = (session_item) => { // Param is session_item from v-for
  const sessionData = sessionStore.sessions[session_item.sessionId]; // Get live data from store
  if (sessionData?.isReady) return 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300';
  if (sessionData?.qrCode && sessionData.qrCode.length > 0) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300';
  if (sessionData?.hasQr) return 'bg-orange-100 text-orange-800 dark:bg-orange-700/30 dark:text-orange-300';
  const lowerStatusMsg = (sessionData?.statusMessage || '').toLowerCase();
  if (lowerStatusMsg.includes('fail') || lowerStatusMsg.includes('error')) return 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300';
  return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300';
};

const openAddNewDeviceModal = () => {
    addDeviceError.value = '';
    newSessionIdForModal.value = '';
    isAddNewDeviceModalVisible.value = true;
};
const closeAddNewDeviceModal = () => {
    isAddNewDeviceModalVisible.value = false;
    newSessionIdForModal.value = '';
    addDeviceError.value = '';
};

const handleAddNewDevice = async (newId) => {
  newSessionIdForModal.value = newId;
  addDeviceError.value = '';
  if (!newId) {
    addDeviceError.value = 'Session name cannot be empty.';
    if (sessionStore.isProcessingSession === newId) sessionStore.isProcessingSession = null;
    return;
  }
  try {
    await sessionStore.addNewSession(newId);
    isAddNewDeviceModalVisible.value = false;
  } catch (error) {
    console.error("Error adding new session from panel:", error);
    addDeviceError.value = error.message || 'Failed to add session. Check console for details.';
  }
};

const displayQrCode = (sessionId) => { // Changed to accept sessionId
  const sessionFromStore = sessionStore.sessions[sessionId]; // Get the latest from store

  console.log(`DashboardHomePanel: Clicked QR button for session '${sessionId}'. Session object from store:`, JSON.parse(JSON.stringify(sessionFromStore)));

  if (sessionFromStore && sessionFromStore.qrCode && sessionFromStore.qrCode.length > 0) {
    currentQrCode.value = sessionFromStore.qrCode;
    currentSessionIdForQr.value = sessionId;
    isQrModalVisible.value = true;
  } else if (sessionFromStore && sessionFromStore.hasQr) {
    // QR is expected but not yet in store, show modal in loading state
    currentQrCode.value = ''; // Ensure modal shows "Waiting for QR code..."
    currentSessionIdForQr.value = sessionId;
    isQrModalVisible.value = true;
    console.log(`DashboardHomePanel: QR for ${sessionId} is expected (hasQr=true) but string is missing. Modal will show 'Waiting'.`);
    // Optionally, trigger a re-fetch or wait for socket, but re-init is an option for user.
  } else {
    // No QR info at all, and button was somehow enabled (or user clicked re-init which then called this)
    // Attempt to re-initialize to fetch the QR.
    console.warn(`DashboardHomePanel: QR button clicked for ${sessionId}, but no QR info in store. Attempting re-init.`);
    sessionStore.updateGlobalStatus(`No QR for ${sessionId}. Attempting to re-initialize...`);
    reinitializeSession(sessionId); // This will call addNewSession which sets processing state
  }
};

const reinitializeSession = async (sessionId) => {
    if (sessionStore.isProcessingSession === sessionId) {
        console.log(`Re-initialization for ${sessionId} already in progress.`);
        return;
    }
    // No confirmation needed if it's usually to get QR
    // globalStatusMessage.value = `Re-initializing '${sessionId}'...`; // This is set in store's addNewSession
    try {
        await sessionStore.addNewSession(sessionId); // This will set isProcessingSession in store
        // After this, the store should update via API response or socket.
        // If QR comes via API response directly, sessionStore.sessions[sessionId].qrCode will be set.
        // Then, we can try to show it.
        // A slight delay might be needed for the store to update if QR comes from API response in addNewSession.
        setTimeout(() => {
            const updatedSession = sessionStore.sessions[sessionId];
            if (updatedSession && updatedSession.qrCode && !updatedSession.isReady) {
                 displayQrCode(sessionId); // Pass sessionId
            } else if (updatedSession && updatedSession.hasQr && !updatedSession.qrCode && !updatedSession.isReady) {
                // If hasQr is true but no qrCode string yet, open modal in waiting state
                currentQrCode.value = '';
                currentSessionIdForQr.value = sessionId;
                isQrModalVisible.value = true;
            }
        }, 300); // Adjust delay if needed, or rely on watcher for qrCode change
    } catch (error) {
        console.error(`Error re-initializing session ${sessionId} from panel:`, error);
        // Error is handled in store, globalStatusMessage should update
    }
};

const confirmRemoveSession = (sessionId) => {
  if (confirm(`Are you sure you want to remove session '${sessionId}'?`)) {
    sessionStore.removeSession(sessionId);
  }
};
</script>

<style scoped>
/* Styles remain the same */
.btn-purple-theme {
    @apply bg-walazy-purple hover:bg-opacity-90 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-walazy-purple transition-all ease-in-out duration-150 transform active:scale-95;
}
.form-input {
    @apply mt-1 block w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm
           bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200
           focus:outline-none focus:ring-1 focus:ring-walazy-purple dark:focus:ring-walazy-purple focus:border-walazy-purple dark:focus:border-walazy-purple
           sm:text-sm caret-walazy-purple transition-colors duration-150;
}
.form-input::placeholder { @apply text-slate-400 dark:text-slate-500; }
.form-select {
     @apply mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-walazy-purple focus:border-walazy-purple sm:text-sm rounded-md bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200;
}
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { @apply bg-slate-100 dark:bg-slate-700 rounded-lg; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-400 dark:bg-slate-500 rounded-lg; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { @apply bg-slate-500 dark:bg-slate-400; }
</style>