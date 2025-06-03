<template>
  <div class="flex h-screen bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200">
    <AppSidebar />

    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />

      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-slate-900 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import { useThemeStore } from '@/stores/themeStore'; //
import { onMounted } from 'vue';

const themeStore = useThemeStore();

onMounted(() => {
  themeStore.initializeTheme(); // Ensure theme is applied when layout mounts
});
</script>

<style scoped>
/* Scoped styles for MainLayout if needed */
</style>
