<template>
  <div class="min-h-screen bg-gray-100 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
    <div class="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center mb-4">
          <span class="bg-walazy-purple text-white text-2xl font-bold p-2 rounded-lg">W</span>
          <h1 class="ml-3 text-3xl font-bold text-walazy-purple">WALazy</h1>
        </div>
        <p class="text-gray-600 dark:text-gray-300">Please sign-in to your account!</p>
      </div>

      <form @submit.prevent="performLogin">
        <div class="mb-6">
          <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
          <input
            type="text"
            id="username"
            v-model="username"
            required
            class="form-input block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-walazy-purple dark:focus:ring-walazy-purple-light focus:border-walazy-purple dark:focus:border-walazy-purple-light sm:text-sm transition-colors duration-150 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 caret-walazy-purple"
            placeholder="admin"
          />
        </div>

        <div class="mb-4">
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <div class="relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              required
              class="form-input block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-walazy-purple dark:focus:ring-walazy-purple-light focus:border-walazy-purple dark:focus:border-walazy-purple-light sm:text-sm transition-colors duration-150 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 caret-walazy-purple"
              placeholder="••••••••"
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-walazy-purple dark:hover:text-walazy-purple-light"
              aria-label="Toggle password visibility"
            >
              <EyeIcon v-if="!showPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              v-model="rememberMe"
              class="h-4 w-4 text-walazy-purple border-gray-300 dark:border-slate-600 rounded focus:ring-walazy-purple dark:focus:ring-offset-slate-800 bg-slate-50 dark:bg-slate-700"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Remember Me
            </label>
          </div>
          </div>

        <div v-if="authStore.loginError" class="mb-4 p-3 bg-red-100 dark:bg-red-700 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md text-sm">
          {{ authStore.loginError }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-walazy-purple hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-walazy-purple dark:focus:ring-offset-slate-800 disabled:opacity-50 transition ease-in-out duration-150 transform active:scale-95"
          >
            <svg v-if="authStore.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ authStore.isLoading ? 'Signing In...' : 'Sign In' }}
          </button>
        </div>
      </form>
    </div>

    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore'; //
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
// import { useRouter } from 'vue-router'; // Uncomment if you need programmatic navigation after login, though authStore handles it.

const authStore = useAuthStore(); //
// const router = useRouter(); // Uncomment if needed

const username = ref('');
const password = ref('');
const rememberMe = ref(false); // If you implement "Remember Me"
const showPassword = ref(false);

const performLogin = async () => {
  await authStore.login({ username: username.value, password: password.value });
  // The authStore's login action already handles routing on success.
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<style scoped>
/* Add any component-specific styles here if Tailwind utilities aren't enough. */
/* For the subtle dashed background elements, you might need something like this (and uncomment the HTML): */
/*
. -z-10 {
  z-index: -1;
}
If using dashed SVGs or more complex shapes for those background elements,
they would be handled differently. For now, focusing on the card.
*/
</style>
