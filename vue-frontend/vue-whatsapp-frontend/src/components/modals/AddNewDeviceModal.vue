<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
    <div class="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-xl bg-white dark:bg-slate-800">
      <div class="text-center">
        <h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 mb-4">Add New Device</h3>
        <div class="mt-2">
          <label for="sessionName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">Session Name</label>
          <input
            type="text"
            id="sessionName"
            v-model="newSessionId"
            placeholder="e.g., PersonalAcc"
            class="form-input block w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-walazy-purple focus:border-walazy-purple sm:text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 caret-walazy-purple"
          />
          <p v-if="errorMessage" class="text-red-500 text-xs mt-1 text-left">{{ errorMessage }}</p>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitDevice"
            :disabled="isLoading"
            class="px-4 py-2 text-sm font-medium text-white bg-walazy-purple hover:bg-opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-walazy-purple disabled:opacity-50"
          >
            {{ isLoading ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  isLoading: Boolean,
  errorMessage: String
});

const emit = defineEmits(['close', 'submit']);

const newSessionId = ref('');

watch(() => props.show, (newValue) => {
  if (!newValue) {
    newSessionId.value = ''; // Reset when modal is hidden
  }
});

const closeModal = () => {
  emit('close');
};

const submitDevice = () => {
  if (newSessionId.value.trim()) {
    emit('submit', newSessionId.value.trim());
  }
};
</script>
