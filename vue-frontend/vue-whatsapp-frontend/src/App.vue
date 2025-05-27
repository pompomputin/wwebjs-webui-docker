<template>
  <div :class="{ 'dark': themeStore.isDarkMode }" class="flex flex-col min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
    <AppHeader />
    <main class="container mx-auto p-4 lg:p-6 flex-grow">
      <router-view />
    </main>
    <footer class="text-center text-slate-500 dark:text-slate-400 text-xs py-6">
      <p>&copy; Multi-Device App - Vue Edition</p>
    </footer>
  </div>
</template>
<script setup>
import { onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import { useThemeStore } from './stores/themeStore';
const themeStore = useThemeStore();
onMounted(() => themeStore.initializeTheme());
</script>
