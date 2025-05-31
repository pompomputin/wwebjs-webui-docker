<template>
  <main class="flex flex-col lg:flex-row gap-6 flex-grow">
    <aside class="lg:w-2/5 xl:w-1/3 w-full bg-white dark:bg-slate-800 p-0 rounded-xl shadow-2xl flex flex-col panel-container-desktop">
      <SessionManager @session-selected="onSessionSelected" @no-session-selected="onNoSessionSelected" />
    </aside>

    <section class="lg:w-3/5 xl:w-2/3 w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col panel-container-desktop">
      <div v-if="sessionStore.currentSelectedSessionId" id="interactionContainer" class="flex flex-col flex-grow h-full">
        <header class="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-20">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">
                Interacting with: <span class="text-blue-600 dark:text-blue-400">{{ sessionStore.currentSelectedSessionId }}</span>
              </h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 italic mt-1">
                Status: {{ sessionStore.selectedSessionData?.statusMessage || (sessionStore.selectedSessionData?.isReady ? 'Ready' : 'Loading...') }}
              </p>
            </div>
            <div>
              <button @click="handleLogout" class="btn btn-light text-sm px-3 py-1.5">Logout</button>
            </div>
          </div>

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
                <router-link :to="{ name: 'sendText' }" active-class="active-feature" class="feature-link">Send Text</router-link>
                <router-link :to="{ name: 'sendImage' }" active-class="active-feature" class="feature-link">Send Image</router-link>
                <router-link :to="{ name: 'sendLocation' }" active-class="active-feature" class="feature-link">Send Location</router-link>
                <router-link :to="{ name: 'contactInfo' }" active-class="active-feature" class="feature-link">Get Contact Info</router-link>
                <router-link :to="{ name: 'setStatus' }" active-class="active-feature" class="feature-link">Set Status</router-link> 
                <router-link :to="{ name: 'bulkSend' }" active-class="active-feature" class="feature-link">Bulk Send</router-link>
                <router-link :to="{ name: 'bulkCheckNumbers' }" active-class="active-feature" class="feature-link">
                  Bulk Check Numbers
                </router-link>
              </div>
            </nav>

            <router-view :key="sessionStore.currentSelectedSessionId || 'no-session-active'" /> 
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-300 dark:border-slate-600">  
                <template v-if="bulkCheckStore.isCheckingActive && $route.name === 'bulkCheckNumbers'">
                  <RegisteredNumbersLogDisplay />
                  <NonExistingNumbersLogDisplay />
                </template>
                <template v-else>
                  <ChatsPanel />
                  <MessageLogPanel />
                </template>
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
import SessionManager from '../components/SessionManager.vue'; 
import ChatsPanel from '../components/features/ChatsPanel.vue'; 
import MessageLogPanel from '../components/features/MessageLogPanel.vue'; 
import RegisteredNumbersLogDisplay from '../components/features/RegisteredNumbersLogDisplay.vue'; // <-- IMPORT
import NonExistingNumbersLogDisplay from '../components/features/NonExistingNumbersLogDisplay.vue'; // <-- IMPORT
import { useSessionStore } from '../stores/sessionStore'; 
import { useAuthStore } from '@/stores/authStore'; 
import { useBulkCheckStore } from '@/stores/bulkCheckStore'; // <-- IMPORT
import { useRouter, useRoute } from 'vue-router'; // <-- IMPORT useRoute
import { watch } from 'vue'; 

const sessionStore = useSessionStore(); 
const authStore = useAuthStore(); 
const bulkCheckStore = useBulkCheckStore(); // <-- USE STORE
const router = useRouter(); 
const route = useRoute(); // <-- GET CURRENT ROUTE

function onSessionSelected(sessionId) {  
    if (router.currentRoute.value.name === 'home' || router.currentRoute.value.name === 'dashboard') { 
        router.push({ name: 'sessionActiveHome' });  
    }
    // When a session is selected, ensure bulk check results are cleared unless we are on the bulk check page
    if (route.name !== 'bulkCheckNumbers') {
      bulkCheckStore.clearBulkCheckResults();
    }
}
function onNoSessionSelected() {  
    if (router.currentRoute.value.name !== 'home' && router.currentRoute.value.name !== 'dashboard') { 
         router.push({ name: 'sessionActiveHome' }); 
    }
    bulkCheckStore.clearBulkCheckResults(); // Clear results if no session
}

function handleLogout() { 
  authStore.logout(); 
}

watch(() => sessionStore.currentSelectedSessionId, (newSessionId, oldSessionId) => {  
    if (newSessionId) {  
        const currentRouteName = router.currentRoute.value.name;  
        if (currentRouteName === 'home' || currentRouteName === 'dashboard' || !newSessionId) {  
             router.push({ name: 'sessionActiveHome' }); 
        }
         // If not on bulkCheckNumbers, clear its specific logs
        if (route.name !== 'bulkCheckNumbers') {
          bulkCheckStore.setIsCheckingActive(false); // No longer actively displaying bulk check results
        }

    } else {  
        router.push({ name: 'sessionActiveHome' }); 
        bulkCheckStore.clearBulkCheckResults(); // Clear results if no session
    }
}, { immediate: true }); 

// Watch the route to clear bulk check status when navigating away from the bulk check panel
watch(() => route.name, (newRouteName) => {
  if (newRouteName !== 'bulkCheckNumbers') {
    bulkCheckStore.setIsCheckingActive(false);
    // Optionally clear data too: bulkCheckStore.clearBulkCheckResults();
  } else {
    bulkCheckStore.setIsCheckingActive(true); // Re-activate if navigating to it
  }
});
</script>

<style scoped> /* Changed from global to scoped */
.active-feature {
  @apply bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white shadow-md;
}
.feature-link {
  /* Copied from your existing feature links in the template for consistency */
  @apply text-sm px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-sm;
}

/* Ensure panel containers have a min-height or allow content to dictate height */
.panel-container-desktop {
  /* max-height: calc(100vh - 170px); /* from your global style.css, adjust if needed */
  /* Consider min-height too for consistency when content is small */
}
</style>
