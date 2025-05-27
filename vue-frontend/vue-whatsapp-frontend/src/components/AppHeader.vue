<template>
  <header class="bg-green-600 dark:bg-green-700 text-white p-4 sm:p-5 shadow-xl flex justify-between items-center sticky top-0 z-50 rounded-b-xl mb-6">
    <div>
      <h1 class="text-xl sm:text-2xl md:text-3xl font-bold">Multi-Device WhatsApp</h1>
      <p class="text-xs sm:text-sm italic opacity-90 mt-0.5">{{ sessionStore.globalStatusMessage || 'Manage your sessions.' }}</p>
    </div>
    <button @click="themeStore.toggleTheme" class="p-2 rounded-full hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 ring-inset ring-white/50 transition-colors" aria-label="Toggle theme">
      <svg v-if="themeStore.isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
    </button>
  </header>
</template>

<script setup>
import { useThemeStore } from '../stores/themeStore';
import { useSessionStore } from '../stores/sessionStore'; // For global status
const themeStore = useThemeStore();
const sessionStore = useSessionStore(); // Access global status
</script>
