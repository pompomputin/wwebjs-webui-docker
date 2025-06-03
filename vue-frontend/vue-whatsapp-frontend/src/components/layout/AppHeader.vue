<template>
  <header class="bg-white dark:bg-slate-800 shadow-md p-4 flex items-center justify-between h-16">
    <div class="flex items-center">
      <div class="bg-walazy-purple text-white text-xs font-semibold px-3 py-1 rounded-full">
        SERVER - CONNECTED </div>
    </div>

    <div class="flex items-center space-x-3 sm:space-x-4">
      <div class="relative">
        <button
          @click="toggleDropdown('shortcuts')"
          class="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-walazy-purple dark:hover:text-walazy-purple focus:outline-none"
          aria-label="Shortcuts"
        >
          <Squares2X2Icon class="h-6 w-6" />
        </button>
        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div
            v-if="activeDropdown === 'shortcuts'"
            class="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden z-20 border border-gray-200 dark:border-slate-700"
          >
            <div class="py-2 px-3 border-b border-gray-200 dark:border-slate-700">
              <h3 class="font-semibold text-gray-700 dark:text-gray-200">Shortcuts</h3>
            </div>
            <div class="grid grid-cols-2 gap-2 p-3">
              <router-link v-for="shortcut in shortcuts" :key="shortcut.name" :to="shortcut.to" @click="activeDropdown = null"
                class="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 group">
                <component :is="shortcut.icon" class="h-7 w-7 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-walazy-purple dark:group-hover:text-walazy-purple" />
                <span class="text-xs text-center text-gray-600 dark:text-gray-300 group-hover:text-walazy-purple">{{ shortcut.name }}</span>
              </router-link>
            </div>
          </div>
        </transition>
      </div>

      <button
        @click="toggleTheme"
        class="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-walazy-purple dark:hover:text-walazy-purple focus:outline-none"
        aria-label="Toggle theme"
      >
        <SunIcon v-if="!themeStore.isDarkMode" class="h-6 w-6" />
        <MoonIcon v-else class="h-6 w-6" />
      </button>

      <button
        @click="openTemplateCustomizer"
        class="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-walazy-purple dark:hover:text-walazy-purple focus:outline-none"
        aria-label="Customize template"
      >
        <Cog6ToothIcon class="h-6 w-6" />
      </button>

      <div class="relative">
        <button
          @click="toggleDropdown('profile')"
          class="focus:outline-none flex items-center"
          aria-label="User menu"
        >
          <div class="h-8 w-8 rounded-full bg-walazy-purple text-white flex items-center justify-center text-sm font-semibold ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-whatsapp-green">
            {{ userInitials }}
          </div>
        </button>
        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div
            v-if="activeDropdown === 'profile'"
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-xl z-20 border border-gray-200 dark:border-slate-700 py-1"
          >
            <div class="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
              <p class="text-sm text-gray-700 dark:text-gray-200">Signed in as</p>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ authStore.user?.username }}</p>
            </div>
            <a href="#" @click.prevent="activeDropdown = null" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-walazy-purple">Help (Soon)</a>
            <a href="#" @click.prevent="handleLogout" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-walazy-purple">Log out</a>
          </div>
        </transition>
      </div>
    </div>
    </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useThemeStore } from '@/stores/themeStore'; //
import { useAuthStore } from '@/stores/authStore'; //
import {
  Squares2X2Icon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  UserGroupIcon, // Phone Book
  PaperAirplaneIcon, // Campaigns
  CommandLineIcon, // Rest API
  ChatBubbleLeftEllipsisIcon // Single Sender
} from '@heroicons/vue/24/outline';

const themeStore = useThemeStore(); //
const authStore = useAuthStore(); //

const activeDropdown = ref(null); // 'shortcuts', 'profile', or null

const toggleTheme = () => {
  themeStore.toggleTheme(); //
};

const toggleDropdown = (dropdownName) => {
  if (activeDropdown.value === dropdownName) {
    activeDropdown.value = null;
  } else {
    activeDropdown.value = dropdownName;
  }
};

const userInitials = computed(() => {
  const username = authStore.user?.username; //
  if (username) {
    return username.substring(0, 2).toUpperCase();
  }
  return '??';
});

const handleLogout = () => {
  activeDropdown.value = null; // Close dropdown
  authStore.logout(); //
};

const openTemplateCustomizer = () => {
  // For now, just log. Later, this will open the customizer panel.
  console.log('Open Template Customizer clicked');
  // isCustomizerOpen.value = true; // if using a local ref for the panel
  activeDropdown.value = null;
};

const shortcuts = [
  { name: 'Phone Book', to: '/phone-book', icon: UserGroupIcon },
  { name: 'Campaigns', to: '/campaigns', icon: PaperAirplaneIcon },
  { name: 'Rest API', to: '/rest-api', icon: CommandLineIcon },
  { name: 'Single Sender', to: '/single-sender', icon: ChatBubbleLeftEllipsisIcon },
];

// TODO: Implement click-away to close dropdowns
// onMounted(() => {
//   document.addEventListener('click', handleClickOutside);
// });
// onUnmounted(() => {
//  document.removeEventListener('click', handleClickOutside);
// });
// const handleClickOutside = (event) => {
//   if (activeDropdown.value && !event.target.closest('.relative')) { // Needs refinement
//     activeDropdown.value = null;
//   }
// };
</script>

<style scoped>
/* Additional styles for the header if needed */
</style>
