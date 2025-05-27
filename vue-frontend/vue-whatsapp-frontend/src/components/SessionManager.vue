<template>
  <div class="p-1 flex flex-col h-full">
    <h2 class="text-xl font-bold mb-4 border-b border-gray-200 dark:border-slate-700 pb-3 text-slate-700 dark:text-slate-200 sticky top-0 bg-white dark:bg-slate-800 py-2 z-20">Session Management</h2>
    <div class="mb-6 px-3">
      <label for="newSessionIdInput" class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">New Session ID:</label>
      <div class="flex"><input type="text" id="newSessionIdInput" v-model="newSessionName" @keyup.enter="handleAddSession" class="form-input rounded-r-none flex-grow" placeholder="e.g., PersonalAcc"><button @click="handleAddSession" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-r-lg transition text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-800">Add Device</button></div>
      <p v-if="addSessionStatusMessage" class="text-xs mt-1.5" :class="addSessionStatusType === 'error' ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'">{{ addSessionStatusMessage }}</p>
    </div>
    <div id="qrDisplaySection" class="text-center p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/40 mb-6 mx-3" v-if="sessionStore.currentSelectedSessionId">
      <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">QR Code for <span class="font-bold text-blue-600 dark:text-blue-400">{{ sessionStore.currentSelectedSessionId }}</span></h3>
      <div class="min-h-[180px] md:min-h-[200px] flex justify-center items-center bg-white dark:bg-opacity-95 p-2.5 rounded-md shadow-inner">
        <qrcode-vue v-if="sessionStore.selectedSessionQrCode" :value="sessionStore.selectedSessionQrCode" :size="180" level="H" render-as="svg" />
        <p v-else class="text-slate-500 dark:text-slate-400 text-sm p-4">{{ sessionStore.selectedSessionData?.isReady ? 'Session Ready!' : (sessionStore.selectedSessionData?.statusMessage || 'No QR code available.') }}</p>
      </div>
    </div>
    <div v-else class="text-center p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/40 mb-6 mx-3"><p class="text-slate-500 dark:text-slate-400 text-sm p-4">Select or add session.</p></div>
    <div class="flex-grow overflow-y-auto custom-scrollbar pr-1 pl-3">
      <div class="flex justify-between items-center mb-2 sticky top-0 bg-white dark:bg-slate-800 py-2 z-10"><h3 class="text-base font-semibold text-slate-700 dark:text-slate-200">Active Sessions:</h3><button @click="sessionStore.fetchSessions()" :disabled="sessionStore.isLoadingSessions" class="text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-1 px-2.5 rounded-md transition shadow-sm focus:ring-1 focus:ring-slate-400">{{ sessionStore.isLoadingSessions ? 'Loading...' : 'Refresh' }}</button></div>
      <div v-if="sessionStore.isLoadingSessions && sessionStore.sessionList.length === 0" class="text-sm text-slate-500 dark:text-slate-400 p-2">Loading...</div>
      <div v-else-if="sessionStore.sessionList.length === 0" class="text-sm text-slate-500 dark:text-slate-400 p-2">No sessions.</div>
      <div v-else class="space-y-2">
        <div v-for="session in sessionStore.sessionList" :key="session.sessionId" @click="selectAndJoinSession(session.sessionId)" class="session-item p-3 border border-transparent dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg flex justify-between items-center cursor-pointer" :class="{ 'active': session.sessionId === sessionStore.currentSelectedSessionId }">
          <span class="flex-grow"><span class="font-medium text-slate-700 dark:text-slate-200">{{ session.sessionId }}</span><span class="block text-xs italic session-status text-slate-500 dark:text-slate-400">{{ session.statusMessage || (session.isReady ? 'Ready' : (session.hasQr || session.qrCode ? 'Needs QR Scan' : 'Initializing...')) }}</span></span>
          <button @click.stop="confirmRemoveSession(session.sessionId)" class="remove-session-btn text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50" title="Remove">&#x1F5D1;</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'; import { useSessionStore } from '../stores/sessionStore'; import QrcodeVue from 'qrcode.vue';
const sessionStore = useSessionStore(); const newSessionName = ref(''); const addSessionStatusMessage = ref(''); const addSessionStatusType = ref('');
async function handleAddSession() { const sid=newSessionName.value.trim(); if(!sid){addSessionStatusMessage.value='ID empty.';addSessionStatusType.value='error';return;} addSessionStatusMessage.value=`Initiating ${sid}...`;addSessionStatusType.value=''; if(sessionStore.sessions[sid]){addSessionStatusMessage.value=`Sess '${sid}' managed.`;addSessionStatusType.value='error';return;} await sessionStore.addNewSession(sid); addSessionStatusMessage.value=sessionStore.globalStatusMessage; addSessionStatusType.value=sessionStore.globalStatusMessage.toLowerCase().includes('error')?'error':'success'; if(!sessionStore.globalStatusMessage.toLowerCase().includes('error')){selectAndJoinSession(sid);newSessionName.value='';}}
function selectAndJoinSession(sessionId) { sessionStore.selectSession(sessionId); const socket=window.socketInstance; if(socket&&sessionId)socket.emit('join_session_room',sessionId); }
function confirmRemoveSession(sessionId) { if(confirm(`Remove sess "${sessionId}"?`))sessionStore.removeSession(sessionId); }
onMounted(()=>sessionStore.fetchSessions());
</script>
<style scoped>.session-item { transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out; }</style>
