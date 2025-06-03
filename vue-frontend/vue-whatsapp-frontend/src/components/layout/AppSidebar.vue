<template>
  <aside class="w-64 flex-shrink-0 bg-white dark:bg-slate-800 p-4 space-y-4 border-r border-gray-200 dark:border-slate-700 flex flex-col">
    <div class="flex items-center space-x-2 px-2 py-3">
      <router-link to="/" class="flex items-center space-x-2 focus:outline-none">
        <span class="bg-walazy-purple text-white text-2xl font-bold p-2 rounded-lg flex items-center justify-center w-10 h-10">W</span>
        <span class="text-xl font-semibold text-gray-700 dark:text-gray-200">WALazy</span>
      </router-link>
    </div>

    <nav class="flex-1 flex flex-col">
      <router-link
        to="/"
        class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-walazy-purple hover:text-white dark:hover:bg-walazy-purple"
        active-class="bg-walazy-purple text-white dark:bg-walazy-purple"
      >
        <SquaresPlusIcon class="h-6 w-6" />
        <span>Dashboard</span>
      </router-link>

      <div class="mt-4 mb-2 px-1">
        <label for="device-selector" class="sr-only">Select Device</label>
        <select
          id="device-selector"
          v-model="selectedSessionId"
          @change="onSessionSelect"
          class="block w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-walazy-purple focus:border-walazy-purple sm:text-sm bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
          :class="{ 'text-gray-500 dark:text-gray-400': !selectedSessionId }"
        >
          <option :value="null" disabled>-- Select Device --</option>
          <option v-if="sessionStore.isLoadingSessions" :value="null" disabled>Loading sessions...</option>
          <option v-for="session in sessionStore.sessionList" :key="session.sessionId" :value="session.sessionId">
            {{ session.sessionId }} </option>
          <option v-if="!sessionStore.isLoadingSessions && sessionStore.sessionList.length === 0" :value="null" disabled>No active sessions</option>
        </select>
      </div>

      <div class="mt-4">
        <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Main
        </h3>
        <div class="mt-2 space-y-1">
          <router-link
            v-for="item in mainMenu"
            :key="item.name"
            :to="item.to"
            class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-walazy-purple hover:text-white dark:hover:bg-walazy-purple"
            active-class="bg-walazy-purple text-white dark:bg-walazy-purple"
          >
            <component :is="item.icon" class="h-5 w-5" />
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </div>

      <div class="mt-6">
        <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Other
        </h3>
        <div class="mt-2 space-y-1">
          <router-link
            v-for="item in otherMenu"
            :key="item.name"
            :to="item.to"
            class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-walazy-purple hover:text-white dark:hover:bg-walazy-purple"
            active-class="bg-walazy-purple text-white dark:bg-walazy-purple"
          >
            <component :is="item.icon" class="h-5 w-5" />
            <span>{{ item.name }}</span>
          </router-link>
          <button
            @click="handleLogout"
            class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-walazy-purple hover:text-white dark:hover:bg-walazy-purple"
          >
            <ArrowLeftOnRectangleIcon class="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div class="flex-grow"></div>
    </nav>

    <div class="pt-6 px-3 text-xs text-gray-500 dark:text-gray-400">
        Version 5.x <span class="text-green-500">(Current)</span>
    </div>
  </aside>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore'; //
import { useSessionStore } from '@/stores/sessionStore'; //
import {
  SquaresPlusIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftEllipsisIcon,
  CommandLineIcon,
  CheckBadgeIcon,
  ClockIcon,
  FolderIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore(); //
const sessionStore = useSessionStore(); //

// Use a computed property to bind to v-model for the select
// This allows two-way binding with the store's currentSelectedSessionId
const selectedSessionId = computed({
  get: () => sessionStore.currentSelectedSessionId,
  set: (value) => {
    // This setter might not be strictly necessary if @change always calls selectSession
    // but it's good for explicit two-way binding patterns.
    if (value) {
      sessionStore.selectSession(value);
    }
  }
});

const onSessionSelect = (event) => {
  const newSessionId = event.target.value;
  if (newSessionId && newSessionId !== "null") { // Ensure it's a valid selection
    sessionStore.selectSession(newSessionId);
    // Optionally navigate to a specific device view or refresh current view
    // For now, selecting the session in the store is the main action.
    // If the DashboardHomePanel is watching currentSelectedSessionId, it might update.
  } else if (newSessionId === "null" || !newSessionId) { // Handle "-- Select Device --"
    sessionStore.selectSession(null);
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) { //
    sessionStore.fetchSessions(); //
  }
});

// Watch for changes in currentSelectedSessionId from the store
// and update the select element's value if it's managed externally.
// This is mostly handled by v-model on selectedSessionId computed property.
// watch(() => sessionStore.currentSelectedSessionId, (newId) => {
//   const selectElement = document.getElementById('device-selector');
//   if (selectElement) {
//     selectElement.value = newId === null ? "null" : newId;
//   }
// });


const mainMenu = [
  { name: 'Auto Responders', to: '/auto-responders', icon: ChatBubbleLeftRightIcon },
  { name: 'Phone Book', to: '/phone-book', icon: UserGroupIcon },
  { name: 'Campaigns', to: '/campaigns', icon: PaperAirplaneIcon },
  { name: 'Single Sender', to: '/single-sender', icon: ChatBubbleLeftEllipsisIcon },
  { name: 'Rest API', to: '/rest-api', icon: CommandLineIcon },
  { name: 'Bulk Check Numbers', to: '/bulk-check', icon: CheckBadgeIcon },
  { name: 'History Message', to: '/history-message', icon: ClockIcon },
];

const otherMenu = [
  { name: 'File Manager', to: '/file-manager', icon: FolderIcon },
  { name: 'Admin Menu', to: '/admin-menu', icon: UserCircleIcon },
];

const handleLogout = () => {
  authStore.logout(); //
};
</script>

<style scoped>
.router-link-exact-active {
  @apply bg-walazy-purple text-white dark:bg-walazy-purple;
}
/* Additional styling for the select if needed */
select:disabled {
  opacity: 0.7;
}
select option[disabled] {
  color: #9ca3af; /* Tailwind gray-400 */
}
html.dark select option[disabled] {
  color: #6b7280; /* Tailwind slate-500 */
}
</style>
