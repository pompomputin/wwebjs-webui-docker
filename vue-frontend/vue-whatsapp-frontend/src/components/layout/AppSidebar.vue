<template>
  <aside
    class="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
    :class="{ '-translate-x-full': !isOpen }"
  >
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
      <div class="flex items-center">
        <img src="/logo.png" alt="WALazy Logo" class="h-8 w-auto mr-3" />
        <span class="text-xl font-bold text-gray-800 dark:text-gray-200">WALazy</span>
      </div>
      <button v-if="isMobile" @click="$emit('toggle-sidebar')" class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="p-4 border-b border-gray-200 dark:border-slate-700">
      <div class="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        <span class="mr-2 px-3 py-1 rounded-full text-xs font-bold"
              :class="{'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100': isConnected,
                       'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100': !isConnected}">
          {{ isConnected ? 'SERVER - CONNECTED' : 'SERVER - DISCONNECTED' }}
        </span>
      </div>
      <div class="flex flex-col items-start space-y-1 text-sm">
        <div class="text-gray-500 dark:text-gray-400 text-sm">Devices</div>
        <div class="flex items-baseline space-x-1">
          <span class="text-green-500 font-bold text-lg">{{ sessionStore.sessionList.length }}</span>
          <span class="text-gray-600 dark:text-gray-300 text-sm">({{ onlineSessionsCount }} Online)</span>
        </div>
        <span class="text-gray-500 dark:text-gray-400 text-xs mt-1">Limit Device: Unlimited</span>
      </div>
    </div>

    <div class="p-4 border-b border-gray-200 dark:border-slate-700">
      <select
        v-model="selectedSessionId"
        @change="selectSession"
        class="form-select w-full"
        :class="{ 'border-red-500': !sessionStore.currentSelectedSessionId }"
      >
        <option :value="null" disabled>-- Select Device --</option>
        <option
          v-for="session in sessionStore.sessionList"
          :key="session.sessionId"
          :value="session.sessionId"
        >
          {{ session.sessionId }}
        </option>
      </select>
      <p v-if="sessionStore.currentSelectedSessionId" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Status: {{ sessionStore.selectedSessionData?.statusMessage || 'Loading...' }}
      </p>
    </div>

    <nav class="flex-grow p-4 space-y-2 custom-scrollbar overflow-y-auto">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">MAIN</p>
      <router-link
        v-for="item in mainMenuItems"
        :key="item.name"
        :to="{ name: item.route }"
        class="flex items-center px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
        :class="{ 'bg-walazy-purple text-white dark:bg-walazy-purple-light dark:text-slate-900': $route.name === item.route }"
      >
        <component :is="item.icon" class="h-5 w-5 mr-3" />
        <span>{{ item.label }}</span>
      </router-link>

      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-4 mb-2">OTHER</p>
      <router-link
        v-for="item in otherMenuItems"
        :key="item.name"
        :to="{ name: item.route }"
        class="flex items-center px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
        :class="{ 'bg-walazy-purple text-white dark:bg-walazy-purple-light dark:text-slate-900': $route.name === item.route }"
      >
        <component :is="item.icon" class="h-5 w-5 mr-3" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="p-4 border-t border-gray-200 dark:border-slate-700">
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span class="flex items-center">
          <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16L2 12l4-4" />
          </svg>
          Version 5.x
        </span>
        <span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100">Current</span>
      </div>
      <button
        @click="authStore.logout()"
        class="flex items-center w-full px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150"
      >
        <svg class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Log out</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useAuthStore } from '@/stores/authStore';
import { useRoute } from 'vue-router';
import { isSocketConnected } from '@/services/socket'; // NEW: Import reactive socket status

// Heroicons imports
import {
  HomeIcon,
  PhoneIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  CommandLineIcon,
  MagnifyingGlassCircleIcon,
  DocumentTextIcon,
  BookOpenIcon,
  GlobeAltIcon,
  ServerStackIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline'; 

const sessionStore = useSessionStore();
const authStore = useAuthStore();
const route = useRoute();

const selectedSessionId = ref(null);
const isMobile = ref(false); 

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['toggle-sidebar']);

// CHANGED: isConnected now directly uses the reactive isSocketConnected ref
const isConnected = computed(() => isSocketConnected.value); 

const onlineSessionsCount = computed(() => {
  return sessionStore.sessionList.filter(session => session.isReady).length;
});

watch(() => sessionStore.currentSelectedSessionId, (newId) => {
  selectedSessionId.value = newId;
});

watch(
  () => route.name,
  (newRouteName) => {
    // router-link handles active state
  },
  { immediate: true }
);

const mainMenuItems = [
  { label: 'Dashboard', route: 'dashboardHome', icon: HomeIcon },
  { label: 'Auto Responders', route: 'autoResponders', icon: ServerStackIcon },
  { label: 'Phone Book', route: 'phoneBook', icon: BookOpenIcon },
  { label: 'Campaigns', route: 'campaigns', icon: MegaphoneIcon },
  { label: 'Single Sender', route: 'singleSender', icon: PaperAirplaneIcon },
  { label: 'Rest API', route: 'restApi', icon: CommandLineIcon },
  { label: 'Bulk Check Numbers', route: 'bulkCheckNumbers', icon: MagnifyingGlassCircleIcon },
  { label: 'History Message', route: 'historyMessage', icon: DocumentTextIcon },
  { label: 'Plugins & Integration', route: 'pluginsIntegration', icon: UserGroupIcon }, 
  { label: 'Message Template', route: 'messageTemplate', icon: DocumentTextIcon }, 
  { label: 'Webhook Workflow', route: 'webhookWorkflow', icon: ServerStackIcon }, 
];

const otherMenuItems = [
  { label: 'File Manager', route: 'fileManager', icon: GlobeAltIcon }, 
  { label: 'Admin Menu', route: 'adminMenu', icon: UserGroupIcon }, 
];

const selectSession = () => {
  sessionStore.selectSession(selectedSessionId.value);
};

onMounted(() => {
  selectedSessionId.value = sessionStore.currentSelectedSessionId;
  isMobile.value = window.innerWidth < 768; 
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768;
  });
});
</script>

<style scoped>
img {
  max-height: 2rem; 
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-slate-400 dark:bg-slate-500 rounded-lg;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-500 dark:bg-slate-400;
}
</style>