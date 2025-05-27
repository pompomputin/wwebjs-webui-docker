<template>
  <main class="flex flex-col lg:flex-row gap-6 flex-grow">
    <aside class="lg:w-2/5 xl:w-1/3 w-full bg-white dark:bg-slate-800 p-0 rounded-xl shadow-2xl flex flex-col panel-container-desktop">
      <SessionManager @session-selected="onSessionSelected" @no-session-selected="onNoSessionSelected" /> 
    </aside>

    <section class="lg:w-3/5 xl:w-2/3 w-full bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-2xl panel-container-desktop flex flex-col overflow-y-auto custom-scrollbar">
      <div v-if="currentSessionId" id="interactionContainer" class="flex-grow flex flex-col">
        <header class="border-b border-gray-200 dark:border-slate-700 pb-3 mb-4 sticky top-0 bg-white dark:bg-slate-800 py-2 z-10">
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Interacting with: <span class="text-blue-600 dark:text-blue-400">{{ currentSessionId }}</span></h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 italic mt-1">
            Status: {{ selectedSessionData?.statusMessage || (selectedSessionData?.isReady ? 'Ready' : 'Loading...') }}
          </p>
        </header>
        
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

        <div class="flex-grow">
          <router-view /> 
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-auto pt-6 border-t border-gray-300 dark:border-slate-600">
          <ChatsPanel />
          <MessageLogPanel />
        </div>

      </div>
      <div v-else id="noSessionSelectedMsg" class="text-center py-10 flex-grow flex items-center justify-center">
        <p class="text-slate-500 dark:text-slate-400 text-lg">Please add and select a session to begin.</p>
      </div>
    </section>
  </main>
</template>

// src/views/DashboardView.vue

<script setup>
import SessionManager from '../components/SessionManager.vue';
import ChatsPanel from '../components/features/ChatsPanel.vue';
import MessageLogPanel from '../components/features/MessageLogPanel.vue';
// The feature panels (SendTextPanel, etc.) are loaded by <router-view />
// so they don't need to be explicitly imported here again if they are route components.

import { useSessionStore } from '../stores/sessionStore';
import { useRouter, useRoute } from 'vue-router';
import { watch, onMounted, ref, computed } from 'vue';

const sessionStore = useSessionStore();
const router = useRouter();
const route = useRoute(); // To get current route info if needed

// This computed property can simplify template access if sessionStore itself is an issue
const currentSessionId = computed(() => sessionStore.currentSelectedSessionId);
const selectedSessionData = computed(() => sessionStore.selectedSessionData);

// Event handlers for SessionManager component
function onSessionSelected(sessionId) {
  console.log('DashboardView: Session selected via event - ', sessionId);
  // sessionStore.selectSession(sessionId) should have been called by SessionManager
  // Now, navigate to a default feature view for this session if not already on one
  // or if the current feature view is not relevant.
  if (router.currentRoute.value.name === 'dashboard' || !router.currentRoute.value.path.startsWith(`/`)) { // Basic check
     router.push({ name: 'sessionActiveHome' }); // Default child for a session
  }
}

function onNoSessionSelected() {
  console.log('DashboardView: No session selected via event');
  // If coming from a session-specific route, navigate back to a base state
  if (router.currentRoute.value.name !== 'dashboard') {
    router.push({ name: 'dashboard' }); // Navigate to the main dashboard route which handles the "no session" message
  }
}

// Watch for Pinia state changes if direct navigation is needed from here
watch(() => sessionStore.currentSelectedSessionId, (newSessionId, oldSessionId) => {
    console.log('DashboardView: sessionStore.currentSelectedSessionId changed to', newSessionId);
    if (newSessionId) {
        // If current route is just the base or an unrelated one, navigate to a default child view for this session.
        // This ensures that when a session becomes active, a feature panel is shown.
        const currentRouteName = router.currentRoute.value.name;
        if (currentRouteName === 'dashboard' || currentRouteName === 'home') { // 'home' might be an old name for '/'
             router.push({ name: 'sessionActiveHome' }); // Default child, or e.g., 'sendText'
        }
    } else {
        // If session is deselected, navigate back to a base route
        // (The v-else in template handles showing "no session selected")
        if (router.currentRoute.value.name !== 'dashboard' && router.currentRoute.value.name !== 'home') {
            // router.push({ name: 'dashboard' }); // Avoids being stuck on a feature page with no session
        }
    }
}, { immediate: true }); // `immediate: true` can help initialize based on store state if needed, but be cautious.

onMounted(() => {
  console.log('DashboardView mounted. Current session:', sessionStore.currentSelectedSessionId);
  // If there's an initial session in the store and no specific feature route is active, navigate.
  if (sessionStore.currentSelectedSessionId && (router.currentRoute.value.name === 'dashboard' || router.currentRoute.value.name === 'home')) {
    router.push({ name: 'sessionActiveHome' });
  }
});
</script>
