<template>
  <section id="getContactInfoPanel" class="feature-panel p-1 md:p-2 mb-6">
    <h3 class="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">Get Contact Info</h3>
    <div class="space-y-4">
      <div>
        <label for="contactIdInputForInfo" class="block text-sm font-medium text-slate-600 dark:text-slate-400">Contact Number/ID (e.g., 123... or id@c.us):</label>
        <input 
          type="text" 
          id="contactIdInputForInfo" 
          v-model="contactId" 
          class="form-input"
          placeholder="Enter full ID like number@c.us or just number"
        >
      </div>
      <button 
        @click="handleGetContactInfo" 
        class="btn btn-purple"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Fetching...' : 'Get Info' }}
      </button>
    </div>
    <div id="contactInfoResultDisplay" class="mt-4 text-sm p-3 border-t border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 rounded-md min-h-[100px]">
      <div v-if="fetchError" class="text-red-500 dark:text-red-400">{{ fetchError }}</div>
      <div v-if="contactInfo && !fetchError">
        <h4 class="font-semibold text-slate-800 dark:text-slate-100 text-md mb-2">
          {{ contactInfo.pushname || contactInfo.name || 'N/A' }} 
          <span class="text-xs text-slate-500 dark:text-slate-400">({{ contactInfo.number || contactInfo.id }})</span>
        </h4>
        <img v-if="contactInfo.profilePicUrl" :src="contactInfo.profilePicUrl" alt="Profile Pic" class="h-24 w-24 rounded-full my-2 border-2 border-slate-300 dark:border-slate-600 shadow-md">
        <p v-else class="text-xs text-slate-500 dark:text-slate-400 my-2">No profile picture.</p>
        <ul class="space-y-1 text-xs">
          <li><strong>ID:</strong> {{ contactInfo.id }}</li>
          <li><strong>Registered Name:</strong> {{ contactInfo.name || 'N/A' }}</li>
          <li><strong>Push Name:</strong> {{ contactInfo.pushname || 'N/A' }}</li>
          <li><strong>Number:</strong> {{ contactInfo.number || 'N/A' }}</li>
          <li><strong>Is Me:</strong> {{ contactInfo.isMe ? 'Yes' : 'No' }}</li>
          <li><strong>Is User:</strong> {{ contactInfo.isUser ? 'Yes' : 'No' }}</li>
          <li><strong>Is Group:</strong> {{ contactInfo.isGroup ? 'Yes' : 'No' }}</li>
          <li><strong>Is WA User:</strong> {{ contactInfo.isWAUser ? 'Yes' : 'No' }}</li>
          <li><strong>Is Blocked:</strong> {{ contactInfo.isBlocked ? 'Yes' : 'No' }}</li>
        </ul>
      </div>
      <p v-if="!contactInfo && !isLoading && !fetchError" class="text-slate-500 dark:text-slate-400">Enter a contact ID and click "Get Info".</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useSessionStore } from '../../stores/sessionStore';
import { getContactInfoApi } from '../../services/api';

const sessionStore = useSessionStore();

const contactId = ref('');
const contactInfo = ref(null);
const isLoading = ref(false);
const fetchError = ref('');

async function handleGetContactInfo() {
  if (!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady) {
    fetchError.value = 'Select a ready session first.';
    contactInfo.value = null;
    return;
  }
  if (!contactId.value.trim()) {
    fetchError.value = 'Please enter a Contact ID/Number.';
    contactInfo.value = null;
    return;
  }

  isLoading.value = true;
  fetchError.value = '';
  contactInfo.value = null;

  const result = await getContactInfoApi(
    sessionStore.currentSelectedSessionId,
    contactId.value.trim()
  );

  if (result.success && result.contactInfo) {
    contactInfo.value = result.contactInfo;
  } else {
    fetchError.value = `Error: ${result.error || 'Could not fetch contact info.'}`;
  }
  isLoading.value = false;
}
</script>
