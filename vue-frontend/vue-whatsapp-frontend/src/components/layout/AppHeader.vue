<template>
  <header class="flex items-center justify-between p-4 bg-white dark:bg-slate-800 shadow-sm relative z-30">
    <div class="flex items-center">
      <button v-if="isMobile" @click="$emit('toggle-sidebar')" class="mr-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      </div>

    <div class="flex items-center space-x-4 text-gray-600 dark:text-gray-300">
      <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      
      <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 0 01-2 2h-2a2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 0 01-2 2H6a2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 0 01-2 2h-2a2 0 01-2-2v-2z" />
        </svg>
      </button>
      
      <button @click="themeStore.toggleTheme()" class="focus:outline-none text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
        <svg v-if="themeStore.isDarkMode" id="themeIconLight" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.325 6.675l-.707-.707M6.088 6.088l-.707-.707M18.912 6.088l-.707.707M6.088 18.912l-.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z" />
        </svg>
        <svg v-else id="themeIconDark" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <span class="text-sm font-medium">{{ currentTime }}</span>
      
      <button class="w-8 h-8 rounded-md bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
        <span>{{ authStore.user?.username.substring(0, 2).toUpperCase() }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

const authStore = useAuthStore();
const themeStore = useThemeStore();

const currentTime = ref('');
const isMobile = ref(false); 

const emit = defineEmits(['toggle-sidebar']);

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const handleResize = () => {
  isMobile.value = window.innerWidth < 768; 
};

onMounted(() => {
  updateTime();
  setInterval(updateTime, 1000);

  window.addEventListener('resize', handleResize);
  handleResize(); 
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* No specific styles needed here, Tailwind handles most layout */
</style>