<template>
  <main class="flex flex-col lg:flex-row gap-6 flex-grow">
    <aside class="lg:w-2/5 xl:w-1/3 w-full bg-white dark:bg-slate-800 p-0 rounded-xl shadow-2xl flex flex-col panel-container-desktop">
      <SessionManager @session-selected="onSessionSelected" @no-session-selected="onNoSessionSelected" /> 
    </aside>

    <section class="lg:w-3/5 xl:w-2/3 w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col panel-container-desktop">
      <div v-if="sessionStore.currentSelectedSessionId" id="interactionContainer" class="flex flex-col flex-grow h-full"> 
        <header class="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-20"> 
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">
            Interacting with: <span class="text-blue-600 dark:text-blue-400">{{ sessionStore.currentSelectedSessionId }}</span>
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 italic mt-1">
            Status: {{ sessionStore.selectedSessionData?.statusMessage || (sessionStore.selectedSessionData?.isReady ? 'Ready' : 'Loading...') }}
          </p>

          <div v-if="sessionStore.selectedSessionData?.isReady" class="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
            <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Session Settings:</h4>
            <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
              <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" class="form-checkbox rounded" 
                       :checked="sessionStore.sessionFeatureToggles.isTypingIndicatorEnabled"
                       @change="sessionStore.toggleTypingIndicator()">
                <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Show "typing..."</span>
              </label>
              <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" class="form-checkbox rounded"
                       :checked="sessionStore.sessionFeatureToggles.autoSendSeenEnabled"
                       @change="sessionStore.toggleAutoSendSeen()">
                <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Auto Send "seen"</span>
              </label>
              <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" class="form-checkbox rounded"
                       :checked="sessionStore.sessionFeatureToggles.maintainOnlinePresenceEnabled"
                       @change="sessionStore.toggleMaintainOnlinePresence()">
                <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Set Presence "Online"</span>
              </label>
            </div>
          </div>
        </header>
        
        <div class="flex-grow overflow-y-auto custom-scrollbar p-4 sm:p-5">
            <nav id="featureMenu" class="mb-5 pb-3 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Features</h3>
              <div class="flex flex-wrap gap-2">
                <router-link :to="{ name: 'sendText' }" active-class="active-feature" class="feature-link text-sm px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-sm">Send Text</router-link>
                <router-link :to="{ name: 'sendImage' }" active-class="active-feature" class="feature-link text-sm px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-sm">Send Image</router-link>
                <router-link :to="{ name: 'sendLocation' }" active-class="active-feature" class="feature-link text-sm px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-sm">Send Location</router-link>
                <router-link :to="{ name: 'contactInfo' }" active-class="active-feature" class="feature-link text-sm px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-sm">Get Contact Info</router-link>
                <router-link :to="{ name: 'setStatus' }" active-class="active-feature" class="feature-link text-sm px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-sm">Set Status</router-link> 
                <router-link :to="{ name: 'bulkSend' }" active-class="active-feature" class="feature-link text-sm px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-sm">Bulk Send</router-link>
              </div>
            </nav>

            <router-view /> 
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-300 dark:border-slate-600">
              <ChatsPanel />
              <MessageLogPanel />
            </div>
        </div>

      </div>
      <div v-else id="noSessionSelectedMsg" class="text-center py-10 flex-grow flex items-center justify-center">
        <p class="text-slate-500 dark:text-slate-400 text-lg">Please add and select a session to begin.</p>
      </div>
    </section>
  </main>
</template>

<script setup>
// The <script setup> section for DashboardView.vue remains the same as the last version.
// Ensure all imports like SessionManager, ChatsPanel, MessageLogPanel, useSessionStore, etc., are correct.
import SessionManager from '../components/SessionManager.vue';
import ChatsPanel from '../components/features/ChatsPanel.vue';
import MessageLogPanel from '../components/features/MessageLogPanel.vue';
import { useSessionStore } from '../stores/sessionStore';
import { useRouter } from 'vue-router';
import { watch } from 'vue';

const sessionStore = useSessionStore();
const router = useRouter();

function onSessionSelected(sessionId) { 
    if (router.currentRoute.value.name === 'dashboard' || !router.currentRoute.value.path.startsWith(`/`)) { // Basic check
        router.push({ name: 'sessionActiveHome' }); 
    }
}
function onNoSessionSelected() { 
    if (router.currentRoute.value.name !== 'dashboard') {
        router.push({ name: 'dashboard' }); 
    }
}
watch(() => sessionStore.currentSelectedSessionId, (newSessionId) => { 
    if (newSessionId) { 
        const currentRouteName = router.currentRoute.value.name; 
        if (currentRouteName === 'dashboard' || currentRouteName === 'home') { 
             router.push({ name: 'sessionActiveHome' });
        }
    } else { 
        // Optional: if (router.currentRoute.value.name !== 'dashboard' && router.currentRoute.value.name !== 'home') { router.push({ name: 'dashboard' }); }
    }
}, { immediate: true });
</script>
