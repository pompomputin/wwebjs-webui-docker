<template>
  <div class="flex h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
    <AppSidebar :isOpen="isSidebarOpen" @toggle-sidebar="toggleSidebar" />

    <div
      class="flex flex-col flex-1 transition-all duration-300 overflow-x-hidden"
      :class="{ 'ml-64': isSidebarOpen && !isMobile }"
    >
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <main class="flex-grow p-4 overflow-y-auto custom-scrollbar">
        <router-view />
      </main>
    </div>

    <div
      v-if="isSidebarOpen && isMobile"
      @click="toggleSidebar"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 transition-opacity duration-300"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';

const isSidebarOpen = ref(true); // Default to open on desktop
const isMobile = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleResize = () => {
  isMobile.value = window.innerWidth < 768; // Based on Tailwind's md breakpoint
  if (isMobile.value) {
    isSidebarOpen.value = false; // Close sidebar by default on mobile
  } else {
    isSidebarOpen.value = true; // Open sidebar by default on desktop
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial check
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* No specific styles needed here, Tailwind handles most layout */
</style>