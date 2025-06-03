<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
    <div class="relative mx-auto p-6 border w-full max-w-sm shadow-lg rounded-xl bg-white dark:bg-slate-800 text-center">
      <h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 mb-2">Scan QR Code for {{ sessionId }}</h3>
       <div class="p-4 border border-gray-200 dark:border-slate-700 rounded-lg inline-block bg-white min-w-[232px] min-h-[232px] flex items-center justify-center">
        <qrcode-vue v-if="qrCode && typeof qrCode === 'string' && qrCode.length > 0" :value="qrCode" :size="200" level="H" />
        <div v-else class="text-gray-500 dark:text-gray-400">
          <p v-if="!qrCode || qrCode.length === 0">Waiting for QR code...</p>
        </div>
      </div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Scan this with your WhatsApp account.</p>
      <div class="mt-4">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-slate-900"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue';

defineProps({
  show: Boolean,
  qrCode: {
    type: String,
    default: ''
  },
  sessionId: String
});

defineEmits(['close']);
</script>