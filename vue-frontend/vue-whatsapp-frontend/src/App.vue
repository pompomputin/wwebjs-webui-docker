<template>
  <router-view />
</template>

<script setup>
// You can import and initialize global stores or perform app-wide setup here if needed.
// For example, ensuring the theme is initialized on app load,
// though we also do it in MainLayout for authenticated routes.
import { useThemeStore } from '@/stores/themeStore'; //
import { onMounted } from 'vue';

const themeStore = useThemeStore(); //

onMounted(() => {
  themeStore.initializeTheme(); //
});
</script>

<style>
/*
  Any global styles that are not part of Tailwind's base/components/utilities
  or your src/style.css can potentially go here, but it's often better
  to keep them in src/style.css.
  The #app styling from your original src/style.css will still apply.
 
*/
html.dark {
  color-scheme: dark;
}
</style>
