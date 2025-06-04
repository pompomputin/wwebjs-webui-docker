<template>
  <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 relative w-11/12 max-w-2xl">
      <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">{{ isEditMode ? 'Edit Responder' : 'Add New Responder' }}</h3>
      
      <div class="bg-purple-100 dark:bg-walazy-purple-light/20 text-purple-800 dark:text-purple-100 px-4 py-2 rounded-lg text-sm mb-6 flex items-center">
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        You are {{ isEditMode ? 'editing' : 'creating' }} an autoresponder for device: <span class="font-bold ml-1">{{ sessionStore.currentSelectedSessionId }}</span>
      </div>

      <form @submit.prevent="submitForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="keyword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Keyword</label>
          <input type="text" id="keyword" v-model="form.keyword" class="form-input" placeholder="e.g., /help" required />
        </div>

        <div>
          <label for="messageType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Message Type</label>
          <select id="messageType" v-model="form.messageType" class="form-select" required>
            <option value="">-- Select One --</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
          </select>
        </div>

        <div>
          <label for="keywordType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Keyword Type</label>
          <select id="keywordType" v-model="form.keywordType" class="form-select" required>
            <option value="equal">Equal</option>
            <option value="contains">Contains</option>
            <option value="startsWith">Starts With</option>
            <option value="endsWith">Ends With</option>
            <option value="regex">Regex</option>
          </select>
        </div>

        <div>
          <label for="quoted" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Quoted</label>
          <select id="quoted" v-model="form.quoted" class="form-select" required>
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </div>

        <div>
          <label for="replyOnlyWhen" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Reply Only When</label>
          <select id="replyOnlyWhen" v-model="form.replyOnlyWhen" class="form-select" required>
            <option value="all">All</option>
            <option value="group">Group Only</option>
            <option value="private">Private Chat Only</option>
          </select>
        </div>

        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select id="status" v-model="form.status" class="form-select" required>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div class="md:col-span-2">
            <label for="messageContent" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Message Content (Text/URL/File)</label>
            <textarea v-if="form.messageType === 'text'" id="messageContent" v-model="form.messageContent" class="form-textarea" placeholder="Enter your reply text..."></textarea>
            <input v-else-if="form.messageType === 'image' || form.messageType === 'video' || form.messageType === 'document'" type="text" id="messageContent" v-model="form.messageContent" class="form-input" placeholder="Enter URL or select file..." />
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">Select a message type to enter content.</p>
        </div>


        <div class="md:col-span-2 flex justify-end space-x-3 mt-4">
          <button type="button" @click="closeModal" class="btn btn-light !w-auto px-4 py-2">
            Cancel
          </button>
          <button type="submit" :disabled="isSubmitting" class="btn btn-indigo !w-auto px-4 py-2">
            {{ isSubmitting ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Responder') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watchEffect } from 'vue';
import { useSessionStore } from '@/stores/sessionStore';

const emit = defineEmits(['close', 'add-responder', 'update-responder']);
const sessionStore = useSessionStore();

const props = defineProps({
  isEditMode: {
    type: Boolean,
    default: false,
  },
  responderData: {
    type: Object,
    default: null,
  },
});

const isSubmitting = ref(false);
const form = reactive({
  id: null,
  keyword: '',
  messageType: '',
  keywordType: 'equal',
  quoted: false,
  replyOnlyWhen: 'all',
  status: 'active',
  messageContent: '',
});

// Moved resetForm definition before watchEffect
const resetForm = () => {
  form.id = null;
  form.keyword = '';
  form.messageType = '';
  form.keywordType = 'equal';
  form.quoted = false;
  form.replyOnlyWhen = 'all';
  form.status = 'active';
  form.messageContent = '';
};


watchEffect(() => {
  if (props.isEditMode && props.responderData) {
    Object.assign(form, props.responderData);
  } else {
    resetForm(); // This will now correctly clear the form
  }
});


const closeModal = () => {
  emit('close');
};

const submitForm = async () => {
  if (!form.keyword || !form.messageType || !form.messageContent) {
    alert('Please fill all required fields: Keyword, Message Type, and Message Content.');
    return;
  }

  isSubmitting.value = true;
  
  const responderPayload = {
    sessionId: sessionStore.currentSelectedSessionId,
    ...form,
  };

  if (props.isEditMode) {
    emit('update-responder', responderPayload);
  } else {
    responderPayload.id = `ar-${Date.now()}`;
    emit('add-responder', responderPayload);
  }
  
  isSubmitting.value = false;
  closeModal();
};
</script>

<style scoped>
/* No specific styles needed here, Tailwind handles most styling */
</style>