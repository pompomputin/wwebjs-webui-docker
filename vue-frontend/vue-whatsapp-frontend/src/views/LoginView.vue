<template>
  <div class="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4">
    <div class="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl">
      <div class="text-center">
        <svg class="mx-auto h-12 w-auto text-green-600 dark:text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.393-.03.79-.03 1.188 0 1.13.094 1.976 1.057 1.976 2.192V7.5M12 14.25a3.75 3.75 0 000-7.5m-3.75 7.5a3.75 3.75 0 01-7.5 0V11.25A2.25 2.25 0 013 9h.084c1.178 0 2.12.902 2.12 2.007v1.168c0 .449.193.86.504 1.143a1.125 1.125 0 101.06 1.716A4.5 4.5 0 0012 14.25zM12 14.25a4.5 4.5 0 004.496-3.75c.072-.495.148-.99.224-1.484A2.251 2.251 0 0118.75 9h.084c1.251 0 2.25.999 2.25 2.25v3.75a3.75 3.75 0 01-7.5 0V11.25A2.25 2.25 0 0112.75 9h-.084a2.25 2.25 0 00-2.12 2.007v1.168c0 .449.193.86.504 1.143a1.125 1.125 0 101.06 1.716A4.5 4.5 0 0012 14.25z" />
        </svg>
        <h2 class="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          WhatsApp Multi-Device App
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="performLogin">
        <div>
          <label for="username" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
          <div class="mt-1">
            <input
              id="username"
              v-model="username"
              name="username"
              type="text"
              autocomplete="username"
              required
              class="form-input"
              placeholder="username"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
          <div class="mt-1">
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="form-input"
              placeholder="password"
            />
          </div>
        </div>

        <div v-if="authStore.loginError" class="rounded-md bg-red-50 dark:bg-red-900/30 p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700 dark:text-red-400">{{ authStore.loginError }}</p>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="btn btn-indigo w-full"
            :disabled="authStore.isLoading"
          >
            {{ authStore.isLoading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore'; // Adjust path if needed

const username = ref(''); // Pre-fill for convenience during development
const password = ref('');
const authStore = useAuthStore();

async function performLogin() {
  await authStore.login({ username: username.value, password: password.value });
  // The store's login action will handle redirection or error display
}
</script>
