import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(false);
  const htmlElement = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      isDarkMode.value = true;
    } else {
      htmlElement.classList.remove('dark');
      isDarkMode.value = false;
    }
    localStorage.setItem('theme', theme);
  }

  function initializeTheme() {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme) { applyTheme(storedTheme); } 
    else if (systemPrefersDark) { applyTheme('dark'); } 
    else { applyTheme('light'); }
  }

  function toggleTheme() {
    if (isDarkMode.value) { applyTheme('light'); } 
    else { applyTheme('dark'); }
  }

  return { isDarkMode, initializeTheme, toggleTheme, applyTheme };
});
